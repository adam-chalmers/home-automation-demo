# Home Automation Demo

A node application that makes use of the [wol](https://github.com/adam-chalmers/wol/packages/552897), [google-home](https://github.com/adam-chalmers/google-home/packages/552904) and [network-monitor](https://github.com/adam-chalmers/network-monitor/packages/553540) packages to perform actions based on connection state changes of configured network devices.

## Installation

To run this demo and have it integrate with a Google Home on the local network, follow the installation instructions [here](https://www.npmjs.com/package/google-assistant#installation).

## Configuration

This demo aims to be highly configurable by way of a configuration file, with multiple sections controlling various actions. An example configuration file, `exampleConfig.json` is included in this repository and is a good place to start. The configuration file location is specified by the `NETWORK_MONITOR_CONFIG_PATH` environment variable, which is a relative path to the config file. The config file is set up to be watched, so any changes to the config file will cause the monitors to be reloaded, as if the application was exited and run again.

##### Network Monitor Configuration

The `monitor` property of the configuration object controls the settings for the network monitor. For a full type definition of this object, see the type definition [here](https://github.com/adam-chalmers/network-monitor/blob/main/src/types/config.ts).

The `defaults` property is an object (see type definition [here](https://github.com/adam-chalmers/network-monitor/blob/main/src/types/defaults.ts)) that can control the default settings for individual monitors.

-   `hostPingRate`: Controls how often (in milliseconds) a host monitor will ping its configured host.
-   `hostPingRetries`: Controls how many consecutive ping checks a host needs to fail before it's considered to be disconnected from the network.
-   `networkPingRate` and `networkPingRetries`: Control the network connection monitor and its pinging of the configured gateway address, similar to the above `hostPingRate` and `hostPingRetries` properties.
-   `logHostConnectivityChanges`: Controls whether a console message is written or not when a host connects/disconnects from the network. Defaults to **false**.
-   `logNetworkConnectivityChanges`: Controls whether a console message is written or not when the network connectivity state changes. Defaults to **false**.
-   `logTasks`: Controls whether a console message is written or not when configured events are emitted. Defaults to **false**
-   `logHostTasks`: Controls whether a console message is written or not when configured host task events are emitted. Takes precedence over the `logTasks` default value. Defaults to **false**. -`logGroupTasks`: Controls whether a console message is written or not when configured group task events are emitted. Takes precedence over the `logTasks` default value. Defaults to **false**. -`logNetworkTasks`: Controls whether a console message is written or not when configured network connectivity change task events are emitted. Takes precedence over the `logTasks` default value. Defaults to **false**.

The `hosts` property is an array of objects (see type definition [here](https://github.com/adam-chalmers/network-monitor/blob/main/src/types/host.ts)) that configure a host to be monitored.

-   `name`: The name of the host, used for adding hosts to groups and log messages.
-   `address`: The local IP address of the host.
-   `pingRate`: Controls how often (in milliseconds) the monitor will ping the configured host. Defaults to `default.hostPingRate`.
-   `pingRetries`: Controls how many consecutive ping checks the host needs to fail before it's considered to be disconnected from the network. Defaults to `defaults.hostPingRetries`.
-   `onConnected`: An optional array of `TaskDefinition` objects (see below) to be fired when the host connects to the network.
-   `onDisconnected`: An optional array of `TaskDefinition` objects (see below) to be fired when the host disconnects from the network.
-   `logConnectivityChanges`: Controls whether a console message is written or not when the host connects/disconnects from the network. Defaults to `defaults.logConnectivityChanges`, then **false**.
-   `logTasks`: Controls whether a console message is written or not when configured events are emitted. Defaults to `defaults.logHostTasks`, then `defaults.logTasks`, then **false**.
-   `enabled`: Whether the host's status is monitored and events are emitted based on its state. Defaults to **true**.
-   Any additional properties in host objects will be passed through to any events that the host monitor raises.

The `groups` property is an array of objects (see type definition [here](https://github.com/adam-chalmers/network-monitor/blob/main/src/types/group.ts)) that configure a group of hosts to be monitored. This allows you to define sets of hosts that can fire tasks based on their overall status.

-   `name`: The name of the gorup, used for log messages.
-   `hosts`: An array of strings, that refer back to the `name`s of previously defined hosts.
-   `onAllConnected`: An optional array of `TaskDefinition` objects (see below) to be fired when a host in the group connects to the network, resulting in all hosts in the group being online.
-   `onAnyConnected`: An optional array of `TaskDefinition` objects (see below) to be fired when any host in the group connects to the network.
-   `onAllDisconnected`: An optional array of `TaskDefinition` objects (see below) to be fired when a host in the group disconnects from the network, resulting in all hosts in the group being offline.
-   `onAnyDisconnected`: An optional array of `TaskDefinition` objects (see below) to be fired when any host in the group disconnects from the network.
-   `logTasks`: Controls whether a console message is written or not when configured events are emitted. Defaults to `defaults.logGroupTasks`, then `defaults.logTasks`, then **false**.
-   `enabled`: Whether the group monitors its hosts and emits events based on their state. Defaults to **true**.
-   Any additional properties in group objects will be passed through to any events that the group monitor raises.

The `connectionMonitor` property is an object (see type definition [here](https://github.com/adam-chalmers/network-monitor/blob/main/src/types/connectionMonitorConfig.ts)) that configures the network connectivity monitor.

-   `gatewayAddress` The gateway address of the network that will be pinged to determine whether the device running this application is connected to the network or not.
-   `pingRate`: Controls how often (in milliseconds) the monitor will ping the configured gateway address. Defaults to `defaults.networkPingRate`.
-   `pingRetries`: Controls how many consecutive ping checks the gateway needs to fail before the device running this application is considered to be disconnected from the network. Defaults to `defaults.networkPingRetries`.
-   `onConnected`: An optional array of `TaskDefinition` objects (see below) to be fired when the device running this application connects to the network.
-   `onDisconnected`: An optional array of `TaskDefinition` objects (see below) to be fired when the device running this application disconnects from the network.
-   `logConnectivityChanges`: Controls whether a console message is written or not when the device running this application connects/disconnects from the network. Defaults to `defaults.logConnectivityChanges`, then **false**.
-   `logTasks`: Controls whether a console message is written or not when configured events are emitted. Defaults to `defaults.logNetworkTasks`, then `defaults.logTasks`, then **false**.
-   `enabled`: Whether the network connectivity status is monitored and events are emitted based on its state. Defaults to **true**.
-   Any additional properties in this object will be passed through to any events that the network connectivity monitor raises.

Task Definitions have the following properties (see type definition [here](https://github.com/adam-chalmers/network-monitor/blob/main/src/types/taskDefinition.ts)):

-   `name`: The name of the task that will be used for the corresponding event that's emitted.
-   `delay`: An optional delay (in milliseconds) between when the task is fired and when the corresponding event is emitted.
-   `dateRanges`: An optional array of date range objects (see below) that define a set of dates and times during which the task can be fired. Tasks that are part of events that occur outside of these date and time ranges aren't fired. If omitted, the task can always be fired regardless of date and time.
-   `enabled`: Whether the task will be fired or not when its corresponding event occurs. Defaults to **true**.
-   `param`: An optional object that can be used to pass details into emitted events. For example, in this demo, `wol` events require the `param` object to have the `hosts` property which is an array of strings that contain host names pointing to hosts that will be woken.

Date range objects (see type definition [here](https://github.com/adam-chalmers/network-monitor/blob/main/src/types/dateRange.ts)). Valid date range objects have one set of the following properties:

-   `dayStart`: An optional number from 0 to 6 inclusive representing a day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday) that functions as the starting day of an inclusive range of days. Defaults to **0**.
-   `dayEnd`: An optional number from 0 to 6 inclusive representing a day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday) that functions as the ending day of an inclusive range of days. Defaults to **6**.
    OR
-   `days`: An array of numbers from 0 to 6 inclusive representing days of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday) that functions as a list of days.

Date range objects can also have the optional `timeRanges` property, which is an array of time range objects. **If time ranges are omitted, then no time restriction is placed on the day range.** Time range objects have the following properties:

-   `timeStart`: An optional number (in minutes - 0 represents 00:00, 60 represents 01:00, 120 represents 02:00, 780 represents 13:00, etc.) representing the start of an inclusive range of times. If omitted, the time range is considered to be open-ended at the start (eg. no `timeStart` with a `timeEnd` of 1200 represents a range from 00:00 to 20:00, inclusive).
-   `timeEnd`: An optional number (in minutes - 0 represents 00:00, 60 represents 01:00, 120 represents 02:00, 780 represents 13:00, etc.) representing the end of an inclusive range of times. If omitted, the time range is considered to be open-ended at the end (eg. a `timeStart` of 600 with no `timeEnd` represents a range from 10:00 to 23:59, inclusive).
    Note that end times for time ranges don't take seconds and milliseconds into account - a `timeEnd` of 59 is effectively the same as 00:59:59.999.

##### Google Home Configuration

The optional `googleHome` property of the configuration object controls the settings for the google home integration, and contains the following properties:

-   `keyFilePath`: A string that points to the location of the generated key file,
-   `savedTokensPath`: A string that points to the location of saved tokens,
-   `initTimeout`: An optional number that specifies a timeout (in milliseconds) after which an error will be thrown if the google home instance has not yet been initialised. If omitted, then no errors will be thrown regardless of how long initialisation takes.
-   `logOnReady`: An optional boolean that controls whether a log message is written to the console upon initialisation of the google home instance. Defaults to **false**.
-   `enabled`: An optional boolean that controls whether google home functionality is initialised. Defaults to **true**.

Note that any task that is hooked up to google home integration requires the `param` property to be an object containing the `command` property, which is a string and is the text that will be sent to the google home (eg. "Turn the lights on").

##### WOL Configuration

The optional `wol` property of the configuration controls the settings for WOL functionality, and contains the following properties:

-   `broadcastAddress`: The broadcast IP address of the network, usually `255.255.255.255` that will be used when sending WOL packets on the network.
-   `enabled`: An optional boolean that controls whether WOL functionality is initialised. Defaults to **true**.

Note that any task that is hooked up to send WOL packets requires the `param` property to have the `hosts` property, which is an array of strings that contain host names pointing to hosts that will be woken.
