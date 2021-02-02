export function getEnvironmentVariables<T extends string>(...variables: T[]): { [key in T]: string } {
    const obj: Partial<{ [key in T]: string }> = {};
    const missing: string[] = [];
    for (const variable of variables) {
        const value = process.env[variable];
        if (value == null) {
            missing.push(variable);
            continue;
        }

        obj[variable] = value;
    }

    if (missing.length > 0) {
        throw new Error(`Environment variable(s) were not defined: ${variables.join(", ")}`);
    }

    return obj as { [key in T]: string };
}
