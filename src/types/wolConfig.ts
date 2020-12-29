import { Config } from "@adam-chalmers/network-monitor";

export interface WolConfig extends Config {
    wol: {
        broadcastAddress: string;
        enabled?: boolean;
    };
}
