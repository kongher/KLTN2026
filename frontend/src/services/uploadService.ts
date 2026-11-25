import api from "./api";
import type { ApiSuccess } from "../types/auth";

export type UploadedImage = {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
};

export async function uploadImage(file: File, folder?: string) {
  const formData = new FormData();
  formData.append("image", file);
  if (folder) {
    formData.append("folder", folder);
  }

  const { data } = await api.post<ApiSuccess<UploadedImage>>("/uploads/image", formData);
  return data.data;
}
