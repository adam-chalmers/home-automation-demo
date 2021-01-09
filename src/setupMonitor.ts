import { Config as NetworkMonitorConfig, NetworkMonitor } from "@adam-chalmers/network-monitor";
import { checkForMissingProperties } from "./argsHelper";

export async function setupMonitor(config: NetworkMonitorConfig): Promise<NetworkMonitor> {
    checkForMissingProperties("Network monitor settings", config, "defaults");
    return new NetworkMonitor(config);
}
