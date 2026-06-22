import { Space, Typography } from "antd";
import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  extra?: ReactNode;
};

export function PageHeader({ title, subtitle, extra }: PageHeaderProps) {
  return (
    <div className="admin-page-header">
      <div>
        <Typography.Title level={2} style={{ margin: 0 }}>
          {title}
        </Typography.Title>
        {subtitle ? (
          <Typography.Paragraph type="secondary" style={{ margin: "8px 0 0" }}>
            {subtitle}
          </Typography.Paragraph>
        ) : null}
      </div>
      {extra ? <Space>{extra}</Space> : null}
    </div>
  );
}
