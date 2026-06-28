import { Button, Space, Typography } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useRef, useState } from "react";
import { deleteAdminFile, uploadAdminFile } from "../../lib/admin-api";
import { HttpError } from "../../lib/http-error";
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const files = Array.isArray(value) ? value : value ? [value] : [];

  async function handleSelect(fileList: FileList | null) {
    if (!fileList?.length) return;
    setUploading(true);
    try {
      const uploaded = await Promise.all(Array.from(fileList).map((file) => uploadAdminFile(file)));
      const next = multiple ? [...files, ...uploaded] : [uploaded[uploaded.length - 1]];
      if (!multiple) {
        await Promise.allSettled(
          files.filter((file) => file.id !== next[0]?.id).map((file) => deleteAdminFile(file.id)),
        );
      }
      onChange?.(multiple ? next : next[0] ?? null);
      notifySuccess(`Đã tải lên ${uploaded.length} tệp`);
    } catch (error) {
      notifyError(error instanceof Error ? error.message : "Không thể tải tệp lên");
    } finally {
      setUploading(false);
    }
  }

  function removeFromValue(fileId: string) {
    const next = files.filter((file) => file.id !== fileId);
    onChange?.(multiple ? next : next[0] ?? null);
  }

  async function removeFile(fileId: string) {
    setDeletingId(fileId);
    try {
      await deleteAdminFile(fileId);
      notifySuccess("Đã xóa tệp khỏi R2");
    } catch (error) {
      if (error instanceof HttpError && error.status === 409) {
        notifySuccess("Đã gỡ khỏi biểu mẫu. Tệp sẽ được dọn sau khi lưu thay đổi.");
      } else {
        notifyError(error instanceof Error ? error.message : "Không thể xóa tệp");
        setDeletingId(null);
        return;
      }
    }
    removeFromValue(fileId);
    setDeletingId(null);
  }

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <input
        ref={inputRef}
        hidden
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(event) => {
          void handleSelect(event.target.files);
          event.target.value = "";
        }}
      />
      <Button
        htmlType="button"
        icon={<UploadOutlined />}
        loading={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {label ?? (multiple ? "Chọn và tải tệp" : "Chọn và tải tệp")}
      </Button>

      {files.length ? (
        <Space direction="vertical" style={{ width: "100%" }}>
          {files.map((file) => {
            const href = file.publicUrl || `${API_URL}${file.contentPath}`;
            return (
              <Space
                key={file.id}
                align="start"
                style={{
                  border: "1px solid #eef2f7",
                  borderRadius: 10,
                  justifyContent: "space-between",
                  padding: "8px 10px",
                  width: "100%",
                }}
              >
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
                  <Button danger type="link" loading={deletingId === file.id} onClick={() => void removeFile(file.id)}>
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
