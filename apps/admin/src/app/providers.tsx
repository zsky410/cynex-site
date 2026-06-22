import { App as AntApp, ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import type { PropsWithChildren } from "react";
import { NotificationsBridge } from "../lib/notifications";

export function Providers({ children }: PropsWithChildren) {
  return (
    <ConfigProvider locale={viVN}>
      <AntApp>
        <NotificationsBridge />
        {children}
      </AntApp>
    </ConfigProvider>
  );
}
