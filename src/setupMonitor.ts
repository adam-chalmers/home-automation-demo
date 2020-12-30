import { Config, NetworkMonitor } from "@adam-chalmers/network-monitor";
import { setupGoogleHome } from "./setupGoogleHome";
import { setupWol } from "./setupWol";
import { GoogleHomeConfig } from "./types/googleHomeConfig";
import { WolConfig } from "./types/wolConfig";

function checkForMissingProperties<T extends Record<string, any>>(name: string, obj: T, ...required: (keyof T)[]): void {
    const missing: (keyof T)[] = [];
    for (const key of required) {
        if (obj[key] == null) {
            missing.push(key);
        }
    }
    if (missing.length > 0) {
        throw new Error(`${name} is missing one or more required properties: ${missing.join(", ")}`);
    }
}

export async function setupMonitor(config: Config): Promise<NetworkMonitor> {
    const monitor = new NetworkMonitor(config);

    const homeConfig = config as GoogleHomeConfig;
    if (homeConfig.googleHome != null) {
        checkForMissingProperties("Google Home settings", homeConfig.googleHome, "keyFilePath", "savedTokensPath");
        await setupGoogleHome(monitor, homeConfig);
    }

    const wolConfig = config as WolConfig;
    if (wolConfig.wol != null && wolConfig.wol.enabled !== false) {
        checkForMissingProperties("WOL settings", wolConfig.wol, "broadcastAddress");
        setupWol(monitor, wolConfig);
    }

    await monitor.startMonitoring();
    return monitor;
}
