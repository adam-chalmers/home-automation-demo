import { getEnvironmentVariables } from "../src/envHelper";

describe("@adam-chalmers/home-automation-demo @unit envHelper.ts", () => {
    process.env.FIRST = "1";
    process.env.SECOND = "2";
    process.env.THIRD = "3";

    it("Should return an object with each environment variable and its relevant value", () => {
        const obj = getEnvironmentVariables("FIRST", "SECOND", "THIRD");
        expect(obj.FIRST).toEqual("1");
        expect(obj.SECOND).toEqual("2");
        expect(obj.THIRD).toEqual("3");
    });

    it("Should throw an error if an environment variable is missing", () => {
        expect(() => getEnvironmentVariables("FOURTH")).toThrowError("Environment variable(s) were not defined: FOURTH");
    });

    it("Should throw an error if multiple environment variables are missing", () => {
        expect(() => getEnvironmentVariables("FOURTH", "FIFTH")).toThrowError("Environment variable(s) were not defined: FOURTH, FIFTH");
    });
});
