// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import HomePage from "../../app/page.tsx";

afterEach(() => cleanup());

describe("HomePage", () => {
  it("states what KatAI is for and leads to both sections", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Practice the spec, let the model write the code.");
    expect(screen.getByRole("link", { name: "Browse the katas" }).getAttribute("href")).toBe("/katas");
    expect(screen.getByRole("link", { name: "Try a randori" }).getAttribute("href")).toBe("/randori");
  });

  it("explains a kata in three steps, the brief never reaching the model", () => {
    render(<HomePage />);
    const steps = within(screen.getByRole("list", { name: "How a kata works" })).getAllByRole("listitem");
    expect(steps.map((step) => within(step).getByRole("heading").textContent)).toEqual(["Read the brief", "Write the spec", "Get scored"]);
    expect(steps[1]?.textContent).toContain("never the brief");
  });
});
