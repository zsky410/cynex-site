import { Button, Space, Typography } from "antd";
import { useState } from "react";
import { uploadAdminFile } from "../../lib/admin-api";
import { notifyError, notifySuccess } from "../../lib/notifications";
import { API_URL } from "../../config";

export type AdminUploadedFile = {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  publicUrl?: string | null;
  contentPath: string;
};

export function AdminFileUploadField({
  value,
  onChange,
  multiple = false,
  accept,
  label,
}: {
  value?: AdminUploadedFile[] | AdminUploadedFile | null;
  onChange?: (value: AdminUploadedFile[] | AdminUploadedFile | null) => void;
  multiple?: boolean;
  accept?: string;
  label?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const files = Array.isArray(value) ? value : value ? [value] : [];

  async function handleSelect(fileList: FileList | null) {
    if (!fileList?.length) return;
    setUploading(true);
    try {
      const uploaded = await Promise.all(Array.from(fileList).map((file) => uploadAdminFile(file)));
      const next = multiple ? [...files, ...uploaded] : [uploaded[uploaded.length - 1]];
      onChange?.(multiple ? next : next[0] ?? null);
      notifySuccess(`Đã tải lên ${uploaded.length} tệp`);
    } catch (error) {
      notifyError(error instanceof Error ? error.message : "Không thể tải tệp lên");
    } finally {
      setUploading(false);
    }
  }

  function removeFile(fileId: string) {
    const next = files.filter((file) => file.id !== fileId);
    onChange?.(multiple ? next : next[0] ?? null);
  }

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <label>
        <input
          hidden
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(event) => {
            void handleSelect(event.target.files);
            event.target.value = "";
          }}
        />
        <Button htmlType="button" loading={uploading}>
          {label ?? (multiple ? "Tải tệp lên" : "Tải tệp lên")}
        </Button>
      </label>

      {files.length ? (
        <Space direction="vertical" style={{ width: "100%" }}>
          {files.map((file) => {
            const href = file.publicUrl || `${API_URL}${file.contentPath}`;
            return (
              <Space key={file.id} style={{ justifyContent: "space-between", width: "100%" }}>
                <Space direction="vertical" size={0}>
                  <Typography.Text strong>{file.fileName}</Typography.Text>
                  <Typography.Text type="secondary">
                    {file.mimeType} · {(file.size / 1024).toFixed(1)} KB
                  </Typography.Text>
                </Space>
                <Space>
                  <Typography.Link href={href} target="_blank" rel="noreferrer">
                    Mở
                  </Typography.Link>
                  <Button danger type="link" onClick={() => removeFile(file.id)}>
                    Gỡ
                  </Button>
                </Space>
              </Space>
            );
          })}
        </Space>
      ) : null}
    </Space>
  );
}
