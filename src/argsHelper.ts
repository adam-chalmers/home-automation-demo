export function checkForMissingProperties<T extends Record<string, any>>(name: string, obj: T, ...required: (keyof T)[]): void {
    const missing: (keyof T)[] = [];
    for (const key of required) {
        if (obj[key] == null) {
            missing.push(key);
        }
    }
    if (missing.length > 0) {
        throw new Error(`${name} is missing one or more required properties: ${missing.join(", ")}`);
    }
}
