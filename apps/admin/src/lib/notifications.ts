import { App, message } from "antd";
import type { MessageInstance } from "antd/es/message/interface";

let messageApi: MessageInstance | null = null;

export function NotificationsBridge() {
  const { message: scopedMessage } = App.useApp();
  messageApi = scopedMessage;
  return null;
}

export function notifySuccess(content: string) {
  if (messageApi) {
    void messageApi.success(content);
    return;
  }
  void message.success(content);
}

export function notifyError(content: string) {
  if (messageApi) {
    void messageApi.error(content);
    return;
  }
  void message.error(content);
}
