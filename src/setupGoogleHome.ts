import path from "path";
import { NetworkMonitor } from "@adam-chalmers/network-monitor";
import { HomeConfig, GoogleHome } from "@adam-chalmers/google-home";
import { GoogleHomeConfig } from "./types/googleHomeConfig";

interface GoogleHomeParam {
    command: string;
}

function isGoogleHomeParam(param: Record<string, any>): param is GoogleHomeParam {
    return param.command != null && typeof param.command === "string";
}

export async function setupGoogleHome(monitor: NetworkMonitor, config: GoogleHomeConfig): Promise<GoogleHome> {
    const homeConfig: HomeConfig = {
        keyFilePath: path.join(__dirname, "..", config.googleHome.keyFilePath),
        savedTokensPath: path.join(__dirname, "..", config.googleHome.savedTokensPath),
        timeout: config.googleHome.timeout,
        logOnReady: config.googleHome.logOnReady
    };
    const home = new GoogleHome(homeConfig);
    await home.onInit;

    monitor.eventEmitter.addListener("home", async (details, param) => {
        if (param == null || !isGoogleHomeParam(param)) {
            throw new Error("Google Home tasks require a parameter in the form { command: string }");
        }

        try {
            await home.sendMessage(param.command);
        } catch (err) {
            console.error(`Error sending message to google home: ${err?.message}`);
        }
    });

    return home;
}
