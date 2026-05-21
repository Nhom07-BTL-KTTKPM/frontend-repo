import { useMemo, useState, useEffect, type FormEvent, type ReactNode } from 'react';
import { toast } from 'sonner';
import { BadgeDollarSign, Filter, Plus, Search, Ticket } from 'lucide-react';
import { VoucherCard } from './voucher-management/components/VoucherCard';
import { VoucherFormModal } from './voucher-management/components/VoucherFormModal';
import { emptyVoucherForm, initialVouchers, statusOptions } from './voucher-management/voucherData';
import type { ModalMode, StatusFilter, Voucher, VoucherFormState, VoucherStatus, VoucherType } from './voucher-management/types';
import { voucherApi } from '../../api/admin/voucherApi';

type StatusDialogState = {
  voucherId: string;
  status: VoucherStatus;
} | null;

type DeleteDialogState = {
  voucherId: string;
} | null;

const formatDateTimeInput = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const pad = (input: number) => String(input).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const generateVoucherId = () => `voucher-${Math.random().toString(36).slice(2, 10)}-${Date.now()}`;

const parseFormErrors = (form: VoucherFormState) => {
  const errors: Record<string, string> = {};

  if (!form.code.trim()) {
    errors.code = 'Vui lòng nhập mã voucher';
  } else if (!/^[A-Z0-9_-]+$/.test(form.code.trim().toUpperCase())) {
    errors.code = 'Mã voucher chỉ gồm chữ in hoa, số, _ và -';
  }

  if (!form.name.trim()) {
    errors.name = 'Vui lòng nhập tên voucher';
  }

  if (!form.type) {
    errors.type = 'Vui lòng chọn loại voucher';
  }

  if (!form.discountValue.trim() || Number(form.discountValue) <= 0) {
    errors.discountValue = 'Giá trị giảm phải lớn hơn 0';
  }

  if (form.maxDiscountAmount.trim() !== '' && Number(form.maxDiscountAmount) < 0) {
    errors.maxDiscountAmount = 'Mức giảm tối đa phải >= 0';
  }

  if (!form.minOrderAmount.trim() || Number(form.minOrderAmount) < 0) {
    errors.minOrderAmount = 'Giá trị đơn hàng tối thiểu phải >= 0';
  }

  if (!form.quantity.trim() || Number(form.quantity) <= 0) {
    errors.quantity = 'Số lượng phải lớn hơn 0';
  }

  if (form.maxUsagePerUser.trim() !== '' && Number(form.maxUsagePerUser) <= 0) {
    errors.maxUsagePerUser = 'Giới hạn lượt dùng phải lớn hơn 0';
  }

  if (!form.status) {
    errors.status = 'Vui lòng chọn trạng thái';
  }

  if (!form.startDate) {
    errors.startDate = 'Vui lòng chọn ngày bắt đầu';
  }

  if (!form.endDate) {
    errors.endDate = 'Vui lòng chọn ngày kết thúc';
  }

  if (form.startDate && form.endDate && new Date(form.endDate) <= new Date(form.startDate)) {
    errors.endDate = 'Ngày kết thúc phải lớn hơn ngày bắt đầu';
  }

  return errors;
};

const createVoucherFromForm = (form: VoucherFormState, id?: string): Voucher => ({
  id: id ?? generateVoucherId(),
  code: form.code.trim().toUpperCase(),
  name: form.name.trim(),
  description: form.description.trim(),
  type: form.type as VoucherType,
  discountValue: Number(form.discountValue),
  maxDiscountAmount: form.maxDiscountAmount.trim() === '' ? null : Number(form.maxDiscountAmount),
  minOrderAmount: Number(form.minOrderAmount),
  quantity: Number(form.quantity),
  maxUsagePerUser: form.maxUsagePerUser.trim() === '' ? null : Number(form.maxUsagePerUser),
  status: form.status as VoucherStatus,
  startDate: new Date(form.startDate).toISOString(),
  endDate: new Date(form.endDate).toISOString(),
  createdAt: new Date().toISOString(),
});

const mapVoucherToForm = (voucher: Voucher): VoucherFormState => ({
  code: voucher.code,
  name: voucher.name,
  description: voucher.description ?? '',
  type: voucher.type,
  discountValue: String(voucher.discountValue),
  maxDiscountAmount: voucher.maxDiscountAmount === null || voucher.maxDiscountAmount === undefined ? '' : String(voucher.maxDiscountAmount),
  minOrderAmount: String(voucher.minOrderAmount),
  quantity: String(voucher.quantity),
  maxUsagePerUser: voucher.maxUsagePerUser === null || voucher.maxUsagePerUser === undefined ? '' : String(voucher.maxUsagePerUser),
  status: voucher.status,
  startDate: formatDateTimeInput(voucher.startDate),
  endDate: formatDateTimeInput(voucher.endDate),
});

export const VoucherManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [voucherRows, setVoucherRows] = useState<Voucher[]>(initialVouchers);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingVoucherId, setEditingVoucherId] = useState<string | null>(null);
  const [formState, setFormState] = useState<VoucherFormState>(emptyVoucherForm());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [statusDialog, setStatusDialog] = useState<StatusDialogState>(null);
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>(null);

  const filteredVouchers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return voucherRows.filter((voucher) => {
      const matchesSearch = !query || voucher.code.toLowerCase().includes(query) || voucher.name.toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'ALL' || voucher.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter, voucherRows]);

  const counters = useMemo(() => {
    const total = voucherRows.length;
    const active = voucherRows.filter((voucher) => voucher.status === 'ACTIVE').length;
    const upcoming = voucherRows.filter((voucher) => voucher.status === 'UPCOMING').length;
    const disabled = voucherRows.filter((voucher) => voucher.status === 'DISABLED').length;

    return { total, active, upcoming, disabled };
  }, [voucherRows]);

  const closeMenu = () => setOpenMenuId(null);

  const openCreateModal = () => {
    setModalMode('create');
    setEditingVoucherId(null);
    setFormState(emptyVoucherForm());
    setFormErrors({});
    closeMenu();
  };

  const openEditModal = (voucher: Voucher) => {
    setModalMode('edit');
    setEditingVoucherId(voucher.id);
    setFormState(mapVoucherToForm(voucher));
    setFormErrors({});
    closeMenu();
  };

  const openStatusDialog = (voucher: Voucher) => {
    setStatusDialog({ voucherId: voucher.id, status: voucher.status });
    closeMenu();
  };

  const openDeleteDialog = (voucher: Voucher) => {
    setDeleteDialog({ voucherId: voucher.id });
    closeMenu();
  };

  // Load vouchers from API on mount
  useEffect(() => {
    let mounted = true;
    voucherApi
      .getVouchers()
      .then((data) => {
        if (mounted && Array.isArray(data)) {
          setVoucherRows(data);
        }
      })
      .catch(() => {
        toast.error('Không thể tải danh sách voucher');
      })
      .finally(() => {
        /* noop */
      });

    return () => {
      mounted = false;
    };
  }, []);

  const resetForm = () => {
    setModalMode(null);
    setEditingVoucherId(null);
    setFormState(emptyVoucherForm());
    setFormErrors({});
  };

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const errors = parseFormErrors(formState);
    const normalizedCode = formState.code.trim().toUpperCase();

    if (voucherRows.some((voucher) => voucher.code === normalizedCode && voucher.id !== editingVoucherId)) {
      errors.code = 'Mã voucher đã tồn tại';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const voucherPayload = createVoucherFromForm(formState, editingVoucherId ?? undefined);

    try {
      if (modalMode === 'edit' && editingVoucherId) {
        const updated = await voucherApi.updateVoucher(editingVoucherId, voucherPayload);
        setVoucherRows((currentRows) => currentRows.map((v) => (v.id === editingVoucherId ? updated : v)));
        toast.success('Đã cập nhật voucher.');
      } else {
        const created = await voucherApi.createVoucher(voucherPayload);
        setVoucherRows((currentRows) => [created, ...currentRows]);
        toast.success('Đã tạo voucher mới.');
      }
      resetForm();
    } catch (err) {
      toast.error('Lỗi khi lưu voucher');
    }
  };

  const confirmStatusChange = () => {
    if (!statusDialog) {
      return;
    }

    voucherApi
      .changeStatus(statusDialog.voucherId, statusDialog.status)
      .then((updated) => {
        setVoucherRows((currentRows) => currentRows.map((voucher) => (voucher.id === statusDialog.voucherId ? updated : voucher)));
        setStatusDialog(null);
        toast.success('Đã đổi trạng thái voucher.');
      })
      .catch(() => {
        toast.error('Không thể đổi trạng thái voucher');
      });
  };

  const confirmDelete = () => {
    if (!deleteDialog) {
      return;
    }

    // Use status change endpoint to mark voucher as DISABLED (logical delete)
    voucherApi
      .changeStatus(deleteDialog.voucherId, 'DISABLED')
      .then((updated) => {
        setVoucherRows((currentRows) => currentRows.map((voucher) => (voucher.id === deleteDialog.voucherId ? updated : voucher)));
        setDeleteDialog(null);
        toast.success('Đã vô hiệu hóa voucher.');
      })
      .catch(() => {
        toast.error('Không thể vô hiệu hóa voucher');
      });
  };

  return (
    <div className="space-y-7 text-slate-900">
      <section className="space-y-4 rounded-[28px] border border-[#E0D7CD] bg-white/90 p-6 shadow-sm backdrop-blur-sm lg:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#C5A872]">INTERNAL CONSOLE</p>
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#1E1E1E] text-[#D4B785] shadow-sm">
                <Ticket size={20} />
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-[#1E1E1E] md:text-4xl">Quản lý Voucher</h1>
                <p className="mt-1 text-sm text-slate-500">Theo dõi, tạo mới và kiểm soát các chiến dịch giảm giá trong Lumière.</p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1E1E1E] px-5 py-3 text-sm font-semibold text-[#FAF6F1] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#111111] hover:shadow-[0_18px_34px_rgba(30,30,30,0.18)]"
          >
            <Plus size={18} />
            Tạo Voucher mới
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <CounterCard label="Tổng số voucher" value={counters.total} hint="Tất cả voucher đã nạp vào hệ thống" />
          <CounterCard label="Đang hoạt động" value={counters.active} hint="Voucher có thể áp dụng ngay" />
          <CounterCard label="Sắp diễn ra" value={counters.upcoming} hint="Voucher đã lên lịch hiệu lực" />
          <CounterCard label="Đã vô hiệu hóa" value={counters.disabled} hint="Voucher đã bị tắt hoặc xóa logic" />
        </div>
      </section>

      <section className="rounded-[28px] border border-[#E0D7CD] bg-white/85 p-5 shadow-sm lg:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px] xl:min-w-[680px] xl:flex-1">
            <label className="flex items-center gap-3 rounded-2xl border border-[#E0D7CD] bg-[#FAF6F1] px-4 py-3 text-slate-500 shadow-sm transition focus-within:border-[#D4B785]">
              <Search size={18} className="shrink-0 text-[#C5A872]" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Tìm kiếm mã hoặc tên voucher..."
                className="w-full bg-transparent text-sm text-[#1E1E1E] placeholder:text-slate-400 focus:outline-none"
              />
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-[#E0D7CD] bg-[#FAF6F1] px-4 py-3 text-slate-500 shadow-sm">
              <Filter size={18} className="shrink-0 text-[#C5A872]" />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                className="w-full bg-transparent text-sm font-medium text-[#1E1E1E] focus:outline-none"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#E0D7CD] bg-[#FAF6F1] px-3 py-2">
              <BadgeDollarSign size={14} className="text-[#C5A872]" />
              Dữ liệu mock chuẩn API
            </span>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {filteredVouchers.map((voucher) => (
          <VoucherCard
            key={voucher.id}
            voucher={voucher}
            isMenuOpen={openMenuId === voucher.id}
            onToggleMenu={() => setOpenMenuId((current) => (current === voucher.id ? null : voucher.id))}
            onEdit={() => openEditModal(voucher)}
            onChangeStatus={() => openStatusDialog(voucher)}
            onDisable={() => openDeleteDialog(voucher)}
            onCopyCode={(code) => {
              void navigator.clipboard.writeText(code).then(() => toast.success(`Đã sao chép ${code}`)).catch(() => toast.info(`Mã voucher: ${code}`));
            }}
          />
        ))}

        {filteredVouchers.length === 0 ? (
          <div className="col-span-full rounded-[28px] border border-dashed border-[#D9CDBD] bg-white/70 p-12 text-center shadow-sm">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#F5EFE6] text-[#C5A872]">
              <Ticket size={22} />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-[#1E1E1E]">Không tìm thấy voucher phù hợp</h3>
            <p className="mt-2 text-sm text-slate-500">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái.</p>
          </div>
        ) : null}
      </section>

      {modalMode ? (
        <VoucherFormModal
          title={modalMode === 'edit' ? 'Chỉnh sửa voucher' : 'Tạo Voucher mới'}
          formState={formState}
          formErrors={formErrors}
          modalMode={modalMode}
          onClose={resetForm}
          onSubmit={handleFormSubmit}
          onChange={(patch) => setFormState((current) => ({ ...current, ...patch }))}
        />
      ) : null}

      {statusDialog ? (
        <ModalShell title="Đổi trạng thái voucher" onClose={() => setStatusDialog(null)} narrow>
          <div className="space-y-5">
            <p className="text-sm leading-6 text-slate-600">Chọn trạng thái mới để cập nhật nhanh cho voucher đang được thao tác.</p>
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Trạng thái</span>
              <select
                value={statusDialog.status}
                onChange={(event) => setStatusDialog((current) => (current ? { ...current, status: event.target.value as VoucherStatus } : current))}
                className="w-full rounded-2xl border border-[#E0D7CD] bg-[#FAF6F1] px-4 py-3 text-sm text-[#1E1E1E] outline-none transition focus:border-[#D4B785]"
              >
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="UPCOMING">Sắp diễn ra</option>
                <option value="EXPIRED">Đã hết hạn</option>
                <option value="DISABLED">Đã vô hiệu hóa</option>
              </select>
            </label>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setStatusDialog(null)}
                className="inline-flex items-center justify-center rounded-full border border-[#E0D7CD] bg-white px-5 py-3 text-sm font-semibold text-[#1E1E1E] transition hover:border-[#D4B785] hover:bg-[#FAF6F1]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={confirmStatusChange}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1E1E1E] px-5 py-3 text-sm font-semibold text-[#FAF6F1] transition hover:bg-[#111111]"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </ModalShell>
      ) : null}

      {deleteDialog ? (
        <ModalShell title="Vô hiệu hóa voucher" onClose={() => setDeleteDialog(null)} narrow>
          <div className="space-y-5">
            <p className="text-sm leading-6 text-slate-600">Voucher sẽ được chuyển sang trạng thái DISABLED trong dữ liệu mock hiện tại.</p>

            <div className="rounded-2xl border border-[#E0D7CD] bg-[#FAF6F1] p-4 text-sm text-[#1E1E1E]">
              Hành động này chỉ mô phỏng giao diện và không gọi API.
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDeleteDialog(null)}
                className="inline-flex items-center justify-center rounded-full border border-[#E0D7CD] bg-white px-5 py-3 text-sm font-semibold text-[#1E1E1E] transition hover:border-[#D4B785] hover:bg-[#FAF6F1]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="inline-flex items-center justify-center rounded-full bg-[#1E1E1E] px-5 py-3 text-sm font-semibold text-[#FAF6F1] transition hover:bg-[#111111]"
              >
                Vô hiệu hóa
              </button>
            </div>
          </div>
        </ModalShell>
      ) : null}
    </div>
  );
};

const CounterCard = ({ label, value, hint }: { label: string; value: number; hint: string }) => (
  <article className="rounded-[24px] border border-[#E0D7CD] bg-[#FAF6F1] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_18px_30px_rgba(30,30,30,0.06)]">
    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#C5A872]">{label}</p>
    <p className="mt-3 text-3xl font-semibold tracking-tight text-[#1E1E1E]">{value}</p>
    <p className="mt-2 text-sm leading-6 text-slate-500">{hint}</p>
  </article>
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
          ×
        </button>
      </div>
      <div className="max-h-[82vh] overflow-auto p-6">{children}</div>
    </div>
  </div>
);
