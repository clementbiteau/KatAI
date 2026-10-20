// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { KataBrief } from "../../../components/kata/kata-brief.tsx";

afterEach(() => cleanup());

describe("KataBrief", () => {
  it("renders paragraphs and bullet lists from the brief text", () => {
    render(<KataBrief brief={"Client: a retailer.\n\nRules:\n- First rule.\n- Second rule."} />);
    expect(screen.getByText("Client: a retailer.").tagName).toBe("P");
    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual(["First rule.", "Second rule."]);
  });

  it("shows markup as plain text, never as HTML", () => {
    const { container } = render(<KataBrief brief={"<img src=x onerror=alert(1)> is just text"} />);
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("<img src=x onerror=alert(1)> is just text")).toBeTruthy();
  });
});
