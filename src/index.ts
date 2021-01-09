import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.join(__dirname, "..", ".env") });

import fs from "fs";
import chokidar from "chokidar";
import { setupMonitor } from "./setupMonitor";
import { getEnvironmentVariables } from "./envHelper";
import { DemoConfig } from "./types/demoConfig";
import { NetworkMonitor } from "@adam-chalmers/network-monitor";
import { attachEvents as attachHomeEvents, setupGoogleHome } from "./setupGoogleHome";
import { attachEvents as attachWolEvents, setupWol } from "./setupWol";

const vars = getEnvironmentVariables("NETWORK_MONITOR_CONFIG_PATH");
const configPath = path.join(__dirname, "..", vars.NETWORK_MONITOR_CONFIG_PATH);
if (!fs.existsSync(configPath)) {
    throw new Error(`${configPath} does not exist`);
}

function loadConfig(): DemoConfig {
    const configFile = fs.readFileSync(configPath);
    const contents = configFile.toString("utf-8");
    return JSON.parse(contents) as DemoConfig;
}

async function addEventsAndStartMonitoring(monitor: NetworkMonitor, config: DemoConfig): Promise<void> {
    if (config.googleHome != null) {
        const home = await setupGoogleHome(config.googleHome);
        attachHomeEvents(home, monitor);
    }
    if (config.wol != null) {
        const wol = setupWol(config.wol);
        attachWolEvents(wol, monitor);
    }
    await monitor.startMonitoring();
}

async function run(): Promise<void> {
    const config = loadConfig();
    const monitor = await setupMonitor(config.monitor);
    addEventsAndStartMonitoring(monitor, config);

    chokidar.watch(configPath).on("change", () => {
        console.log("Detected changes to config file. Reloading...");
        const newConfig = loadConfig();
        monitor.loadConfig(newConfig.monitor);
        addEventsAndStartMonitoring(monitor, newConfig);
    });
}

run();
