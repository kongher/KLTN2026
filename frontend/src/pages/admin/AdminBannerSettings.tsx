import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ImageUpload from "../../components/ImageUpload";
import { useHomeContent } from "../../contexts/HomeContentContext";
import { updateHomeSettings } from "../../services/homeService";
import type { HomeBannerSlide, HomeSettings } from "../../types/home";
import { normalizeHomeSettings } from "../../utils/homeSettings";
import { getErrorMessage } from "../../utils/getErrorMessage";

function newSlideId() {
  return crypto.randomUUID();
}

function nextSortOrder(slides: HomeBannerSlide[]) {
  if (slides.length === 0) return 1;
  return Math.max(...slides.map((s) => s.sortOrder), 0) + 1;
}

function sortSlides(slides: HomeBannerSlide[]) {
  return [...slides].sort((a, b) => a.sortOrder - b.sortOrder);
}

function validateSlides(slides: HomeBannerSlide[]) {
  const orders = new Set<number>();
  for (const slide of slides) {
    if (!slide.image.trim()) {
      return "Mỗi banner phải có ảnh.";
    }
    if (!Number.isInteger(slide.sortOrder) || slide.sortOrder < 1) {
      return "Số thứ tự phải là số nguyên dương.";
    }
    if (orders.has(slide.sortOrder)) {
      return `Số thứ tự ${slide.sortOrder} bị trùng. Mỗi ảnh cần một số riêng.`;
    }
    orders.add(slide.sortOrder);
  }
  return "";
}

function validateDraft(
  image: string,
  sortOrder: number,
  slides: HomeBannerSlide[],
  editingId?: string
) {
  if (!image.trim()) {
    return "Vui lòng upload ảnh banner.";
  }
  if (!Number.isInteger(sortOrder) || sortOrder < 1) {
    return "Số thứ tự phải là số nguyên dương.";
  }
  const duplicate = slides.some(
    (s) => s.sortOrder === sortOrder && s.id !== editingId
  );
  if (duplicate) {
    return `Số thứ tự ${sortOrder} đã được dùng. Chọn số khác.`;
  }
  return "";
}

type BannerFormModalProps = {
  open: boolean;
  title: string;
  sortOrder: number;
  image: string;
  saving?: boolean;
  confirmLabel: string;
  modalError: string;
  onSortOrderChange: (value: number) => void;
  onImageChange: (url: string) => void;
  onClose: () => void;
  onConfirm: () => void;
};

function BannerFormModal({
  open,
  title,
  sortOrder,
  image,
  saving,
  confirmLabel,
  modalError,
  onSortOrderChange,
  onImageChange,
  onClose,
  onConfirm,
}: BannerFormModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      onClick={saving ? undefined : onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-spa-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-black/5 px-6 py-4">
          <h3 className="text-lg font-semibold text-spa-dark">{title}</h3>
        </div>

        <div className="space-y-5 overflow-y-auto px-6 py-5">
          {modalError ? <p className="text-sm text-rose-700">{modalError}</p> : null}

          <label className="block text-sm">
            <span className="text-spa-muted">Số thứ tự</span>
            <input
              type="number"
              min={1}
              max={99}
              required
              disabled={saving}
              className="mt-1 w-full max-w-[8rem] rounded-xl border px-3 py-2 disabled:opacity-60"
              value={sortOrder}
              onChange={(e) => onSortOrderChange(Number(e.target.value))}
            />
            <p className="mt-1 text-xs text-spa-muted">Không trùng các ảnh khác</p>
          </label>

          <ImageUpload
            label="Ảnh banner"
            value={image}
            folder="spa-home/banners"
            previewHeightClass="h-52 sm:h-56"
            previewFit="contain"
            onChange={onImageChange}
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-black/5 px-6 py-4">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="rounded-full border px-5 py-2.5 text-sm disabled:opacity-60"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={onConfirm}
            className="rounded-full bg-spa-primary px-5 py-2.5 text-sm text-white hover:bg-spa-dark disabled:opacity-60"
          >
            {saving ? "Đang lưu..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminBannerSettings() {
  const { settings, refresh } = useHomeContent();
  const [slides, setSlides] = useState<HomeBannerSlide[]>([]);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftSortOrder, setDraftSortOrder] = useState(1);
  const [draftImage, setDraftImage] = useState("");
  const [modalError, setModalError] = useState("");

  const modalBusy = saving && (addModalOpen || editModalOpen);

  useEffect(() => {
    const normalized = normalizeHomeSettings(settings);
    setSlides(sortSlides(normalized.bannerSlides || []));
  }, [settings]);

  const previewSorted = useMemo(() => sortSlides(slides), [slides]);

  async function persistSlides(nextSlides: HomeBannerSlide[]) {
    const sorted = sortSlides(nextSlides);
    const validation = validateSlides(sorted);
    if (validation) {
      throw new Error(validation);
    }
    const base = normalizeHomeSettings(settings) as HomeSettings;
    const payload: HomeSettings = {
      ...base,
      bannerSlides: sorted.map((s) => ({ ...s, alt: "" })),
    };
    if (!payload.tagline?.trim()) {
      payload.tagline = payload.name?.trim() || "Lumina Spa";
    }
    await updateHomeSettings(payload);
    await refresh();
    setSlides(sorted);
  }

  function openAddModal() {
    if (slides.length >= 12) {
      setError("Tối đa 12 ảnh banner.");
      return;
    }
    setError("");
    setModalError("");
    setDraftSortOrder(nextSortOrder(slides));
    setDraftImage("");
    setAddModalOpen(true);
  }

  function openEditModal(slide: HomeBannerSlide) {
    setModalError("");
    setEditingId(slide.id);
    setDraftSortOrder(slide.sortOrder);
    setDraftImage(slide.image);
    setEditModalOpen(true);
  }

  function closeModals() {
    setAddModalOpen(false);
    setEditModalOpen(false);
    setEditingId(null);
    setModalError("");
  }

  async function confirmAdd() {
    const validation = validateDraft(draftImage, draftSortOrder, slides);
    if (validation) {
      setModalError(validation);
      return;
    }
    const next: HomeBannerSlide[] = [
      ...slides,
      {
        id: newSlideId(),
        image: draftImage,
        sortOrder: draftSortOrder,
        alt: "",
      },
    ];
    setSaving(true);
    setModalError("");
    setError("");
    setMessage("");
    try {
      await persistSlides(next);
      setMessage("Đã thêm banner.");
      closeModals();
    } catch (err) {
      setModalError(getErrorMessage(err, "Không lưu được banner"));
    } finally {
      setSaving(false);
    }
  }

  async function confirmEdit() {
    if (!editingId) return;
    const validation = validateDraft(draftImage, draftSortOrder, slides, editingId);
    if (validation) {
      setModalError(validation);
      return;
    }
    const next = slides.map((row) =>
      row.id === editingId
        ? { ...row, image: draftImage, sortOrder: draftSortOrder }
        : row
    );
    setSaving(true);
    setModalError("");
    setError("");
    setMessage("");
    try {
      await persistSlides(next);
      setMessage("Đã cập nhật banner.");
      closeModals();
    } catch (err) {
      setModalError(getErrorMessage(err, "Không lưu được banner"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const next = slides.filter((row) => row.id !== id);
    setDeletingId(id);
    setError("");
    setMessage("");
    try {
      await persistSlides(next);
      setMessage("Đã xóa banner.");
    } catch (err) {
      setError(getErrorMessage(err, "Không xóa được banner"));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4 rounded-2xl bg-spa-white p-6 shadow-sm">
          <div>
            <Link to="/admin/settings" className="text-sm text-spa-primary hover:underline">
              ← Cài đặt trang chủ
            </Link>
            <p className="mt-3 text-xs uppercase tracking-[0.25em] text-spa-accent">Banner</p>
            <h2 className="mt-1 text-2xl font-semibold text-spa-dark">Slideshow banner</h2>
          </div>
          <Link
            to="/home"
            className="rounded-full border border-spa-primary/30 px-5 py-2.5 text-spa-dark hover:bg-spa-primary/10"
          >
            Xem trang chủ
          </Link>
        </div>

        {message ? <p className="text-sm text-spa-primary">{message}</p> : null}
        {error ? <p className="text-sm text-rose-700">{error}</p> : null}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={openAddModal}
            disabled={saving || deletingId !== null}
            className="rounded-full border px-5 py-2.5 text-sm hover:bg-spa-bg disabled:opacity-60"
          >
            Thêm ảnh banner
          </button>
        </div>

        <div className="space-y-4">
          {slides.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-black/10 bg-spa-white p-8 text-center text-sm text-spa-muted">
              Chưa có ảnh banner. Bấm &quot;Thêm ảnh banner&quot; để bắt đầu.
            </p>
          ) : (
            previewSorted.map((slide) => (
              <div
                key={slide.id}
                className="flex flex-col gap-4 rounded-2xl border border-black/5 bg-spa-white p-5 shadow-sm sm:flex-row sm:items-start"
              >
                <div className="shrink-0 overflow-hidden rounded-xl border border-black/10 bg-spa-bg sm:w-52">
                  <img
                    src={slide.image}
                    alt=""
                    className="h-36 w-full object-contain sm:h-40"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-spa-dark">
                      <span className="text-spa-muted">Số thứ tự: </span>
                      <span className="font-medium">#{slide.sortOrder}</span>
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        className="text-sm text-spa-primary hover:underline disabled:opacity-60"
                        disabled={saving || deletingId !== null}
                        onClick={() => openEditModal(slide)}
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        className="text-sm text-rose-700 hover:underline disabled:opacity-60"
                        disabled={saving || deletingId !== null}
                        onClick={() => void handleDelete(slide.id)}
                      >
                        {deletingId === slide.id ? "Đang xóa..." : "Xóa"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <BannerFormModal
        open={addModalOpen}
        title="Thêm ảnh banner"
        sortOrder={draftSortOrder}
        image={draftImage}
        saving={modalBusy}
        confirmLabel="Thêm banner"
        modalError={modalError}
        onSortOrderChange={setDraftSortOrder}
        onImageChange={setDraftImage}
        onClose={closeModals}
        onConfirm={() => void confirmAdd()}
      />

      <BannerFormModal
        open={editModalOpen}
        title="Sửa ảnh banner"
        sortOrder={draftSortOrder}
        image={draftImage}
        saving={modalBusy}
        confirmLabel="Cập nhật"
        modalError={modalError}
        onSortOrderChange={setDraftSortOrder}
        onImageChange={setDraftImage}
        onClose={closeModals}
        onConfirm={() => void confirmEdit()}
      />
    </>
  );
}