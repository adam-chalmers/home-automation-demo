import path from "path";
import fs from "fs";
import chokidar from "chokidar";
import { setupMonitor } from "./setupMonitor";
import { getEnvironmentVariables } from "./envHelper";
import { DemoConfig } from "./types/demoConfig";
import { NetworkMonitor } from "@adam-chalmers/network-monitor";
import { attachEvents as attachHomeEvents, setupGoogleHome } from "./setupGoogleHome";
import { attachEvents as attachWolEvents, setupWol } from "./setupWol";
import { setupCron } from "./setupCron";

function loadConfig(configPath: string): DemoConfig {
  const configFile = fs.readFileSync(configPath);
  const contents = configFile.toString("utf-8");
  return JSON.parse(contents) as DemoConfig;
}

async function addEventsAndStartMonitoring(monitor: NetworkMonitor, config: DemoConfig): Promise<void> {
  if (config.googleHome != null && config.googleHome.enabled !== false) {
    const home = await setupGoogleHome(config.googleHome);
    attachHomeEvents(monitor, home);
  }
  if (config.wol != null && config.wol.enabled !== false) {
    const wakeFunction = setupWol(config.wol);
    attachWolEvents(monitor, wakeFunction);
  }
  await monitor.startMonitoring();
}

export async function run(): Promise<void> {
  const vars = getEnvironmentVariables("NETWORK_MONITOR_CONFIG_PATH");
  const configPath = path.join(__dirname, "..", vars.NETWORK_MONITOR_CONFIG_PATH);
  if (!fs.existsSync(configPath)) {
    throw new Error(`${configPath} does not exist`);
  }

  const config = loadConfig(configPath);
  const monitor = await setupMonitor(config.monitor);
  setupCron(monitor, config.cron);
  await addEventsAndStartMonitoring(monitor, config);

  chokidar.watch(configPath).on("change", () => {
    console.log("Detected changes to config file. Reloading...");
    const newConfig = loadConfig(configPath);
    monitor.loadConfig(newConfig.monitor);
    addEventsAndStartMonitoring(monitor, newConfig);
  });
}
