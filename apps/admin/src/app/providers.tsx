import { App as AntApp, ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import type { PropsWithChildren } from "react";
import { NotificationsBridge } from "../lib/notifications";
import { adminTheme } from "../styles/theme";

export function Providers({ children }: PropsWithChildren) {
  return (
    <ConfigProvider locale={viVN} theme={adminTheme}>
      <AntApp>
        <NotificationsBridge />
        {children}
      </AntApp>
    </ConfigProvider>
  );
}
