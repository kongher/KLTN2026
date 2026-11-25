import { useRef, useState, type ChangeEvent } from "react";
import { uploadImage } from "../services/uploadService";
import { getErrorMessage } from "../utils/getErrorMessage";

type ImageUploadProps = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  helperText?: string;
};

export default function ImageUpload({
  label,
  value,
  onChange,
  folder = "spa-management",
  helperText = "JPG, PNG, WEBP · tối đa 5MB",
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Chỉ chấp nhận file ảnh");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Ảnh phải nhỏ hơn hoặc bằng 5MB");
      return;
    }

    setUploading(true);
    setError("");
    try {
      const result = await uploadImage(file, folder);
      onChange(result.url);
    } catch (err) {
      setError(getErrorMessage(err, "Không tải được ảnh lên"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="text-sm">
      <p className="text-spa-muted">{label}</p>
      <div className="mt-2 overflow-hidden rounded-xl border border-black/10 bg-spa-bg">
        {value ? (
          <img src={value} alt={label} className="h-40 w-full object-cover" />
        ) : (
          <div className="flex h-40 items-center justify-center text-spa-muted">
            Chưa có ảnh
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="rounded-full bg-spa-primary px-4 py-2 text-white hover:bg-spa-dark disabled:opacity-50"
        >
          {uploading ? "Đang tải..." : value ? "Đổi ảnh" : "Upload ảnh"}
        </button>
        {value ? (
          <button
            type="button"
            disabled={uploading}
            onClick={() => onChange("")}
            className="rounded-full border px-4 py-2 disabled:opacity-50"
          >
            Xóa
          </button>
        ) : null}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => void handleFileChange(event)}
        />
      </div>

      <p className="mt-1 text-xs text-spa-muted">{helperText}</p>
      {error ? <p className="mt-1 text-xs text-rose-700">{error}</p> : null}
    </div>
  );
}
