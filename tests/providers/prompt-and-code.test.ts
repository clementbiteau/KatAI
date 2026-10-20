import { describe, expect, it } from "vitest";
import { findKata } from "../../katas/catalog.ts";
import { buildSystemPrompt, buildUserMessage, extractCode } from "../../lib/server/providers/prompt.ts";

describe("prompt (H2: the model only sees the spec and the signature)", () => {
  const kata = findKata("retail-cart")!;
  const request = { functionName: kata.functionName, signature: kata.signature, spec: "Sum the cart in cents." };

  it("names the expected function and signature, and asks for plain JavaScript only", () => {
    const system = buildSystemPrompt(request);
    expect(system).toContain(kata.signature);
    expect(system).toContain(`named ${kata.functionName}`);
    expect(system).toMatch(/no import/i);
    expect(system).toMatch(/one ```javascript code block/);
  });

  it("puts the user's spec, delimited, in the user message", () => {
    expect(buildUserMessage(request.spec)).toBe("<specification>\nSum the cart in cents.\n</specification>");
  });

  it("never includes the kata brief or tests", () => {
    const everything = buildSystemPrompt(request) + buildUserMessage(request.spec);
    expect(everything).not.toContain("140 stores");
    for (const test of kata.tests) expect(everything).not.toContain(test.label);
  });
});

describe("extractCode", () => {
  it("takes the first javascript code block", () => {
    const answer = "Here you go:\n```javascript\nfunction a() { return 1; }\n```\nAnd another:\n```js\nfunction b() {}\n```";
    expect(extractCode(answer)).toBe("function a() { return 1; }");
  });

  it.each(["js", "jsx", "mjs", ""])("accepts a block labelled %j", (language) => {
    expect(extractCode("```" + language + "\nconst a = 1;\n```")).toBe("const a = 1;");
  });

  it("removes export keywords the worker cannot run", () => {
    const answer = "```javascript\nexport function cartTotal() {}\nexport default cartTotal;\nexport const x = 1;\n```";
    expect(extractCode(answer)).toBe("function cartTotal() {}\ncartTotal;\nconst x = 1;");
  });

  it("returns null when there is no usable code block (CA4.7)", () => {
    expect(extractCode("I cannot help with that.")).toBeNull();
    expect(extractCode("```python\nprint(1)\n```")).toBeNull();
    expect(extractCode("```javascript\n   \n```")).toBeNull();
  });
});
