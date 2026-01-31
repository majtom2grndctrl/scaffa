/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import React from "react";
import { SkaffaInstanceBoundary } from "./instance";
import { SkaffaProvider } from "./provider";
import type { SkaffaAdapterConfig } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Test Component
// ─────────────────────────────────────────────────────────────────────────────

interface TestComponentProps {
  label: string;
  variant: "primary" | "secondary";
  style?: { color: string; fontSize: number };
  items?: Array<{ name: string; value: number }>;
}

function TestComponent({ label, variant, style, items }: TestComponentProps) {
  return (
    <div data-testid="test-component">
      <span data-testid="label">{label}</span>
      <span data-testid="variant">{variant}</span>
      {style && (
        <span data-testid="style">
          {style.color},{style.fontSize}
        </span>
      )}
      {items && (
        <div data-testid="items">
          {items.map((item, index) => (
            <div key={index} data-testid={`item-${index}`}>
              {item.name}:{item.value}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock Transport
// ─────────────────────────────────────────────────────────────────────────────

function createMockTransport() {
  let commandCallback: ((command: any) => void) | null = null;

  return {
    sendToHost: vi.fn(),
    onCommand: vi.fn((callback: (command: any) => void) => {
      commandCallback = callback;
    }),
    // Helper to simulate host commands
    simulateCommand: (command: any) => {
      if (commandCallback) {
        commandCallback(command);
      }
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("SkaffaInstanceBoundary - Override Application", () => {
  let mockTransport: ReturnType<typeof createMockTransport>;

  beforeEach(() => {
    mockTransport = createMockTransport();
    (window as any).skaffaRuntimeTransport = mockTransport;
  });

  const config: SkaffaAdapterConfig = {
    adapterId: "react-test",
    adapterVersion: "0.1.0",
    debug: false,
  };

  async function renderWithAdapter(
    Component: React.ComponentType<any>,
    props: any,
  ) {
    let result: ReturnType<typeof render> | undefined;
    await act(async () => {
      result = render(
        <SkaffaProvider config={config}>
          <Component {...props} />
        </SkaffaProvider>,
      );
    });
    return result as ReturnType<typeof render>;
  }

  it("renders wrapped component with original props when no overrides", async () => {
    const WrappedComponent = SkaffaInstanceBoundary(
      TestComponent,
      "test.component",
    );

    await renderWithAdapter(WrappedComponent, {
      label: "Original Label",
      variant: "primary",
    });

    expect(screen.getByTestId("label")).toHaveTextContent("Original Label");
    expect(screen.getByTestId("variant")).toHaveTextContent("primary");
  });

  it("applies simple prop override (/variant)", async () => {
    const WrappedComponent = SkaffaInstanceBoundary(
      TestComponent,
      "test.component",
    );

    await renderWithAdapter(WrappedComponent, {
      label: "Test",
      variant: "primary",
    });

    // Initial render
    expect(screen.getByTestId("variant")).toHaveTextContent("primary");

    // Get the instance ID from the DOM
    const instanceElement = screen.getByTestId("test-component").parentElement;
    const instanceId = instanceElement?.getAttribute("data-skaffa-instance-id");
    expect(instanceId).toBeTruthy();

    // Simulate host applying override
    await act(async () => {
      mockTransport.simulateCommand({
        type: "host.applyOverrides",
        ops: [
          {
            op: "set",
            instanceId,
            path: "/variant",
            value: "secondary",
          },
        ],
      });
    });

    // Wait for re-render
    await waitFor(() => {
      expect(screen.getByTestId("variant")).toHaveTextContent("secondary");
    });
  });

  it("applies nested prop override (/style/color)", async () => {
    const WrappedComponent = SkaffaInstanceBoundary(
      TestComponent,
      "test.component",
    );

    await renderWithAdapter(WrappedComponent, {
      label: "Test",
      variant: "primary",
      style: { color: "red", fontSize: 14 },
    });

    // Initial render
    expect(screen.getByTestId("style")).toHaveTextContent("red,14");

    // Get the instance ID
    const instanceElement = screen.getByTestId("test-component").parentElement;
    const instanceId = instanceElement?.getAttribute("data-skaffa-instance-id");

    // Apply nested override
    await act(async () => {
      mockTransport.simulateCommand({
        type: "host.applyOverrides",
        ops: [
          {
            op: "set",
            instanceId,
            path: "/style/color",
            value: "blue",
          },
        ],
      });
    });

    // Verify override applied
    await waitFor(() => {
      expect(screen.getByTestId("style")).toHaveTextContent("blue,14");
    });
  });

  it("applies array index override (/items/0/value)", async () => {
    const WrappedComponent = SkaffaInstanceBoundary(
      TestComponent,
      "test.component",
    );

    await renderWithAdapter(WrappedComponent, {
      label: "Test",
      variant: "primary",
      items: [
        { name: "First", value: 100 },
        { name: "Second", value: 200 },
      ],
    });

    // Initial render
    expect(screen.getByTestId("item-0")).toHaveTextContent("First:100");

    // Get the instance ID
    const instanceElement = screen.getByTestId("test-component").parentElement;
    const instanceId = instanceElement?.getAttribute("data-skaffa-instance-id");

    // Apply array index override
    await act(async () => {
      mockTransport.simulateCommand({
        type: "host.applyOverrides",
        ops: [
          {
            op: "set",
            instanceId,
            path: "/items/0/value",
            value: 999,
          },
        ],
      });
    });

    // Verify override applied
    await waitFor(() => {
      expect(screen.getByTestId("item-0")).toHaveTextContent("First:999");
    });
  });

  it("applies multiple overrides simultaneously", async () => {
    const WrappedComponent = SkaffaInstanceBoundary(
      TestComponent,
      "test.component",
    );

    await renderWithAdapter(WrappedComponent, {
      label: "Test",
      variant: "primary",
      style: { color: "red", fontSize: 14 },
    });

    // Initial render
    expect(screen.getByTestId("label")).toHaveTextContent("Test");
    expect(screen.getByTestId("variant")).toHaveTextContent("primary");
    expect(screen.getByTestId("style")).toHaveTextContent("red,14");

    // Get the instance ID
    const instanceElement = screen.getByTestId("test-component").parentElement;
    const instanceId = instanceElement?.getAttribute("data-skaffa-instance-id");

    // Apply multiple overrides
    await act(async () => {
      mockTransport.simulateCommand({
        type: "host.applyOverrides",
        ops: [
          {
            op: "set",
            instanceId,
            path: "/label",
            value: "Overridden Label",
          },
          {
            op: "set",
            instanceId,
            path: "/variant",
            value: "secondary",
          },
          {
            op: "set",
            instanceId,
            path: "/style/color",
            value: "green",
          },
        ],
      });
    });

    // Verify all overrides applied
    await waitFor(() => {
      expect(screen.getByTestId("label")).toHaveTextContent("Overridden Label");
      expect(screen.getByTestId("variant")).toHaveTextContent("secondary");
      expect(screen.getByTestId("style")).toHaveTextContent("green,14");
    });
  });

  it("attaches data attributes for selection", async () => {
    const WrappedComponent = SkaffaInstanceBoundary(
      TestComponent,
      "test.component",
    );

    await renderWithAdapter(WrappedComponent, {
      label: "Test",
      variant: "primary",
    });

    const instanceElement = screen.getByTestId("test-component").parentElement;

    // Verify data attributes
    expect(instanceElement?.hasAttribute("data-skaffa-instance-id")).toBe(true);
    expect(instanceElement?.getAttribute("data-skaffa-type-id")).toBe(
      "test.component",
    );
  });

  it("registers instance with adapter on mount", async () => {
    const WrappedComponent = SkaffaInstanceBoundary(
      TestComponent,
      "test.component",
    );

    await renderWithAdapter(WrappedComponent, {
      label: "Test",
      variant: "primary",
    });

    // Verify runtime.ready was sent
    expect(mockTransport.sendToHost).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "runtime.ready",
        adapterId: "react-test",
      }),
    );
  });

  it("creates intermediate objects for nested paths that do not exist", async () => {
    const WrappedComponent = SkaffaInstanceBoundary(
      TestComponent,
      "test.component",
    );

    await renderWithAdapter(WrappedComponent, {
      label: "Test",
      variant: "primary",
      // Note: style is undefined initially
    });

    // Get the instance ID
    const instanceElement = screen.getByTestId("test-component").parentElement;
    const instanceId = instanceElement?.getAttribute("data-skaffa-instance-id");

    // Apply nested override to non-existent path
    await act(async () => {
      mockTransport.simulateCommand({
        type: "host.applyOverrides",
        ops: [
          {
            op: "set",
            instanceId,
            path: "/style/color",
            value: "purple",
          },
        ],
      });
    });

    // Verify intermediate object was created and override applied
    await waitFor(() => {
      expect(screen.getByTestId("style")).toBeInTheDocument();
      expect(screen.getByTestId("style")).toHaveTextContent("purple");
    });
  });
});
