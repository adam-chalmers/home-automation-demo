import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.join(__dirname, "..", ".env") });

import fs from "fs";
import chokidar from "chokidar";
import { Config } from "@adam-chalmers/network-monitor";
import { setupMonitor } from "./setupMonitor";
import { getEnvironmentVariables } from "./envHelper";

const vars = getEnvironmentVariables("NETWORK_MONITOR_CONFIG_PATH");
const configPath = path.join(__dirname, "..", vars.NETWORK_MONITOR_CONFIG_PATH);
if (!fs.existsSync(configPath)) {
    throw new Error(`${configPath} does not exist`);
}

function loadConfig(): Config {
    const configFile = fs.readFileSync(configPath);
    const contents = configFile.toString("utf-8");
    return JSON.parse(contents) as Config;
}

async function run(): Promise<void> {
    const config = loadConfig();
    const monitor = await setupMonitor(config);
    chokidar.watch(configPath).on("change", () => {
        console.log("Detected changes to config file. Reloading...");
        monitor.loadConfig(loadConfig());
    });
}

run();
