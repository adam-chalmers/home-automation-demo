import { GoogleHome, HomeConfig } from "@adam-chalmers/google-home";
import { Config, NetworkMonitor } from "@adam-chalmers/network-monitor";
import { Host } from "@adam-chalmers/network-monitor/dist/types/host";
import { attachEvents, setupGoogleHome } from "../src/setupGoogleHome";
jest.mock("@adam-chalmers/google-home");

describe("@adam-chalmers/home-automation-demo @unit setupGoogleHome.ts", () => {
    const homeConfig: HomeConfig = { keyFilePath: "", savedTokensPath: "" };
    const host: Host = { address: "192.168.1.2", name: "test" };
    const monitorConfig: Config = {
        defaults: {
            hostPingRate: 1,
            hostPingRetries: 1,
            networkPingRate: 1,
            networkPingRetries: 1
        },
        hosts: [host]
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

    it("Should create an instance of the GoogleHome class", async () => {
        const home = await setupGoogleHome(homeConfig);
        expect(home instanceof GoogleHome).toEqual(true);
    });

    it("Should throw an error if required arguments are missing", async () => {
        await expect(setupGoogleHome({} as HomeConfig)).rejects.toThrow(); // Supply an empty object to trigger an error but cast to keep TypeScript happy
    });

    it("Should attach an event handler to the 'home' event", async () => {
        const home = await setupGoogleHome(homeConfig);
        attachEvents(monitor, home);
        expect(monitor.eventEmitter.emitter.listenerCount("home")).toEqual(1);
    });

    it("Should throw an error if no param is given", async () => {
        const home = await setupGoogleHome(homeConfig);
        attachEvents(monitor, home);

        // Initialise a handler with a default value to keep TS from complaining
        let errorHandler: jest.Mock<void, any> = jest.fn();
        await new Promise((resolve, reject) => {
            // Make the error handler resolve given that the error is expected
            errorHandler = jest.fn(resolve);

            // Attach the handler to the error event, then fire the event that should throw the error
            monitor.eventEmitter.emitter.on("error", errorHandler);
            monitor.eventEmitter.emit("home", { ...host, isOnline: true });

            // Set a timeout to reject just in case the error isn't called
            setTimeout(reject, 5000);
        });

        expect(errorHandler).toBeCalledTimes(1);
    });

    it("Should throw an error if the 'command' param is missing", async () => {
        const home = await setupGoogleHome(homeConfig);
        attachEvents(monitor, home);

        // Initialise a handler with a default value to keep TS from complaining
        let errorHandler: jest.Mock<void, any> = jest.fn();
        await new Promise((resolve, reject) => {
            // Make the error handler resolve the promise, given that the error is expected
            errorHandler = jest.fn(resolve);

            // Attach the handler to the error event, then fire the event that should throw the error
            monitor.eventEmitter.emitter.on("error", errorHandler);
            monitor.eventEmitter.emit("home", { ...host, isOnline: true }, {});

            // Set a timeout to reject just in case the error isn't called
            setTimeout(reject, 5000);
        });

        expect(errorHandler).toBeCalledTimes(1);
    });

    it("Should send a command to the google home", async () => {
        const home = await setupGoogleHome(homeConfig);
        attachEvents(monitor, home);

        const sendMessageSpy = jest.spyOn(home, "sendMessage").mockImplementation(Promise.resolve);
        monitor.eventEmitter.emit("home", { ...host, isOnline: true }, { command: "Do the thing" });

        expect(sendMessageSpy).toBeCalledTimes(1);
    });

    it("Should log errors thrown from the home instance when sending a message", async () => {
        const home = await setupGoogleHome(homeConfig);
        attachEvents(monitor, home);

        jest.spyOn(home, "sendMessage").mockImplementation(() => Promise.reject(new Error("Test error")));
        // Create a promise that times out after 5 seconds, and resolves once the 'home' event is emitted
        const eventPromise = new Promise<void>((resolve, reject) => {
            monitor.eventEmitter.addListener("home", () => resolve());
            setTimeout(reject, 5000);
        });

        // Emit the 'home' event and then wait for it to call all handlers so that we can ensure the error handling has been done
        monitor.eventEmitter.emit("home", { ...host, isOnline: true }, { command: "Do the thing" });
        await eventPromise;

        expect(errorSpy).toBeCalledTimes(1);
    });
});
