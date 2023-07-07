import { Config as NetworkMonitorConfig } from "@adam-chalmers/network-monitor";
import { WolConfig } from "./wolConfig";
import { HomeConfig } from "@adam-chalmers/google-home";
import { CronConfig } from "../setupCron";

export interface DemoConfig {
  monitor: NetworkMonitorConfig;
  wol?: WolConfig;
  googleHome?: HomeConfig & { enabled?: boolean };
  cron?: CronConfig[];
}
