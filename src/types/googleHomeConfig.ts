import { Config } from "@adam-chalmers/network-monitor";

export interface GoogleHomeConfig extends Config {
    googleHome: {
        keyFilePath: string;
        savedTokensPath: string;
        logOnReady?: boolean;
        timeout?: number;
    };
}
