import { useMemo, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import {
  BadgeDollarSign,
  CheckCircle2,
  Copy,
  Filter,
  MoreVertical,
  PencilLine,
  Plus,
  Power,
  Search,
  Ticket,
  ToggleLeft,
  X,
} from 'lucide-react';

type VoucherType = 'PERCENT' | 'AMOUNT' | 'FREE_SHIPPING';
type VoucherStatus = 'ACTIVE' | 'UPCOMING' | 'EXPIRED' | 'DISABLED';
type StatusFilter = VoucherStatus | 'ALL';
type ModalMode = 'create' | 'edit' | null;

type Voucher = {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: VoucherType;
  discountValue: number;
  maxDiscountAmount?: number | null;
  minOrderAmount: number;
  quantity: number;
  maxUsagePerUser?: number | null;
  status: VoucherStatus;
  startDate: string;
  endDate: string;
  createdAt: string;
};

type VoucherFormState = {
  code: string;
  name: string;
  description: string;
  type: VoucherType | '';
  discountValue: string;
  maxDiscountAmount: string;
  minOrderAmount: string;
  quantity: string;
  maxUsagePerUser: string;
  status: VoucherStatus | '';
  startDate: string;
  endDate: string;
};

const statusOptions: Array<{ value: StatusFilter; label: string }> = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'ACTIVE', label: 'ACTIVE' },
  { value: 'UPCOMING', label: 'UPCOMING' },
  { value: 'EXPIRED', label: 'EXPIRED' },
  { value: 'DISABLED', label: 'DISABLED' },
];

const voucherTypeLabels: Record<VoucherType, string> = {
  PERCENT: 'PERCENT',
  AMOUNT: 'AMOUNT',
  FREE_SHIPPING: 'FREE_SHIPPING',
};

const statusToneMap: Record<VoucherStatus, { label: string; className: string }> = {
  ACTIVE: { label: 'ACTIVE', className: 'bg-[#E6F4EA] text-[#137333]' },
  UPCOMING: { label: 'UPCOMING', className: 'bg-[#E8F0FE] text-[#1A73E8]' },
  EXPIRED: { label: 'EXPIRED', className: 'bg-[#F1F3F4] text-[#5F6368]' },
  DISABLED: { label: 'DISABLED', className: 'bg-[#FCE8E6] text-[#C5221F]' },
};

const typeToneMap: Record<VoucherType, { cardClass: string; titleClass: string; accentClass: string }> = {
  PERCENT: {
    cardClass: 'bg-[linear-gradient(135deg,#E8DFD8_0%,#FAF6F1_100%)]',
    titleClass: 'text-[#4A3E3D]',
    accentClass: 'text-[#7A6258]',
  },
  AMOUNT: {
    cardClass: 'bg-[linear-gradient(135deg,#D4B785_0%,#EFE3C3_100%)]',
    titleClass: 'text-[#1E1E1E]',
    accentClass: 'text-[#3A3224]',
  },
  FREE_SHIPPING: {
    cardClass: 'bg-[linear-gradient(135deg,#E7E1D8_0%,#F8F3EC_100%)]',
    titleClass: 'text-[#332E29]',
    accentClass: 'text-[#6D6257]',
  },
};

const emptyVoucherForm = (): VoucherFormState => ({
  code: '',
  name: '',
  description: '',
  type: '',
  discountValue: '',
  maxDiscountAmount: '',
  minOrderAmount: '',
  quantity: '',
  maxUsagePerUser: '',
  status: '',
  startDate: '',
  endDate: '',
});

const initialVouchers: Voucher[] = [
  {
    id: 'c5452312-20e5-4aa1-a04c-e20da0d9d855',
    code: 'SUMMER10',
    name: 'Giảm giá mùa hè 10%',
    description: 'Áp dụng cho đơn hàng từ 100.000đ, giới hạn theo chiến dịch mùa hè.',
    type: 'PERCENT',
    discountValue: 10,
    maxDiscountAmount: 50000,
    minOrderAmount: 100000,
    quantity: 100,
    maxUsagePerUser: 1,
    status: 'ACTIVE',
    startDate: '2026-05-20T09:57:58.3014',
    endDate: '2026-11-21T09:57:58.3014',
    createdAt: '2026-05-21T09:57:58.3014',
  },
  {
    id: 'd1a51d7c-8e1b-437f-9d3a-8a8f0b5f4b11',
    code: 'FESTIVE20',
    name: 'Voucher giảm số tiền trực tiếp',
    description: 'Tặng giá trị quy đổi trực tiếp cho đơn hàng dịp lễ hội.',
    type: 'AMOUNT',
    discountValue: 20000,
    maxDiscountAmount: 20000,
    minOrderAmount: 50000,
    quantity: 50,
    maxUsagePerUser: null,
    status: 'ACTIVE',
    startDate: '2026-05-18T08:00:00',
    endDate: '2026-08-31T23:59:59',
    createdAt: '2026-05-20T08:00:00',
  },
  {
    id: 'a4e9f1e4-5717-4ec8-9f73-9f4d2ec01111',
    code: 'NEWUSER15',
    name: 'Ưu đãi chào mừng người dùng mới',
    description: 'Voucher dành cho khách hàng mới đăng ký trong giai đoạn khởi chạy.',
    type: 'PERCENT',
    discountValue: 15,
    maxDiscountAmount: 60000,
    minOrderAmount: 150000,
    quantity: 250,
    maxUsagePerUser: 1,
    status: 'UPCOMING',
    startDate: '2026-06-01T00:00:00',
    endDate: '2026-09-30T23:59:59',
    createdAt: '2026-05-19T10:00:00',
  },
  {
    id: 'b1a29b33-0d95-4ab4-98d2-03c6c8a6a123',
    code: 'SHIPFREE',
    name: 'Miễn phí vận chuyển',
    description: 'Hỗ trợ phí vận chuyển cho đơn hàng đạt điều kiện tối thiểu.',
    type: 'FREE_SHIPPING',
    discountValue: 30000,
    maxDiscountAmount: 30000,
    minOrderAmount: 120000,
    quantity: 30,
    maxUsagePerUser: 2,
    status: 'EXPIRED',
    startDate: '2026-03-01T00:00:00',
    endDate: '2026-05-10T23:59:59',
    createdAt: '2026-03-01T08:00:00',
  },
  {
    id: 'f0c2ef0a-9f77-49d1-8b2b-5f8f2ca0f701',
    code: 'VIP200',
    name: 'Voucher dành cho khách hàng VIP',
    description: 'Giảm sâu cho nhóm khách hàng ưu tiên và đơn hàng có giá trị lớn.',
    type: 'AMOUNT',
    discountValue: 200000,
    maxDiscountAmount: 200000,
    minOrderAmount: 1000000,
    quantity: 15,
    maxUsagePerUser: 1,
    status: 'DISABLED',
    startDate: '2026-04-01T00:00:00',
    endDate: '2026-07-01T23:59:59',
    createdAt: '2026-04-01T09:00:00',
  },
  {
    id: 'e8d0c8c5-89da-4cf6-8d35-1f9b3a8f0002',
    code: 'FLASH5',
    name: 'Flash sale 5%',
    description: 'Áp dụng nhanh trong khung giờ flash sale.',
    type: 'PERCENT',
    discountValue: 5,
    maxDiscountAmount: 25000,
    minOrderAmount: 80000,
    quantity: 80,
    maxUsagePerUser: 3,
    status: 'ACTIVE',
    startDate: '2026-05-21T00:00:00',
    endDate: '2026-07-15T23:59:59',
    createdAt: '2026-05-21T09:00:00',
  },
  {
    id: 'f8fd85d5-4f25-4d0a-962b-7b5a2d7e3012',
    code: 'WEEKENDSHIP',
    name: 'Free shipping cuối tuần',
    description: 'Hỗ trợ ship cho đơn hàng cuối tuần với giới hạn chiến dịch.',
    type: 'FREE_SHIPPING',
    discountValue: 25000,
    maxDiscountAmount: 25000,
    minOrderAmount: 90000,
    quantity: 60,
    maxUsagePerUser: 1,
    status: 'UPCOMING',
    startDate: '2026-05-25T00:00:00',
    endDate: '2026-08-25T23:59:59',
    createdAt: '2026-05-18T10:30:00',
  },
];

const formatCompactCurrency = (value?: number | null) => {
  if (value === null || value === undefined) {
    return '--';
  }

  return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(value)}đ`;
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '--';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

const toInputDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const pad = (input: number) => String(input).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const generateVoucherId = () => `voucher-${Math.random().toString(36).slice(2, 10)}-${Date.now()}`;

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
  startDate: toInputDateTime(voucher.startDate),
  endDate: toInputDateTime(voucher.endDate),
});

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

export const VoucherManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [voucherRows, setVoucherRows] = useState<Voucher[]>(initialVouchers);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingVoucherId, setEditingVoucherId] = useState<string | null>(null);
  const [formState, setFormState] = useState<VoucherFormState>(emptyVoucherForm());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [statusDialogVoucherId, setStatusDialogVoucherId] = useState<string | null>(null);
  const [statusDraft, setStatusDraft] = useState<VoucherStatus>('ACTIVE');
  const [deleteDialogVoucherId, setDeleteDialogVoucherId] = useState<string | null>(null);

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
    setStatusDialogVoucherId(voucher.id);
    setStatusDraft(voucher.status);
    closeMenu();
  };

  const openDeleteDialog = (voucher: Voucher) => {
    setDeleteDialogVoucherId(voucher.id);
    closeMenu();
  };

  const resetForm = () => {
    setModalMode(null);
    setEditingVoucherId(null);
    setFormState(emptyVoucherForm());
    setFormErrors({});
  };

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
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

    setVoucherRows((currentRows) => {
      if (modalMode === 'edit' && editingVoucherId) {
        return currentRows.map((voucher) => (voucher.id === editingVoucherId ? { ...voucher, ...voucherPayload, createdAt: voucher.createdAt } : voucher));
      }

      return [voucherPayload, ...currentRows];
    });

    toast.success(modalMode === 'edit' ? 'Đã cập nhật voucher (mock).' : 'Đã tạo voucher mới (mock).');
    resetForm();
  };

  const confirmStatusChange = () => {
    if (!statusDialogVoucherId) {
      return;
    }

    setVoucherRows((currentRows) =>
      currentRows.map((voucher) => (voucher.id === statusDialogVoucherId ? { ...voucher, status: statusDraft } : voucher)),
    );
    setStatusDialogVoucherId(null);
    toast.success('Đã đổi trạng thái voucher (mock).');
  };

  const confirmDelete = () => {
    if (!deleteDialogVoucherId) {
      return;
    }

    setVoucherRows((currentRows) => currentRows.filter((voucher) => voucher.id !== deleteDialogVoucherId));
    setDeleteDialogVoucherId(null);
    toast.success('Đã vô hiệu hóa voucher (mock).');
  };

  const modalTitle = modalMode === 'edit' ? 'Chỉnh sửa voucher' : 'Tạo Voucher mới';

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
        {filteredVouchers.map((voucher) => {
          const statusTone = statusToneMap[voucher.status];
          const typeTone = typeToneMap[voucher.type];
          const discountLabel = voucher.type === 'PERCENT'
            ? `${voucher.discountValue}% OFF`
            : voucher.type === 'AMOUNT'
              ? `${formatCompactCurrency(voucher.discountValue)} OFF`
              : 'FREE SHIP';

          return (
            <article
              key={voucher.id}
              className={`group relative overflow-hidden rounded-[24px] border border-[#E0D7CD] ${typeTone.cardClass} p-5 shadow-[0_10px_28px_rgba(30,30,30,0.05)] transition-all duration-300 hover:-translate-y-1 hover:border-[#D4B785] hover:shadow-[0_22px_40px_rgba(30,30,30,0.10)]`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={`text-3xl font-semibold tracking-tight md:text-[2rem] ${typeTone.titleClass}`}>{discountLabel}</p>
                  <div className="mt-2 inline-flex items-center rounded-full border border-white/60 bg-white/55 px-3 py-1 text-[11px] font-semibold tracking-[0.2em] text-[#3b332d] shadow-sm backdrop-blur">
                    {voucherTypeLabels[voucher.type]}
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className={`rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.18em] ${statusTone.className}`}>
                    {statusTone.label}
                  </span>

                  <div className="relative">
                    <button
                      type="button"
                      aria-label={`Mở menu thao tác ${voucher.code}`}
                      onClick={() => setOpenMenuId((current) => (current === voucher.id ? null : voucher.id))}
                      className="grid h-9 w-9 place-items-center rounded-full border border-white/70 bg-white/70 text-[#1E1E1E] shadow-sm transition hover:bg-white"
                    >
                      <MoreVertical size={16} />
                    </button>

                    {openMenuId === voucher.id ? (
                      <div className="absolute right-0 top-11 z-20 w-44 overflow-hidden rounded-2xl border border-[#E0D7CD] bg-white shadow-[0_20px_40px_rgba(30,30,30,0.12)]">
                        <MenuAction label="Sửa" icon={<PencilLine size={16} />} onClick={() => openEditModal(voucher)} />
                        <MenuAction label="Đổi trạng thái" icon={<ToggleLeft size={16} />} onClick={() => openStatusDialog(voucher)} />
                        <MenuAction label="Vô hiệu hóa" icon={<Power size={16} />} onClick={() => openDeleteDialog(voucher)} dangerous />
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText(voucher.code).then(() => toast.success(`Đã sao chép ${voucher.code}`)).catch(() => toast.info(`Mã voucher: ${voucher.code}`));
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#E0D7CD] bg-[#F5EFE6] px-3 py-2 text-left text-sm font-mono tracking-[0.12em] text-[#1E1E1E] transition hover:border-[#D4B785]"
                >
                  <Copy size={14} className="shrink-0 text-[#C5A872]" />
                  <span className="truncate">{voucher.code}</span>
                </button>

                <div>
                  <h3 className={`text-lg font-semibold ${typeTone.titleClass}`}>{voucher.name}</h3>
                  <p className={`mt-1 line-clamp-2 text-sm leading-6 ${typeTone.accentClass}`}>{voucher.description || 'Chưa có mô tả cho voucher này.'}</p>
                </div>

                <div className="grid gap-3 rounded-2xl border border-white/55 bg-white/55 p-4 text-sm text-[#1E1E1E] shadow-sm backdrop-blur-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Số lượng</span>
                    <span className="font-semibold">
                      {voucher.maxUsagePerUser ? `${voucher.quantity} lượt / ${voucher.maxUsagePerUser} lần mỗi user` : `${voucher.quantity} voucher còn lại`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Thời hạn</span>
                    <span className="font-semibold">
                      {formatDate(voucher.startDate)} - {formatDate(voucher.endDate)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Điều kiện</span>
                    <span className="font-semibold">Tối thiểu {formatCompactCurrency(voucher.minOrderAmount)}</span>
                  </div>
                </div>
              </div>
            </article>
          );
        })}

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
        <ModalShell title={modalTitle} onClose={resetForm}>
          <form className="grid gap-4" onSubmit={handleFormSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Code *" error={formErrors.code}>
                <input
                  value={formState.code}
                  onChange={(event) => setFormState((current) => ({ ...current, code: event.target.value.toUpperCase() }))}
                  className="w-full rounded-2xl border border-[#E0D7CD] bg-[#FAF6F1] px-4 py-3 text-sm font-mono tracking-[0.12em] text-[#1E1E1E] outline-none transition focus:border-[#D4B785]"
                  placeholder="SUMMER10"
                />
              </Field>

              <Field label="Tên voucher *" error={formErrors.name}>
                <input
                  value={formState.name}
                  onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
                  className="w-full rounded-2xl border border-[#E0D7CD] bg-[#FAF6F1] px-4 py-3 text-sm text-[#1E1E1E] outline-none transition focus:border-[#D4B785]"
                  placeholder="Giảm giá mùa hè 10%"
                />
              </Field>
            </div>

            <Field label="Mô tả">
              <textarea
                rows={3}
                value={formState.description}
                onChange={(event) => setFormState((current) => ({ ...current, description: event.target.value }))}
                className="w-full rounded-2xl border border-[#E0D7CD] bg-[#FAF6F1] px-4 py-3 text-sm text-[#1E1E1E] outline-none transition focus:border-[#D4B785]"
                placeholder="Áp dụng cho đơn hàng từ 100.000đ"
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Loại voucher *" error={formErrors.type}>
                <select
                  value={formState.type}
                  onChange={(event) => setFormState((current) => ({ ...current, type: event.target.value as VoucherType }))}
                  className="w-full rounded-2xl border border-[#E0D7CD] bg-[#FAF6F1] px-4 py-3 text-sm text-[#1E1E1E] outline-none transition focus:border-[#D4B785]"
                >
                  <option value="">Chọn loại voucher</option>
                  <option value="PERCENT">PERCENT</option>
                  <option value="AMOUNT">AMOUNT</option>
                  <option value="FREE_SHIPPING">FREE_SHIPPING</option>
                </select>
              </Field>

              <Field label="Giá trị giảm *" error={formErrors.discountValue}>
                <input
                  type="number"
                  min="0"
                  value={formState.discountValue}
                  onChange={(event) => setFormState((current) => ({ ...current, discountValue: event.target.value }))}
                  className="w-full rounded-2xl border border-[#E0D7CD] bg-[#FAF6F1] px-4 py-3 text-sm text-[#1E1E1E] outline-none transition focus:border-[#D4B785]"
                  placeholder="10"
                />
              </Field>

              <Field label="Mức giảm tối đa" error={formErrors.maxDiscountAmount}>
                <input
                  type="number"
                  min="0"
                  value={formState.maxDiscountAmount}
                  onChange={(event) => setFormState((current) => ({ ...current, maxDiscountAmount: event.target.value }))}
                  className="w-full rounded-2xl border border-[#E0D7CD] bg-[#FAF6F1] px-4 py-3 text-sm text-[#1E1E1E] outline-none transition focus:border-[#D4B785]"
                  placeholder="50000"
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Đơn hàng tối thiểu *" error={formErrors.minOrderAmount}>
                <input
                  type="number"
                  min="0"
                  value={formState.minOrderAmount}
                  onChange={(event) => setFormState((current) => ({ ...current, minOrderAmount: event.target.value }))}
                  className="w-full rounded-2xl border border-[#E0D7CD] bg-[#FAF6F1] px-4 py-3 text-sm text-[#1E1E1E] outline-none transition focus:border-[#D4B785]"
                  placeholder="100000"
                />
              </Field>

              <Field label="Số lượng *" error={formErrors.quantity}>
                <input
                  type="number"
                  min="1"
                  value={formState.quantity}
                  onChange={(event) => setFormState((current) => ({ ...current, quantity: event.target.value }))}
                  className="w-full rounded-2xl border border-[#E0D7CD] bg-[#FAF6F1] px-4 py-3 text-sm text-[#1E1E1E] outline-none transition focus:border-[#D4B785]"
                  placeholder="100"
                />
              </Field>

              <Field label="Lượt dùng / user" error={formErrors.maxUsagePerUser}>
                <input
                  type="number"
                  min="1"
                  value={formState.maxUsagePerUser}
                  onChange={(event) => setFormState((current) => ({ ...current, maxUsagePerUser: event.target.value }))}
                  className="w-full rounded-2xl border border-[#E0D7CD] bg-[#FAF6F1] px-4 py-3 text-sm text-[#1E1E1E] outline-none transition focus:border-[#D4B785]"
                  placeholder="1"
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Trạng thái *" error={formErrors.status}>
                <select
                  value={formState.status}
                  onChange={(event) => setFormState((current) => ({ ...current, status: event.target.value as VoucherStatus }))}
                  className="w-full rounded-2xl border border-[#E0D7CD] bg-[#FAF6F1] px-4 py-3 text-sm text-[#1E1E1E] outline-none transition focus:border-[#D4B785]"
                >
                  <option value="">Chọn trạng thái</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="UPCOMING">UPCOMING</option>
                  <option value="EXPIRED">EXPIRED</option>
                  <option value="DISABLED">DISABLED</option>
                </select>
              </Field>

              <Field label="Ngày bắt đầu *" error={formErrors.startDate}>
                <input
                  type="datetime-local"
                  value={formState.startDate}
                  onChange={(event) => setFormState((current) => ({ ...current, startDate: event.target.value }))}
                  className="w-full rounded-2xl border border-[#E0D7CD] bg-[#FAF6F1] px-4 py-3 text-sm text-[#1E1E1E] outline-none transition focus:border-[#D4B785]"
                />
              </Field>

              <Field label="Ngày kết thúc *" error={formErrors.endDate}>
                <input
                  type="datetime-local"
                  value={formState.endDate}
                  onChange={(event) => setFormState((current) => ({ ...current, endDate: event.target.value }))}
                  className="w-full rounded-2xl border border-[#E0D7CD] bg-[#FAF6F1] px-4 py-3 text-sm text-[#1E1E1E] outline-none transition focus:border-[#D4B785]"
                />
              </Field>
            </div>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={resetForm}
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
      ) : null}

      {statusDialogVoucherId ? (
        <ModalShell title="Đổi trạng thái voucher" onClose={() => setStatusDialogVoucherId(null)} narrow>
          <div className="space-y-5">
            <p className="text-sm leading-6 text-slate-600">Chọn trạng thái mới để cập nhật nhanh cho voucher đang được thao tác.</p>
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Trạng thái</span>
              <select
                value={statusDraft}
                onChange={(event) => setStatusDraft(event.target.value as VoucherStatus)}
                className="w-full rounded-2xl border border-[#E0D7CD] bg-[#FAF6F1] px-4 py-3 text-sm text-[#1E1E1E] outline-none transition focus:border-[#D4B785]"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="UPCOMING">UPCOMING</option>
                <option value="EXPIRED">EXPIRED</option>
                <option value="DISABLED">DISABLED</option>
              </select>
            </label>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setStatusDialogVoucherId(null)}
                className="inline-flex items-center justify-center rounded-full border border-[#E0D7CD] bg-white px-5 py-3 text-sm font-semibold text-[#1E1E1E] transition hover:border-[#D4B785] hover:bg-[#FAF6F1]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={confirmStatusChange}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1E1E1E] px-5 py-3 text-sm font-semibold text-[#FAF6F1] transition hover:bg-[#111111]"
              >
                <CheckCircle2 size={16} />
                Xác nhận
              </button>
            </div>
          </div>
        </ModalShell>
      ) : null}

      {deleteDialogVoucherId ? (
        <ModalShell title="Vô hiệu hóa voucher" onClose={() => setDeleteDialogVoucherId(null)} narrow>
          <div className="space-y-5">
            <p className="text-sm leading-6 text-slate-600">Voucher sẽ được chuyển sang trạng thái DISABLED trong dữ liệu mock hiện tại.</p>

            <div className="rounded-2xl border border-[#E0D7CD] bg-[#FAF6F1] p-4 text-sm text-[#1E1E1E]">
              Hành động này chỉ mô phỏng giao diện và không gọi API.
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDeleteDialogVoucherId(null)}
                className="inline-flex items-center justify-center rounded-full border border-[#E0D7CD] bg-white px-5 py-3 text-sm font-semibold text-[#1E1E1E] transition hover:border-[#D4B785] hover:bg-[#FAF6F1]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1E1E1E] px-5 py-3 text-sm font-semibold text-[#FAF6F1] transition hover:bg-[#111111]"
              >
                <Power size={16} />
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

const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
  <label className="block space-y-2">
    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</span>
    {children}
    {error ? <span className="block text-xs font-medium text-[#C5221F]">{error}</span> : null}
  </label>
);

const MenuAction = ({ label, icon, onClick, dangerous = false }: { label: string; icon: React.ReactNode; onClick: () => void; dangerous?: boolean }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition hover:bg-[#FAF6F1] ${dangerous ? 'text-[#C5221F]' : 'text-[#1E1E1E]'}`}
  >
    <span className={dangerous ? 'text-[#C5221F]' : 'text-[#C5A872]'}>{icon}</span>
    {label}
  </button>
);

const ModalShell = ({ title, children, onClose, narrow = false }: { title: string; children: React.ReactNode; onClose: () => void; narrow?: boolean }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-8 backdrop-blur-sm" onClick={onClose}>
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