import { WOL } from "@adam-chalmers/wol";
import { NetworkMonitor } from "@adam-chalmers/network-monitor";
import { HostMonitor } from "@adam-chalmers/network-monitor/dist/hostMonitor";
import { HostDetails } from "@adam-chalmers/network-monitor/dist/types/hostDetails";
import { WolConfig } from "./types/wolConfig";

interface WolParam {
    hosts: string[];
}

interface WolHostDetails extends HostDetails {
    wol: {
        mac: string;
        port: number;
    };
}

export function setupWol(monitor: NetworkMonitor, config: WolConfig): WOL {
    const wol = new WOL(config.wol.broadcastAddress);

    const hostsByName = monitor.hostMonitors.reduce((map, monitor) => map.set(monitor.name, monitor), new Map<string, HostMonitor>());

    monitor.eventEmitter.addListener("wol", async (details, param: WolParam) => {
        if (param == null) {
            throw new Error("WOL tasks require a parameter in the form { hosts: string[] }");
        }

        try {
            const promises: Promise<boolean>[] = [];
            for (const host of param.hosts) {
                const details = hostsByName.get(host)?.getHostDetails() as WolHostDetails | undefined;
                if (details == null) {
                    throw new Error(`WOL task was configured to wake a host by the name of '${host}', but no host by that name could be found`);
                }
                if (details.wol == null) {
                    throw new Error(`No WOL configuration was found for host ${host}`);
                }

                promises.push(wol.sendPacket({ mac: details.wol.mac, port: details.wol.port }));
            }
            await Promise.all(promises);
        } catch (err) {
            console.error(`Error sending WOL packet: ${err?.message}`);
        }
    });

    return wol;
}
