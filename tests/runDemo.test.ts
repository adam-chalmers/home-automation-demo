/* eslint-disable @typescript-eslint/no-empty-function */
import fs from "fs";
import chokidar from "chokidar";
import { EventEmitter } from "events";
import * as envHelper from "../src/envHelper";
import { DemoConfig } from "../src/types/demoConfig";
import { run } from "../src/runDemo";
import { GoogleHome } from "@adam-chalmers/google-home";
import * as monitorModule from "@adam-chalmers/network-monitor";
import * as setupWolModule from "../src/setupWol";
import * as setupHomeModule from "../src/setupGoogleHome";

jest.mock("@adam-chalmers/google-home");
jest.mock("@adam-chalmers/network-monitor");

describe("@adam-chalmers/home-automation-demo @unit runDemo.ts", () => {
    const config: DemoConfig = {
        monitor: {
            defaults: {
                hostPingRate: 1,
                hostPingRetries: 1,
                networkPingRate: 1,
                networkPingRetries: 1
            }
        }
    };

    const readFileSpy = jest.spyOn(fs, "readFileSync");
    function setup(config: DemoConfig): void {
        const configString = JSON.stringify(config);
        const configBuffer = Buffer.from(configString, "utf-8");
        readFileSpy.mockImplementation(() => configBuffer);
    }

    function createMockNetworkMonitor(): any {
        return {
            _connectionMonitor: null,
            connectionMonitor: null,
            eventEmitter: new EventEmitter(),
            _hostMonitors: [],
            hostMonitors: [],
            _groupMonitors: [],
            groupMonitors: [],
            addHosts: jest.fn(),
            addGroups: jest.fn(),
            createConnectionMonitor: jest.fn(),
            disposeMonitors: jest.fn(),
            forwardEvents: jest.fn(),
            loadConfig: jest.fn(),
            startMonitoring: jest.fn(),
            stopMonitoring: jest.fn()
        };
    }

    let watchSpy: jest.SpyInstance<chokidar.FSWatcher, Parameters<typeof chokidar.watch>>;
    let existsSyncSpy: jest.SpyInstance<boolean, Parameters<typeof fs.existsSync>>;

    beforeEach(() => {
        jest.spyOn(envHelper, "getEnvironmentVariables").mockImplementation(() => ({ NETWORK_MONITOR_CONFIG_PATH: "" }));
        // We only use .on("change") from the FSWatcher so we can safely mock it using a simple event emitter and emit the "change" event for testing purposes
        watchSpy = jest.spyOn(chokidar, "watch").mockImplementation(() => (new EventEmitter() as unknown) as chokidar.FSWatcher);
        existsSyncSpy = jest.spyOn(fs, "existsSync").mockImplementation(() => true);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("Should start the network monitoring process", async () => {
        setup(config);
        await run();
        expect(monitorModule.NetworkMonitor.prototype.startMonitoring).toHaveBeenCalledTimes(1);
    });

    it("Should setup google home events if a home config exists and is not disabled", async () => {
        const setupSpy = jest
            .spyOn(setupHomeModule, "setupGoogleHome")
            .mockImplementation((config) => Promise.resolve(new GoogleHome({ keyFilePath: "", savedTokensPath: "" })));
        const attachEventsSpy = jest.spyOn(setupHomeModule, "attachEvents").mockImplementation(() => {});
        setup({ ...config, googleHome: { keyFilePath: "", savedTokensPath: "" } });
        await run();
        expect(setupSpy).toHaveBeenCalledTimes(1);
        expect(attachEventsSpy).toHaveBeenCalledTimes(1);
    });

    it("Should not setup google home events if a home config does not exist", async () => {
        const setupSpy = jest
            .spyOn(setupHomeModule, "setupGoogleHome")
            .mockImplementation((config) => Promise.resolve(new GoogleHome({ keyFilePath: "", savedTokensPath: "" })));
        const attachEventsSpy = jest.spyOn(setupHomeModule, "attachEvents").mockImplementation(() => {});
        // jest.spyOn(monitorModule, "NetworkMonitor").mockImplementation(createMockNetworkMonitor);
        setup(config);
        await run();
        expect(setupSpy).toHaveBeenCalledTimes(0);
        expect(attachEventsSpy).toHaveBeenCalledTimes(0);
    });

    it("Should not setup google home events if a home config exists and is disabled", async () => {
        const setupSpy = jest
            .spyOn(setupHomeModule, "setupGoogleHome")
            .mockImplementation((config) => Promise.resolve(new GoogleHome({ keyFilePath: "", savedTokensPath: "" })));
        const attachEventsSpy = jest.spyOn(setupHomeModule, "attachEvents").mockImplementation(() => {});
        // jest.spyOn(monitorModule, "NetworkMonitor").mockImplementation(createMockNetworkMonitor);
        setup({ ...config, googleHome: { keyFilePath: "", savedTokensPath: "", enabled: false } });
        await run();
        expect(setupSpy).toHaveBeenCalledTimes(0);
        expect(attachEventsSpy).toHaveBeenCalledTimes(0);
    });

    it("Should setup wol events if a wol config exists and is not disabled", async () => {
        const setupSpy = jest.spyOn(setupWolModule, "setupWol").mockImplementation(() => () => Promise.resolve(true));
        const attachEventsSpy = jest.spyOn(setupWolModule, "attachEvents").mockImplementation(() => {});
        setup({ ...config, wol: { broadcastAddress: "" } });
        await run();
        expect(setupSpy).toHaveBeenCalledTimes(1);
        expect(attachEventsSpy).toHaveBeenCalledTimes(1);
    });

    it("Should not setup wol events if a wol config does not exist", async () => {
        const setupSpy = jest.spyOn(setupWolModule, "setupWol").mockImplementation(() => () => Promise.resolve(true));
        const attachEventsSpy = jest.spyOn(setupWolModule, "attachEvents").mockImplementation(() => {});
        setup(config);
        await run();
        expect(setupSpy).toHaveBeenCalledTimes(0);
        expect(attachEventsSpy).toHaveBeenCalledTimes(0);
    });

    it("Should not setup wol events if a wol config exists but is disabled", async () => {
        const setupSpy = jest.spyOn(setupWolModule, "setupWol").mockImplementation(() => () => Promise.resolve(true));
        const attachEventsSpy = jest.spyOn(setupWolModule, "attachEvents").mockImplementation(() => {});
        setup({ ...config, wol: { broadcastAddress: "", enabled: false } });
        await run();
        expect(setupSpy).toHaveBeenCalledTimes(0);
        expect(attachEventsSpy).toHaveBeenCalledTimes(0);
    });

    it("Should throw an error if the config path doesn't exist", async () => {
        existsSyncSpy.mockImplementation(() => false);
        expect(run()).rejects.toThrowError(/.*? does not exist/);
    });

    it("Should load the config from the given file and use it to set up a network monitor", async () => {
        const constructorSpy = jest.spyOn(monitorModule, "NetworkMonitor").mockImplementation(createMockNetworkMonitor);
        setup(config);
        await run();
        expect(constructorSpy).toBeCalledTimes(1);
        expect(constructorSpy).toBeCalledWith(config.monitor);
    });

    // TODO: mock the envHelper and make it return a path that can be used to check that the watcher was given the correct file path
    it("Should set up a watcher on the config file", async () => {
        setup(config);
        await run();
        expect(watchSpy).toBeCalledTimes(1);
        expect(watchSpy).toBeCalledWith();
    });

    //TODO: test that the reloading works as expected
});
