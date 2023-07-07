import { NetworkMonitor } from "@adam-chalmers/network-monitor";
import { Details } from "@adam-chalmers/network-monitor/dist/types/details";
import { schedule } from "node-cron";

export interface CronConfig {
  pattern: string;
  action: {
    name: string;
    delay: number | { min: number; max: number };
    param: { command: string };
  };
}

export function setupCron(monitor: NetworkMonitor, jobs?: CronConfig[]) {
  if (!jobs) {
    return;
  }

  for (const job of jobs) {
    console.log(`Scheduling action ${job.action.name} with pattern ${job.pattern}`);

    schedule(job.pattern, async () => {
      let delay: number;
      if (typeof job.action.delay === "number") {
        delay = job.action.delay;
      } else {
        const diff = job.action.delay.max - job.action.delay.min;
        delay = job.action.delay.min + Math.floor(Math.random() * diff);
      }
      console.log(`${new Date().toLocaleString()} - Waiting ${delay}ms to fire action.`);
      await new Promise((resolve) => setTimeout(resolve, delay));

      const fakeHost: Details = {
        address: "127.0.0.1",
        aliveCount: 0,
        hostCount: 1,
        hosts: [],
        isOnline: false,
        name: "fakehost"
      };
      monitor.eventEmitter.emit(job.action.name, fakeHost, job.action.param);
    });
  }
}
