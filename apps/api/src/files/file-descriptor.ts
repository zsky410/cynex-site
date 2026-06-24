export type FileDescriptor = {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  publicUrl?: string | null;
  contentPath: string;
};
