import { Config, NetworkMonitor } from "@adam-chalmers/network-monitor";
import { attachEvents, setupWol } from "../src/setupWol";
import { WolConfig } from "../src/types/wolConfig";

jest.mock("@adam-chalmers/wol");

describe("@adam-chalmers/home-automation-demo @unit setupWol.ts", () => {
    const wolConfig: WolConfig = { broadcastAddress: "255.255.255.255" };
    const wolHost = {
        address: "192.168.1.2",
        name: "Has Wol",
        wol: {
            mac: "01:23:45:67:89:AB",
            port: 9
        }
    };
    const noWolHost = {
        address: "192.168.1.3",
        name: "No Wol"
    };
    const monitorConfig: Config = {
        defaults: {
            hostPingRate: 1,
            hostPingRetries: 1,
            networkPingRate: 1,
            networkPingRetries: 1
        },
        hosts: [wolHost, noWolHost]
    };

    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

    let monitor: NetworkMonitor;
    function setup(): void {
        monitor = new NetworkMonitor(monitorConfig);
    }

    beforeEach(() => {
        setup();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("Should create a function", () => {
        const wake = setupWol(wolConfig);
        expect(typeof wake === "function").toEqual(true);
    });

    it("Should throw an error if required arguments are missing", () => {
        expect(() => setupWol({} as WolConfig)).toThrow(); // Supply an empty object to trigger an error but cast to keep TypeScript happy
    });

    it("Should attach an event handler to the 'wol' event", () => {
        const wake = setupWol(wolConfig);
        attachEvents(monitor, wake);
        expect(monitor.eventEmitter.emitter.listenerCount("wol")).toEqual(1);
    });

    it("Should throw an error if no param is given", async () => {
        const wake = setupWol(wolConfig);
        attachEvents(monitor, wake);

        // Initialise a handler with a default value to keep TS from complaining
        let errorHandler: jest.Mock<void, any> = jest.fn();
        await new Promise((resolve, reject) => {
            // Make the error handler resolve given that the error is expected
            errorHandler = jest.fn((err) => resolve(err));

            // Attach the handler to the error event, then fire the event that should throw the error
            monitor.eventEmitter.emitter.on("error", errorHandler);
            monitor.eventEmitter.emit("wol", { ...noWolHost, isOnline: true });

            // Set a timeout to reject just in case the error isn't called
            setTimeout(reject, 5000);
        });

        expect(errorHandler).toBeCalledTimes(1);
    });

    it("Should throw an error if the 'hosts' param is missing", async () => {
        const wake = setupWol(wolConfig);
        attachEvents(monitor, wake);

        // Initialise a handler with a default value to keep TS from complaining
        let errorHandler: jest.Mock<void, any> = jest.fn();
        await new Promise((resolve, reject) => {
            // Make the error handler resolve given that the error is expected
            errorHandler = jest.fn((err) => resolve(err));

            // Attach the handler to the error event, then fire the event that should throw the error
            monitor.eventEmitter.emitter.on("error", errorHandler);
            monitor.eventEmitter.emit("wol", { ...noWolHost, isOnline: true }, {});

            // Set a timeout to reject just in case the error isn't called
            setTimeout(reject, 5000);
        });

        expect(errorHandler).toBeCalledTimes(1);
    });

    it("Should log an error if the host doesn't have a 'wol' configuration", async () => {
        const wake = setupWol(wolConfig);
        attachEvents(monitor, wake);

        const host = noWolHost;
        monitor.eventEmitter.emit("wol", { ...host, isOnline: true }, { hosts: [host.name] });

        expect(errorSpy).toBeCalledTimes(1);
    });

    it("Should log an error if the 'wol' param contains a host that doesn't exist", async () => {
        const wake = setupWol(wolConfig);
        attachEvents(monitor, wake);

        const host = wolHost;
        monitor.eventEmitter.emit("wol", { ...host, isOnline: true }, { hosts: ["Doesn't exist"] });

        expect(errorSpy).toBeCalledTimes(1);
    });

    it("Should send a WOL packet to the configured host", () => {
        const wake = jest.fn().mockImplementation(() => Promise.resolve(true));
        attachEvents(monitor, wake);

        const host = wolHost;
        monitor.eventEmitter.emit("wol", { ...host, isOnline: true }, { hosts: [host.name] });

        expect(wake).toBeCalledTimes(1);
    });
});
