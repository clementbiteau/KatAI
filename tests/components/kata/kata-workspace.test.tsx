// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AuthState } from "../../../components/auth/auth-context.tsx";
import type { AttemptState } from "../../../components/kata/use-attempt.ts";
import { findKata } from "../../../katas/catalog.ts";

let authState: AuthState = { status: "signed-out" };
let attemptState: AttemptState = { phase: "idle" };
const submit = vi.fn();

vi.mock("../../../components/auth/auth-context.tsx", () => ({ useAuthState: () => authState }));
vi.mock("../../../components/kata/use-attempt.ts", () => ({ useAttempt: () => ({ state: attemptState, submit }) }));
vi.mock("../../../components/history/attempt-history.tsx", () => ({ AttemptHistory: () => null }));

const { KataWorkspace } = await import("../../../components/kata/kata-workspace.tsx");
const kata = findKata("retail-cart")!;
const signedIn: AuthState = { status: "signed-in", user: { uid: "alice", email: "ada@example.com" } };

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  attemptState = { phase: "idle" };
});

describe("KataWorkspace", () => {
  it("asks a visitor to sign in, then come back to this kata (CA3.2)", () => {
    authState = { status: "signed-out" };
    render(<KataWorkspace kata={kata} />);
    expect(screen.getByRole("link", { name: "Sign in to practice" }).getAttribute("href")).toBe("/login?next=%2Fkatas%2Fretail-cart");
  });

  it("only enables submission for a spec of 1 to 4000 characters (CA4.4)", () => {
    authState = signedIn;
    render(<KataWorkspace kata={kata} />);
    const button = screen.getByRole("button", { name: "Generate and test" });
    expect(button.hasAttribute("disabled")).toBe(true);
    expect(screen.getByText("0 / 4000")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Your specification"), { target: { value: "Sum the cart." } });
    expect(button.hasAttribute("disabled")).toBe(false);
    fireEvent.change(screen.getByLabelText("Your specification"), { target: { value: "x".repeat(4001) } });
    expect(button.hasAttribute("disabled")).toBe(true);
    expect(screen.getByText("Your specification is longer than 4000 characters.")).toBeTruthy();
  });

  it("submits the spec with the default model, Claude Opus 5.5", () => {
    authState = signedIn;
    render(<KataWorkspace kata={kata} />);
    fireEvent.change(screen.getByLabelText("Your specification"), { target: { value: "Sum the cart." } });
    fireEvent.click(screen.getByRole("button", { name: "Generate and test" }));
    expect(submit).toHaveBeenCalledWith("Sum the cart.", "claude-opus-5-5");
  });

  it("blocks a second submission while the model is generating (CA4.2)", () => {
    authState = signedIn;
    attemptState = { phase: "generating" };
    render(<KataWorkspace kata={kata} />);
    fireEvent.change(screen.getByLabelText("Your specification"), { target: { value: "Sum the cart." } });
    expect(screen.getByRole("button", { name: "Generating…" }).hasAttribute("disabled")).toBe(true);
  });

  it("keeps the spec and links to Settings when the key is missing (CA4.3, CA4.12)", () => {
    authState = signedIn;
    const { rerender } = render(<KataWorkspace kata={kata} />);
    fireEvent.change(screen.getByLabelText("Your specification"), { target: { value: "Sum the cart." } });
    attemptState = { phase: "failed", message: "Add your Anthropic API key in Settings first.", action: "settings" };
    rerender(<KataWorkspace kata={kata} />);
    expect(screen.getByRole("alert").textContent).toContain("Add your Anthropic API key in Settings first.");
    expect(screen.getByRole("link", { name: "Open Settings" }).getAttribute("href")).toBe("/settings");
    expect((screen.getByLabelText("Your specification") as HTMLTextAreaElement).value).toBe("Sum the cart.");
  });
});
