// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { IntegrityWarningCell } from "./IntegrityWarningCell";

afterEach(() => cleanup());

describe("IntegrityWarningCell", () => {
  it("renders a warning icon when integrity warnings exist", () => {
    render(
      <IntegrityWarningCell
        integrityWarnings={[{ code: "missing_source", message: "Nguồn cung đã bị xóa." }]}
      />,
    );

    expect(screen.getByLabelText("Bản ghi cần cập nhật")).toBeTruthy();
  });

  it("renders nothing when integrity warnings are empty", () => {
    const { container } = render(<IntegrityWarningCell integrityWarnings={[]} />);
    expect(container.textContent).toBe("");
  });
});
