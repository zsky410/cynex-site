// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("antd", () => ({
  Table: ({ children }: { children?: ReactNode }) => <div data-testid="mock-table">{children}</div>,
}));

import { ResourceTable } from "./ResourceTable";

afterEach(() => cleanup());

describe("ResourceTable", () => {
  const columns = [{ title: "Tên", dataIndex: "name", key: "name" }];
  const rows = [{ id: "1", name: "Bản ghi 1" }];

  it("renders the bulk action bar when rows are selected", () => {
    render(
      <ResourceTable
        columns={columns}
        rows={rows}
        loading={false}
        page={1}
        perPage={25}
        total={1}
        onChangePage={vi.fn()}
        rowSelection={{
          selectedRowKeys: ["1"],
          onChange: vi.fn(),
          toolbar: <div>Thanh thao tác hàng loạt</div>,
        }}
      />,
    );

    expect(screen.getByText("Thanh thao tác hàng loạt")).toBeTruthy();
  });

  it("does not render the bulk action bar when nothing is selected", () => {
    render(
      <ResourceTable
        columns={columns}
        rows={rows}
        loading={false}
        page={1}
        perPage={25}
        total={1}
        onChangePage={vi.fn()}
        rowSelection={{
          selectedRowKeys: [],
          onChange: vi.fn(),
          toolbar: <div>Thanh thao tác hàng loạt</div>,
        }}
      />,
    );

    expect(screen.queryByText("Thanh thao tác hàng loạt")).toBeNull();
  });
});
