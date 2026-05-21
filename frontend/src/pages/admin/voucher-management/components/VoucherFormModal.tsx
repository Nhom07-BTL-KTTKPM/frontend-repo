import { CheckCircle2, Info, X } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import type { VoucherFormState, VoucherStatus } from '../types';

const typeSegmentClass = (active: boolean) =>
  active
    ? 'border-[#D4B785] bg-[#1E1E1E] text-[#FAF6F1] shadow-[0_14px_30px_rgba(30,30,30,0.12)]'
    : 'border-[#E0D7CD] bg-white text-[#1E1E1E] hover:border-[#D4B785] hover:bg-[#FAF6F1]';

const Field = ({ label, error, children }: { label: string; error?: string; children: ReactNode }) => (
  <label className="block space-y-2">
    <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
      <span>{label}</span>
      <Info size={12} className="text-[#1A73E8]" aria-hidden="true" />
    </span>
    {children}
    {error ? <span className="block text-xs font-medium text-[#C5221F]">{error}</span> : null}
  </label>
);

const Segment = ({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${typeSegmentClass(active)}`}
  >
    {label}
  </button>
);

const ModalShell = ({ title, children, onClose, narrow = false }: { title: string; children: ReactNode; onClose: () => void; narrow?: boolean }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-8 backdrop-blur-sm">
    <div
      className={`relative w-full ${narrow ? 'max-w-2xl' : 'max-w-4xl'} overflow-hidden rounded-[30px] border border-[#E0D7CD] bg-white shadow-[0_40px_100px_rgba(30,30,30,0.24)]`}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex items-center justify-between border-b border-[#EFE5DA] px-6 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#C5A872]">Lumière</p>
          <h2 className="mt-1 text-xl font-semibold text-[#1E1E1E]">{title}</h2>
        </div>
        <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full border border-[#E0D7CD] text-[#1E1E1E] transition hover:bg-[#FAF6F1]">
          <X size={18} />
        </button>
      </div>
      <div className="max-h-[82vh] overflow-auto p-6">{children}</div>
    </div>
  </div>
);

export const VoucherFormModal = ({
  title,
  formState,
  formErrors,
  modalMode,
  onClose,
  onSubmit,
  onChange,
}: {
  title: string;
  formState: VoucherFormState;
  formErrors: Record<string, string>;
  modalMode: 'create' | 'edit' | null;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onChange: (patch: Partial<VoucherFormState>) => void;
}) => {
  const typeValue = formState.type;
  const discountValueLabel =
    typeValue === 'PERCENT'
      ? 'Nhập phần trăm giảm giá'
      : 'Nhập giá trị giảm giá';

  return (
    <ModalShell title={title} onClose={onClose}>
      <form className="grid gap-4" onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Code *" error={formErrors.code}>
            <input
              value={formState.code}
              onChange={(event) => onChange({ code: event.target.value.toUpperCase() })}
              className="w-full rounded-2xl border border-[#E0D7CD] bg-[#FAF6F1] px-4 py-3 text-sm font-mono tracking-[0.12em] text-[#1E1E1E] outline-none transition focus:border-[#D4B785]"
              placeholder="SUMMER10"
            />
          </Field>

          <Field label="Tên voucher *" error={formErrors.name}>
            <input
              value={formState.name}
              onChange={(event) => onChange({ name: event.target.value })}
              className="w-full rounded-2xl border border-[#E0D7CD] bg-[#FAF6F1] px-4 py-3 text-sm text-[#1E1E1E] outline-none transition focus:border-[#D4B785]"
              placeholder="Giảm giá mùa hè 10%"
            />
          </Field>
        </div>

        <Field label="Mô tả">
          <textarea
            rows={3}
            value={formState.description}
            onChange={(event) => onChange({ description: event.target.value })}
            className="w-full rounded-2xl border border-[#E0D7CD] bg-[#FAF6F1] px-4 py-3 text-sm text-[#1E1E1E] outline-none transition focus:border-[#D4B785]"
            placeholder="Áp dụng cho đơn hàng từ 100.000đ"
          />
        </Field>

        <Field label="Loại voucher *" error={formErrors.type}>
          <div className="grid gap-3 md:grid-cols-3">
            <Segment active={typeValue === 'PERCENT'} label="Giảm theo %" onClick={() => onChange({ type: 'PERCENT' })} />
            <Segment active={typeValue === 'AMOUNT'} label="Giảm theo số tiền" onClick={() => onChange({ type: 'AMOUNT' })} />
            <Segment active={typeValue === 'FREE_SHIPPING'} label="Miễn phí vận chuyển" onClick={() => onChange({ type: 'FREE_SHIPPING' })} />
          </div>
        </Field>

        <div className="grid gap-4 md:grid-cols-3">
          <Field label={`${discountValueLabel} *`} error={formErrors.discountValue}>
            <input
              type="number"
              min="0"
              value={formState.discountValue}
              onChange={(event) => onChange({ discountValue: event.target.value })}
              className="w-full rounded-2xl border border-[#E0D7CD] bg-[#FAF6F1] px-4 py-3 text-sm text-[#1E1E1E] outline-none transition focus:border-[#D4B785]"
              placeholder="10"
            />
          </Field>

          <Field label="Mức giảm tối đa" error={formErrors.maxDiscountAmount}>
            <input
              type="number"
              min="0"
              value={formState.maxDiscountAmount}
              onChange={(event) => onChange({ maxDiscountAmount: event.target.value })}
              className="w-full rounded-2xl border border-[#E0D7CD] bg-[#FAF6F1] px-4 py-3 text-sm text-[#1E1E1E] outline-none transition focus:border-[#D4B785]"
              placeholder="50000"
            />
          </Field>

          <Field label="Đơn hàng tối thiểu *" error={formErrors.minOrderAmount}>
            <input
              type="number"
              min="0"
              value={formState.minOrderAmount}
              onChange={(event) => onChange({ minOrderAmount: event.target.value })}
              className="w-full rounded-2xl border border-[#E0D7CD] bg-[#FAF6F1] px-4 py-3 text-sm text-[#1E1E1E] outline-none transition focus:border-[#D4B785]"
              placeholder="100000"
            />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Số lượng *" error={formErrors.quantity}>
            <input
              type="number"
              min="1"
              value={formState.quantity}
              onChange={(event) => onChange({ quantity: event.target.value })}
              className="w-full rounded-2xl border border-[#E0D7CD] bg-[#FAF6F1] px-4 py-3 text-sm text-[#1E1E1E] outline-none transition focus:border-[#D4B785]"
              placeholder="100"
            />
          </Field>

          <Field label="Lượt dùng / user" error={formErrors.maxUsagePerUser}>
            <input
              type="number"
              min="1"
              value={formState.maxUsagePerUser}
              onChange={(event) => onChange({ maxUsagePerUser: event.target.value })}
              className="w-full rounded-2xl border border-[#E0D7CD] bg-[#FAF6F1] px-4 py-3 text-sm text-[#1E1E1E] outline-none transition focus:border-[#D4B785]"
              placeholder="1"
            />
          </Field>

          <Field label="Trạng thái *" error={formErrors.status}>
            <select
              value={formState.status}
              onChange={(event) => onChange({ status: event.target.value as VoucherStatus })}
              className="w-full rounded-2xl border border-[#E0D7CD] bg-[#FAF6F1] px-4 py-3 text-sm text-[#1E1E1E] outline-none transition focus:border-[#D4B785]"
            >
              <option value="">Chọn trạng thái</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="UPCOMING">UPCOMING</option>
              <option value="EXPIRED">EXPIRED</option>
              <option value="DISABLED">DISABLED</option>
            </select>
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Ngày bắt đầu *" error={formErrors.startDate}>
            <input
              type="datetime-local"
              value={formState.startDate}
              onChange={(event) => onChange({ startDate: event.target.value })}
              className="w-full rounded-2xl border border-[#E0D7CD] bg-[#FAF6F1] px-4 py-3 text-sm text-[#1E1E1E] outline-none transition focus:border-[#D4B785]"
            />
          </Field>

          <Field label="Ngày kết thúc *" error={formErrors.endDate}>
            <input
              type="datetime-local"
              value={formState.endDate}
              onChange={(event) => onChange({ endDate: event.target.value })}
              className="w-full rounded-2xl border border-[#E0D7CD] bg-[#FAF6F1] px-4 py-3 text-sm text-[#1E1E1E] outline-none transition focus:border-[#D4B785]"
            />
          </Field>
        </div>

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full border border-[#E0D7CD] bg-white px-5 py-3 text-sm font-semibold text-[#1E1E1E] transition hover:border-[#D4B785] hover:bg-[#FAF6F1]"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1E1E1E] px-5 py-3 text-sm font-semibold text-[#FAF6F1] transition hover:bg-[#111111]"
          >
            <CheckCircle2 size={16} />
            {modalMode === 'edit' ? 'Lưu thay đổi' : 'Tạo voucher'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};
