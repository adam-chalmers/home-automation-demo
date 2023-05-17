/* eslint-disable @typescript-eslint/no-empty-function */
import fs from "fs";
import path from "path";
import chokidar from "chokidar";
import { EventEmitter } from "events";
import * as envHelper from "../src/envHelper";
import { DemoConfig } from "../src/types/demoConfig";
import { run } from "../src/runDemo";
import { GoogleHome } from "@adam-chalmers/google-home";
import * as monitorModule from "@adam-chalmers/network-monitor";
import * as setupWolModule from "../src/setupWol";
import * as setupHomeModule from "../src/setupGoogleHome";
import { WolConfig } from "../src/types/wolConfig";

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
  function setup(config: DemoConfig) {
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
  let chokidarEmitter: chokidar.FSWatcher;

  const configPath = "./monitorConfig.json";

  beforeEach(() => {
    jest.spyOn(envHelper, "getEnvironmentVariables").mockImplementation(() => ({ NETWORK_MONITOR_CONFIG_PATH: configPath }));
    // We only use .on("change") from the FSWatcher so we can safely mock it using a simple event emitter and emit the "change" event for testing purposes
    watchSpy = jest.spyOn(chokidar, "watch").mockImplementation(() => {
      chokidarEmitter = new EventEmitter() as unknown as chokidar.FSWatcher;
      return chokidarEmitter;
    });
    existsSyncSpy = jest.spyOn(fs, "existsSync").mockImplementation(() => true);
    jest.spyOn(console, "log").mockImplementation(() => {}); // Silence logging
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

  it("Should set up a watcher on the config file", async () => {
    setup(config);
    await run();
    expect(watchSpy).toBeCalledTimes(1);
    expect(watchSpy).toBeCalledWith(path.join(__dirname, "..", configPath));
  });

  it("Should reload the config on change", async () => {
    const setupSpy = jest.spyOn(setupWolModule, "setupWol").mockImplementation(() => () => Promise.resolve(true));
    const attachEventsSpy = jest.spyOn(setupWolModule, "attachEvents").mockImplementation(() => {});

    setup(config);
    await run();

    // Expect wol to have not been set up since default config doesn't have a wol configuration
    expect(setupSpy).toHaveBeenCalledTimes(0);
    expect(attachEventsSpy).toHaveBeenCalledTimes(0);

    const wolConfig: WolConfig = { broadcastAddress: "" };
    setup({ ...config, wol: wolConfig });
    chokidarEmitter.emit("change");

    // Expect wol to have now been set up since the newly defined config does have a wol configuration
    expect(setupSpy).toHaveBeenCalledTimes(1);
    expect(attachEventsSpy).toHaveBeenCalledTimes(1);
  });
});
