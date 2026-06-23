import { Button, Card, Flex, Form, Space } from "antd";
import type { ReactNode } from "react";

type FilterBarProps = {
  children: ReactNode;
  onReset?: () => void;
  submitLabel?: string;
  resetLabel?: string;
  extra?: ReactNode;
};

export function FilterBar({
  children,
  onReset,
  submitLabel = "Áp dụng",
  resetLabel = "Đặt lại",
  extra,
}: FilterBarProps) {
  return (
    <Card size="small" style={{ marginBottom: 16 }}>
      <Flex gap={16} vertical>
        <Flex justify="space-between" align="center" gap={16} wrap>
          <Space size="middle" wrap>
            {children}
          </Space>
          {extra}
        </Flex>
        <Form.Item style={{ marginBottom: 0 }}>
          <Space>
            <Button htmlType="submit" type="primary">
              {submitLabel}
            </Button>
            {onReset ? (
              <Button htmlType="button" onClick={onReset}>
                {resetLabel}
              </Button>
            ) : null}
          </Space>
        </Form.Item>
      </Flex>
    </Card>
  );
}
