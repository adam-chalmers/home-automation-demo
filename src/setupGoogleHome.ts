import path from "path";
import { NetworkMonitor } from "@adam-chalmers/network-monitor";
import { HomeConfig, GoogleHome } from "@adam-chalmers/google-home";
import { checkForMissingProperties } from "./argsHelper";

interface GoogleHomeParam {
    command: string;
}

function isGoogleHomeParam(param: Record<string, any>): param is GoogleHomeParam {
    return param.command != null && typeof param.command === "string";
}

export function attachEvents(monitor: NetworkMonitor, home: GoogleHome): void {
    monitor.eventEmitter.addListener("home", async (details, param) => {
        console.log("Home");
        if (param == null || !isGoogleHomeParam(param)) {
            throw new Error("Google Home tasks require a parameter in the form { command: string }");
        }

        try {
            await home.sendMessage(param.command);
        } catch (err) {
            console.error(`Error sending message to google home: ${err?.message}`);
        }
    });
}

export async function setupGoogleHome(config: HomeConfig): Promise<GoogleHome> {
    checkForMissingProperties("Google Home settings", config, "keyFilePath", "savedTokensPath");
    const homeConfig: HomeConfig = {
        keyFilePath: path.join(__dirname, "..", config.keyFilePath),
        savedTokensPath: path.join(__dirname, "..", config.savedTokensPath),
        timeout: config.timeout,
        logOnReady: config.logOnReady
    };
    const home = new GoogleHome(homeConfig);
    await home.onInit;

    return home;
}
