import { NetworkMonitor } from "@adam-chalmers/network-monitor";
import { GoogleHome } from "@adam-chalmers/google-home";
import { GoogleHomeConfig } from "./types/googleHomeConfig";

interface GoogleHomeParam {
    command: string;
}

export async function setupGoogleHome(monitor: NetworkMonitor, config: GoogleHomeConfig): Promise<GoogleHome> {
    const home = new GoogleHome(config.googleHome, config.googleHome.logOnReady);
    await home.onInit;

    monitor.eventEmitter.addListener("home", async (details, param: GoogleHomeParam) => {
        if (param == null || param.command == null) {
            throw new Error("Google Home tasks require a parameter in the form { command: string }");
        }

        try {
            home.sendMessage(param.command);
        } catch (err) {
            console.error(`Error sending message to google home: ${err?.message}`);
        }
    });

    return home;
}
