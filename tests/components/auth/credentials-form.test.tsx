// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
const signIn = vi.fn();
const signUp = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams("next=/settings"),
}));
vi.mock("../../../lib/auth/service.ts", () => ({ signIn, signUp }));

const { CredentialsForm } = await import("../../../components/auth/credentials-form.tsx");

function fillAndSubmit(email: string, password: string) {
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: password } });
  fireEvent.click(screen.getByRole("button"));
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => cleanup());

describe("CredentialsForm", () => {
  it("checks the password length before contacting the server", () => {
    render(<CredentialsForm mode="sign-up" />);
    fillAndSubmit("ada@example.com", "short");
    expect(screen.getByRole("alert").textContent).toBe("Choose a password of at least 8 characters.");
    expect(signUp).not.toHaveBeenCalled();
  });

  it("signs in, then goes to the requested internal page (CA1.3, CA1.7)", async () => {
    signIn.mockResolvedValue({ ok: true });
    render(<CredentialsForm mode="sign-in" />);
    fillAndSubmit("ada@example.com", "correct-horse");
    await waitFor(() => expect(push).toHaveBeenCalledWith("/settings"));
    expect(signIn).toHaveBeenCalledWith("ada@example.com", "correct-horse");
  });

  it("shows the server message and lets the user try again", async () => {
    signIn.mockResolvedValue({ ok: false, message: "Incorrect email or password." });
    render(<CredentialsForm mode="sign-in" />);
    fillAndSubmit("ada@example.com", "wrong-password");
    expect((await screen.findByRole("alert")).textContent).toBe("Incorrect email or password.");
    expect(screen.getByRole("button").hasAttribute("disabled")).toBe(false);
    expect(push).not.toHaveBeenCalled();
  });
});
