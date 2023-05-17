import { Config as NetworkMonitorConfig } from "@adam-chalmers/network-monitor";
import { WolConfig } from "./wolConfig";
import { HomeConfig } from "@adam-chalmers/google-home";

export interface DemoConfig {
  monitor: NetworkMonitorConfig;
  wol?: WolConfig;
  googleHome?: HomeConfig & { enabled?: boolean };
}
