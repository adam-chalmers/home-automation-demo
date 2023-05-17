import { Config, NetworkMonitor } from "@adam-chalmers/network-monitor";
import { setupMonitor } from "../src/setupMonitor";

describe("@adam-chalmers/home-automation-demo @unit setupMonitor.ts", () => {
  const monitorConfig: Config = {
    defaults: {
      hostPingRate: 1,
      hostPingRetries: 1,
      networkPingRate: 1,
      networkPingRetries: 1
    }
  };

  it("Should create an instance of the NetworkMonitor class", async () => {
    const monitor = await setupMonitor(monitorConfig);
    expect(monitor instanceof NetworkMonitor).toEqual(true);
  });

  it("Should throw an error if required arguments are missing", async () => {
    await expect(setupMonitor({} as Config)).rejects.toThrow(); // Supply an empty object to trigger an error but cast to keep TypeScript happy
  });
});
