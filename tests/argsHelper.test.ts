import { checkForMissingProperties } from "../src/argsHelper";

interface TestObject {
    one: number;
    two: string;
    three?: boolean;
}

describe("@adam-chalmers/home-automation-demo @unit argsHelper.ts", () => {
    const name = "test";
    const obj: TestObject = { one: 1, two: "two" };

    it("Should not throw an error when checking all properties", () => {
        expect(() => checkForMissingProperties(name, obj, "one", "two")).not.toThrow();
    });

    it("Should not throw an error when checking at least one property", () => {
        expect(() => checkForMissingProperties(name, obj, "one")).not.toThrow();
    });

    it("Should throw an error when one property is missing", () => {
        expect(() => checkForMissingProperties(name, obj, "three")).toThrowError(`${name} is missing one or more required properties: three`);
    });

    it("Should throw an error when more than one property is missing", () => {
        const name = "test";
        const obj: Partial<TestObject> = {};
        expect(() => checkForMissingProperties(name, obj, "one", "two")).toThrowError(`${name} is missing one or more required properties: one, two`);
    });
});
