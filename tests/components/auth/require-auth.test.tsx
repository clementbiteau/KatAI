// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AuthState } from "../../../components/auth/auth-context.tsx";

const replace = vi.fn();
let authState: AuthState = { status: "loading" };

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/settings",
}));
vi.mock("../../../components/auth/auth-context.tsx", () => ({ useAuthState: () => authState }));

const { RequireAuth } = await import("../../../components/auth/require-auth.tsx");

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("RequireAuth", () => {
  it("sends a signed-out visitor to the sign-in page, remembering where they wanted to go (CA1.7)", () => {
    authState = { status: "signed-out" };
    render(<RequireAuth>Private settings</RequireAuth>);
    expect(replace).toHaveBeenCalledWith("/login?next=%2Fsettings");
    expect(screen.queryByText("Private settings")).toBeNull();
  });

  it("shows the protected content to a signed-in user", () => {
    authState = { status: "signed-in", user: { uid: "alice", email: "ada@example.com" } };
    render(<RequireAuth>Private settings</RequireAuth>);
    expect(screen.getByText("Private settings")).toBeTruthy();
    expect(replace).not.toHaveBeenCalled();
  });

  it("explains when sign-in is not configured instead of redirecting forever", () => {
    authState = { status: "unavailable" };
    render(<RequireAuth>Private settings</RequireAuth>);
    expect(screen.getByRole("status").textContent).toContain("not available");
    expect(replace).not.toHaveBeenCalled();
  });
});
