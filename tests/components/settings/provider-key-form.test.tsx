// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ProviderKeyStatus } from "../../../lib/providers.ts";

const authorizedFetch = vi.fn();
vi.mock("../../../lib/api-client.ts", () => ({ authorizedFetch }));

const { ProviderKeyForm } = await import("../../../components/settings/provider-key-form.tsx");

const notConfigured: ProviderKeyStatus = { provider: "anthropic", configured: false, updatedAt: null };
const configured: ProviderKeyStatus = { provider: "anthropic", configured: true, updatedAt: "2026-10-19T10:00:00.000Z" };
const validKey = "sk-ant-test-" + "a".repeat(40);

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ProviderKeyForm", () => {
  it("saves a key, clears the field and reports the new status (CA2.1)", async () => {
    const onStatusChange = vi.fn();
    authorizedFetch.mockResolvedValue(jsonResponse(configured));
    render(<ProviderKeyForm status={notConfigured} onStatusChange={onStatusChange} />);
    fireEvent.change(screen.getByLabelText("Anthropic API key"), { target: { value: validKey } });
    fireEvent.click(screen.getByRole("button", { name: "Save key" }));
    await waitFor(() => expect(onStatusChange).toHaveBeenCalledWith(configured));
    expect(authorizedFetch).toHaveBeenCalledWith("/api/keys", { method: "POST", body: { provider: "anthropic", key: validKey } });
    expect((screen.getByLabelText("Anthropic API key") as HTMLInputElement).value).toBe("");
  });

  it("checks the key shape before sending anything (CA2.5)", () => {
    render(<ProviderKeyForm status={notConfigured} onStatusChange={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Anthropic API key"), { target: { value: "short" } });
    fireEvent.click(screen.getByRole("button", { name: "Save key" }));
    expect(screen.getByRole("alert").textContent).toBe(
      "This does not look like an API key: it should be 20 to 300 characters long.",
    );
    expect(authorizedFetch).not.toHaveBeenCalled();
  });

  it("shows only the status and date of a configured key, and can delete it (CA2.2, CA2.4)", async () => {
    const onStatusChange = vi.fn();
    authorizedFetch.mockResolvedValue(jsonResponse(notConfigured));
    render(<ProviderKeyForm status={configured} onStatusChange={onStatusChange} />);
    expect(screen.getByText(/Configured on/).textContent).toContain("2026");
    fireEvent.click(screen.getByRole("button", { name: "Delete key" }));
    await waitFor(() => expect(onStatusChange).toHaveBeenCalledWith(notConfigured));
    expect(authorizedFetch).toHaveBeenCalledWith("/api/keys?provider=anthropic", { method: "DELETE" });
  });

  it("shows the server's message when saving fails", async () => {
    authorizedFetch.mockResolvedValue(jsonResponse({ error: "Saving keys is not available right now." }, 503));
    render(<ProviderKeyForm status={notConfigured} onStatusChange={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Anthropic API key"), { target: { value: validKey } });
    fireEvent.click(screen.getByRole("button", { name: "Save key" }));
    expect((await screen.findByRole("alert")).textContent).toBe("Saving keys is not available right now.");
  });
});
