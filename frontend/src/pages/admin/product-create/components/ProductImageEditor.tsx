import { useRef, type ChangeEvent } from 'react';
import { ImagePlus, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { FieldShell } from './FieldShell';
import type { ProductCreateFormValues } from '../productCreate.schema';

const inputClassName =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100';

export const ProductImageEditor = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { control, register, formState } = useFormContext<ProductCreateFormValues>();
  const { fields, append, remove, replace } = useFieldArray({ control, name: 'images' });
  const imageError = (formState.errors.images as { message?: string } | undefined)?.message;

  const handleFilePick = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) {
      return;
    }

    files.forEach((file, index) => {
      const previewUrl = URL.createObjectURL(file);
      append({
        url: previewUrl,
        altText: file.name.replace(/\.[^.]+$/, ''),
        displayOrder: String(fields.length + index),
        isPrimary: fields.length === 0 && index === 0,
      });
    });

    event.target.value = '';
  };

  return (
    <FieldShell
      label="Ảnh sản phẩm"
      error={imageError}
      action={
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 transition hover:bg-amber-100"
        >
          <ImagePlus size={14} />
          Tải ảnh lên
        </button>
      }
    >
      <div className="grid gap-4">
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFilePick} />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="group grid min-h-[180px] place-items-center rounded-3xl border-2 border-dashed border-slate-300 bg-[linear-gradient(180deg,rgba(250,246,240,0.96),rgba(255,255,255,0.96))] px-6 py-8 text-center transition hover:border-amber-300 hover:bg-[linear-gradient(180deg,rgba(255,250,240,0.98),rgba(255,255,255,0.98))]"
        >
          <div className="grid place-items-center gap-3 text-slate-500">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-700 transition group-hover:bg-amber-100">
              <ImagePlus size={24} />
            </div>
            <div>
              <p className="m-0 text-sm font-semibold text-slate-700">Bấm để tải ảnh hoặc kéo thả</p>
              <p className="m-0 mt-1 text-xs text-slate-500">Dùng ảnh vuông hoặc 4:3 để khớp dashboard.</p>
            </div>
          </div>
        </button>

        <div className="grid gap-3">
          {fields.map((field, index) => (
            <article key={field.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="grid grid-cols-[104px_minmax(0,1fr)] gap-3 p-3 sm:grid-cols-[128px_minmax(0,1fr)]">
                <div className="aspect-square overflow-hidden rounded-xl bg-slate-100">
                  {field.url ? (
                    <img src={field.url} alt={field.altText || 'Ảnh sản phẩm'} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-xs font-semibold text-slate-400">
                      Chưa có ảnh
                    </div>
                  )}
                </div>

                <div className="grid gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="m-0 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Ảnh {index + 1}</p>
                      <p className="m-0 mt-1 text-sm font-bold text-slate-900">Xem trước</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                    >
                      <Trash2 size={12} />
                      Xóa
                    </button>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <FieldShell label="URL ảnh" error={(formState.errors.images?.[index] as { url?: { message?: string } } | undefined)?.url?.message}>
                      <input {...register(`images.${index}.url`)} className={inputClassName} placeholder="Dán URL ảnh sau khi upload" />
                    </FieldShell>

                    <FieldShell label="Thứ tự hiển thị" error={(formState.errors.images?.[index] as { displayOrder?: { message?: string } } | undefined)?.displayOrder?.message}>
                      <input {...register(`images.${index}.displayOrder`)} type="number" min={0} className={inputClassName} placeholder="Nhập thứ tự hiển thị" />
                    </FieldShell>
                  </div>

                  <FieldShell label="Văn bản thay thế" error={(formState.errors.images?.[index] as { altText?: { message?: string } } | undefined)?.altText?.message}>
                    <input {...register(`images.${index}.altText`)} className={inputClassName} placeholder="Nhập mô tả ngắn cho ảnh" />
                  </FieldShell>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        replace(
                          fields.map((item, itemIndex) => ({
                            ...item,
                            isPrimary: itemIndex === index,
                          })),
                        )
                      }
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition ${
                        field.isPrimary
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'border border-slate-200 bg-slate-50 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700'
                      }`}
                    >
                      <Sparkles size={12} />
                      Ảnh đại diện
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-900"
          >
            <Plus size={16} />
            Thêm ảnh
          </button>
        </div>
      </div>
    </FieldShell>
  );
};
