import { describe, expect, it } from "vitest";
import { checkFunctionCounts, countFunctions } from "../../../scripts/structure/functions.ts";

describe("countFunctions", () => {
  it("counts declarations, methods, accessors and constructors", () => {
    const source = `
      function declared() {}
      class Service {
        constructor() {}
        method() {}
        get value() { return 1; }
        set value(next: number) {}
      }
    `;
    expect(countFunctions(source, "sample.ts")).toBe(5);
  });

  it("counts functions assigned to variables, properties and default exports", () => {
    const source = `
      const arrow = () => 1;
      const expression = function () { return 2; };
      const holder = { handler: () => 3, method() { return 4; } };
      export default () => 5;
    `;
    expect(countFunctions(source, "sample.ts")).toBe(5);
  });

  it("does not count anonymous functions passed directly as arguments", () => {
    const source = `
      [1, 2].map((value) => value * 2);
      describe("suite", () => { it("case", () => {}); });
      new Promise((resolve) => resolve(1));
    `;
    expect(countFunctions(source, "sample.ts")).toBe(0);
  });

  it("does not count inline JSX event handlers", () => {
    const source = `
      export function Button() {
        return <button onClick={() => console.log("clicked")}>Go</button>;
      }
    `;
    expect(countFunctions(source, "sample.tsx")).toBe(1);
  });

  it("does not count overload signatures or ambient declarations", () => {
    const source = `
      declare function ambient(): void;
      function overloaded(value: string): string;
      function overloaded(value: number): number;
      function overloaded(value: unknown) { return value; }
    `;
    expect(countFunctions(source, "sample.ts")).toBe(1);
  });
});

describe("checkFunctionCounts", () => {
  const sources: Record<string, string> = {
    "five.ts": "function a() {}\nfunction b() {}\nfunction c() {}\nfunction d() {}\nfunction e() {}",
    "six.ts": "function a() {}\nfunction b() {}\nfunction c() {}\nfunction d() {}\nfunction e() {}\nfunction f() {}",
    "notes.md": "function a() {} function b() {} function c() {} function d() {} function e() {} function f() {}",
  };
  const readSource = (path: string) => sources[path] ?? "";

  it("reports only code files above the limit", () => {
    expect(checkFunctionCounts(Object.keys(sources), readSource)).toEqual([
      { rule: "functions-per-file", path: "six.ts", actual: 6, limit: 5 },
    ]);
  });
});
