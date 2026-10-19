// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import HomePage from "../../app/page.tsx";

afterEach(() => cleanup());

describe("HomePage", () => {
  it("shows the product name as the main heading", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("KatAI");
  });
});
