import { useEffect, useMemo, useRef, useState, type FormEvent, type ChangeEvent, type DragEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BadgeCheck,
  ChevronDown,
  Edit2,
  Eye,
  EyeOff,
  Layers3,
  LayoutGrid,
  Package2,
  Plus,
  Search,
  SlidersHorizontal,
  Users,
} from 'lucide-react';
import { uploadSingleMedia } from '../../api/uploadApi';
// @ts-ignore - optional dependency, install `react-select` + `react-select-country-list` to enable enhanced selects
import Select from 'react-select';
// @ts-ignore - optional dependency
import countryList from 'react-select-country-list';
import { toast } from 'sonner';
import { productManagementApi } from '../../api/admin/productManagementApi';
import { brandApi } from '../../api/brandApi';
import { categoryApi } from '../../api/categoryApi';
import type { BrandRequest, BrandResponse, BrandStatusRequest, CategoryResponse, CategoryStatusRequest } from '../../types/catalog';

type ProductCardRow = {
  id: string;
  name: string;
  slug: string;
  minPrice?: number | null;
  maxPrice?: number | null;
  averageRating?: number;
  totalSold?: number;
  totalStock?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  thumbnail?: string;
};

type AdminTab = 'products' | 'categories' | 'brands';
type PanelMode = 'create' | 'edit' | 'view';

type CategoryFormState = {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  parentId: string;
  isActive: boolean;
};

type BrandFormState = {
  name: string;
  slug: string;
  description: string;
  logoUrl: string;
  originCountry: string;
  websiteUrl: string;
  isActive: boolean;
};

const emptyCategoryForm = (): CategoryFormState => ({
  name: '',
  slug: '',
  description: '',
  imageUrl: '',
  parentId: '',
  isActive: true,
});

const emptyBrandForm = (): BrandFormState => ({
  name: '',
  slug: '',
  description: '',
  logoUrl: '',
  originCountry: '',
  websiteUrl: '',
  isActive: true,
});

const formatCurrency = (value?: number | null) => {
  if (value === null || value === undefined) {
    return 'Liên hệ';
  }

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
};

// slugify removed — creation now handled via modal or server-side
const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const trimOrUndefined = (value: string) => {
  const normalized = value.trim();
  return normalized ? normalized : undefined;
};

const getProductImage = (product: ProductCardRow) => {
  return product.thumbnail || '';
};

const getPriceLabel = (product: ProductCardRow) => {
  if (product.minPrice !== undefined && product.minPrice !== null) {
    if (product.maxPrice !== undefined && product.maxPrice !== null && product.maxPrice !== product.minPrice) {
      return `${formatCurrency(product.minPrice)} - ${formatCurrency(product.maxPrice)}`;
    }

    return formatCurrency(product.minPrice);
  }

  return 'Liên hệ';
};

const statusTone = (isActive?: boolean) => {
  if (isActive) {
    return {
      className: 'bg-emerald-100 text-emerald-700',
      label: 'Đang bán',
    };
  }

  return {
    className: 'bg-slate-100 text-slate-600',
    label: 'Ngưng bán',
  };
};

const getStockStatus = (stockQuantity?: number) => {
  if (!stockQuantity || stockQuantity === 0) {
    return { className: 'text-red-600 font-semibold', label: 'Hết hàng' };
  }
  if (stockQuantity < 20) {
    return { className: 'text-amber-600 font-semibold', label: 'Low stock' };
  }
  return { className: 'text-emerald-600 font-semibold', label: 'In stock' };
};

const formatDateTime = (value?: string) => {
  if (!value) {
    return 'Chưa có';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed);
};

const tabStyles = (active: boolean) =>
  active
    ? 'bg-amber-600 text-white shadow-sm'
    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50';

const resourceCardStyles = (active: boolean) =>
  active
    ? 'border-amber-200 bg-amber-50/40 shadow-sm'
    : 'border-slate-200 bg-white shadow-sm';

const FieldLabel = ({ children }: { children: string }) => (
  <label className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-slate-500">{children}</label>
);

const SectionTitle = ({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) => (
  <div className="flex flex-wrap items-start justify-between gap-4">
    <div>
      <p className="m-0 text-[0.72rem] font-bold uppercase tracking-[0.24em] text-amber-600">{eyebrow}</p>
      <h2 className="m-0 mt-2 text-2xl font-extrabold tracking-tight text-slate-900">{title}</h2>
      {description ? <p className="m-0 mt-2 max-w-3xl text-sm leading-6 text-slate-500">{description}</p> : null}
    </div>
  </div>
);

const StatCard = ({ label, value, tone }: { label: string; value: string | number; tone: string }) => (
  <article className={`rounded-lg border px-4 py-4 shadow-sm ${tone}`}>
    <p className="m-0 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
    <p className="m-0 mt-2 text-3xl font-extrabold tracking-tight text-slate-900">{value}</p>
  </article>
);

const ProductStats = ({ products }: { products: ProductCardRow[] }) => {
  const stats = {
    total: products.length,
    active: products.filter((product) => product.isActive).length,
    featured: products.filter((product) => product.isFeatured).length,
    outOfStock: products.filter((product) => (product.totalStock ?? 0) === 0).length,
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Tổng sản phẩm" value={stats.total} tone="bg-gradient-to-br from-blue-50 to-white border-blue-100" />
      <StatCard label="Đang bán" value={stats.active} tone="bg-gradient-to-br from-emerald-50 to-white border-emerald-100" />
      <StatCard label="Sản phẩm tiêu biểu" value={stats.featured} tone="bg-gradient-to-br from-amber-50 to-white border-amber-100" />
      <StatCard label="Hết hàng" value={stats.outOfStock} tone="bg-gradient-to-br from-rose-50 to-white border-rose-100" />
    </div>
  );
};

const ProductsTab = ({
  products,
  loading,
  error,
  onToggleStatus,
}: {
  products: ProductCardRow[];
  loading: boolean;
  error: string | null;
  onToggleStatus: (product: ProductCardRow) => void;
}) => {
  const navigate = useNavigate();

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div>
          <p className="m-0 text-sm text-slate-500">Quản trị sản phẩm</p>
          <h2 className="m-0 mt-1 text-2xl font-bold text-slate-900">Product management</h2>
          <p className="m-0 mt-2 text-sm text-slate-500">{products.length} sản phẩm trong danh sách</p>
        </div>

        <Link
          to="/admin/products/new"
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 px-6 py-3 font-bold text-white shadow transition hover:shadow-lg"
        >
          <Plus size={16} />
          Thêm sản phẩm
        </Link>
      </div>

      <ProductStats products={products} />

      <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 xl:grid-cols-[1.8fr_1fr_1fr_1fr]">
          <label className="flex items-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-600 transition hover:bg-slate-50">
            <Search size={18} />
            <input
              type="text"
              placeholder="Tìm theo tên sản phẩm, SKU, brand..."
              readOnly
              className="w-full border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
          </label>

          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-600 transition hover:bg-slate-50">
            <span className="whitespace-nowrap text-sm">Danh mục</span>
            <span className="flex items-center gap-1 text-slate-400">
              <span className="text-sm font-semibold text-slate-900">Tất cả</span>
              <ChevronDown size={16} />
            </span>
          </label>

          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-600 transition hover:bg-slate-50">
            <span className="whitespace-nowrap text-sm">Brand</span>
            <span className="flex items-center gap-1 text-slate-400">
              <span className="text-sm font-semibold text-slate-900">Tất cả</span>
              <ChevronDown size={16} />
            </span>
          </label>

          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-600 transition hover:bg-slate-50">
            <span className="whitespace-nowrap text-sm">Sắp xếp</span>
            <span className="flex items-center gap-1 text-slate-400">
              <span className="text-sm font-semibold text-slate-900">Mới nhất</span>
              <ChevronDown size={16} />
            </span>
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
            <SlidersHorizontal size={16} />
            Lọc nhanh
          </div>

          <div className="flex flex-wrap gap-2">
            {['Nổi bật', 'Còn hàng', 'Đang bán chạy', 'Giá tăng dần'].map((label) => (
              <button
                key={label}
                type="button"
                className={`rounded-full px-3 py-2 text-xs font-bold transition ${
                  label === 'Nổi bật'
                    ? 'bg-slate-900 text-white hover:bg-slate-800'
                    : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {loading ? (
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
            {Array.from({ length: 12 }).map((_, index) => (
            <article key={index} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="aspect-video animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200" />
              <div className="space-y-2 p-3">
                <div className="h-3 w-2/5 animate-pulse rounded-full bg-slate-200" />
                <div className="h-4 w-3/4 animate-pulse rounded-full bg-slate-200" />
                <div className="h-3 w-full animate-pulse rounded-full bg-slate-100" />
                <div className="mt-2 h-8 animate-pulse rounded-lg bg-slate-100" />
              </div>
            </article>
          ))}
        </section>
      ) : error ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-900">
          <h3 className="m-0 font-bold">Không thể tải sản phẩm</h3>
          <p className="m-0 mt-2 text-sm">{error}</p>
        </section>
      ) : products.length === 0 ? (
        <section className="rounded-lg border border-slate-200 bg-white p-5 text-slate-500">
          Chưa có sản phẩm nào để hiển thị.
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
          {products.map((product) => {
            const imageUrl = getProductImage(product);
            const tone = statusTone(product.isActive);
            const displayPrice = getPriceLabel(product);
            const totalStock = product.totalStock ?? 0;
            const stockStatus = getStockStatus(totalStock);

            return (
              <article
                key={product.id}
                className="group grid cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-white shadow-md transition-all duration-200 hover:border-slate-300 hover:shadow-lg"
              >
                <div
                  className="relative aspect-video overflow-hidden bg-slate-100"
                  style={{
                    backgroundImage: imageUrl
                      ? `linear-gradient(180deg, rgba(15, 23, 42, 0.05), rgba(15, 23, 42, 0.15)), url("${imageUrl}")`
                      : 'linear-gradient(135deg, #dbeafe, #e0f2fe)',
                    backgroundPosition: 'center',
                    backgroundSize: 'cover',
                    backgroundRepeat: 'no-repeat',
                  }}
                >
                  <div className="absolute inset-0 bg-black/0 transition duration-200 group-hover:bg-black/20" />

                  <div className="absolute left-2 top-2 flex flex-wrap gap-2">
                    <span className={`rounded-full px-2 py-1 text-xs font-bold ${tone.className}`}>{tone.label}</span>
                  </div>

                  {product.isFeatured ? (
                    <span className="absolute right-2 top-2 rounded-full bg-gradient-to-r from-amber-300 to-amber-400 px-3 py-1 text-xs font-bold text-amber-900 shadow-md">
                      ⭐ Nổi bật
                    </span>
                  ) : null}

                  <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 transition duration-200 group-hover:opacity-100">
                    <button
                      type="button"
                      className="rounded-full bg-white p-2.5 shadow-lg transition hover:bg-slate-50"
                      title="Xem chi tiết"
                      onClick={() => navigate(`/product/${product.slug}`, { state: { productId: product.id } })}
                    >
                      <Eye size={16} className="text-slate-700" />
                    </button>
                    <button className="rounded-full bg-white p-2.5 shadow-lg transition hover:bg-slate-50" title="Chỉnh sửa">
                      <Edit2 size={16} className="text-slate-700" />
                    </button>
                    <button
                      type="button"
                      className={`rounded-full p-2.5 shadow-lg transition hover:bg-rose-100 ${
                        product.isActive ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                      }`}
                      title={product.isActive ? 'Ẩn sản phẩm' : 'Hiển thị sản phẩm'}
                      onClick={() => onToggleStatus(product)}
                    >
                      {product.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="grid gap-2 p-3">
                  <div className="min-w-0">
                    <h3 className="m-0 mt-1 line-clamp-2 text-sm font-bold text-slate-900">{product.name}</h3>
                  </div>

                  <div className="space-y-1">
                    <strong className="block text-sm font-bold text-slate-900">{displayPrice}</strong>
                  </div>

                  <div className="grid gap-2 text-xs">
                    <div className="rounded-lg bg-slate-50 p-1.5">
                      <p className="font-semibold text-slate-500">Tồn kho</p>
                      <p className={`font-bold ${stockStatus.className}`}>{totalStock}</p>
                    </div>
                  </div>

                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
};

const ResourceListItem = ({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) => (
  <article className={`relative rounded-lg border p-4 transition ${resourceCardStyles(active)}`} style={{ overflow: 'visible' }}>
    {children}
  </article>
);

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
    <p className="m-0 text-[0.72rem] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p>
    <div className="mt-2 text-sm font-medium text-slate-900">{value}</div>
  </div>
);

const ImagePreview = ({ src, alt }: { src?: string; alt: string }) => {
  if (!src) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-400">
        Chưa có hình ảnh
      </div>
    );
  }

  return <img src={src} alt={alt} className="h-32 w-full rounded-lg border border-slate-200 object-cover" />;
};

const CategoryPanel = ({
  categories,
  loading,
  error,
  search,
  setSearch,
  filteredCategories,
  selectedCategory,
  panelMode,
  onCreateNew,
  onEdit,
  onView,
  onToggleStatus,
}: {
  categories: CategoryResponse[];
  loading: boolean;
  error: string | null;
  search: string;
  setSearch: (value: string) => void;
  filteredCategories: CategoryResponse[];
  selectedCategory: CategoryResponse | null;
  panelMode: PanelMode;
  onCreateNew: () => void;
  onEdit: (category: CategoryResponse) => void;
  onView: (category: CategoryResponse) => void;
  onToggleStatus: (category: CategoryResponse) => void;
}) => {
  const isViewing = panelMode === 'view' && Boolean(selectedCategory);

  return (
    <section className="grid gap-6 rounded-[32px] border border-slate-200 bg-[#f8f9fa] p-4 shadow-[0_20px_55px_rgba(15,23,42,0.06)] lg:p-6">
      <SectionTitle
        eyebrow="Danh mục"
        title="Quản lý category"
        description="Tạo, chỉnh sửa và đổi trạng thái category ngay trong cùng một tab."
      />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
              <Layers3 size={16} />
              Danh sách category
            </div>
            <button
              type="button"
              onClick={onCreateNew}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-500 px-4 py-2.5 text-sm font-bold text-white shadow transition hover:shadow-lg"
            >
              <Plus size={16} />
              Thêm category
            </button>
          </div>

          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition focus-within:border-amber-300 focus-within:ring-4 focus-within:ring-amber-100">
            <Search size={18} className="text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo tên, slug, mô tả..."
              className="w-full border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Tổng danh mục" value={categories.length} tone="bg-white border-slate-200" />
            <StatCard label="Đang hoạt động" value={categories.filter((item) => item.isActive).length} tone="bg-white border-slate-200" />
            <StatCard label="Danh mục cha" value={categories.filter((item) => !item.parentId).length} tone="bg-white border-slate-200" />
          </div>

          {loading ? (
            <div className="grid gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-900">
              <p className="m-0 font-bold">Không thể tải category</p>
              <p className="m-0 mt-2 text-sm">{error}</p>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white p-5 text-slate-500">
              Chưa có category nào phù hợp.
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredCategories.map((category) => {
                const active = selectedCategory?.id === category.id;

                return (
                  <ResourceListItem key={category.id} active={active}>
                      <div className="relative">
                        <div className="flex min-w-0 items-start gap-3 pr-28">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                            {category.imageUrl ? (
                              <img src={category.imageUrl} alt={category.name} className="h-full w-full object-cover" />
                            ) : (
                              <Layers3 size={18} className="text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="m-0 text-base font-bold text-slate-900 truncate">{category.name}</h3>
                              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${category.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                {category.isActive ? 'Đang hoạt động' : 'Đã ẩn'}
                              </span>
                            </div>
                            <p className="m-0 mt-1 text-sm text-slate-500">{category.slug}</p>
                            <p className="m-0 mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                              {category.description || 'Chưa có mô tả'}
                            </p>
                          </div>
                        </div>

                        <div className="absolute right-4 top-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => onView(category)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                          >
                            <Eye size={14} />
                            Xem
                          </button>
                          <button
                            type="button"
                            onClick={() => onEdit(category)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                          >
                            <Edit2 size={14} />
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => onToggleStatus(category)}
                            className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold transition ${
                              category.isActive
                                ? 'border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                                : 'border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                            }`}
                          >
                            <EyeOff size={14} />
                            {category.isActive ? 'Ẩn' : 'Hiện'}
                          </button>
                        </div>
                      </div>
                    </ResourceListItem>
                );
              })}
            </div>
          )}
        </div>

        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          {isViewing && selectedCategory ? (
            <div className="grid gap-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="m-0 text-[0.72rem] font-bold uppercase tracking-[0.2em] text-amber-600">Chi tiết category</p>
                  <h3 className="m-0 mt-2 text-xl font-extrabold text-slate-900">{selectedCategory.name}</h3>
                  <p className="m-0 mt-1 text-sm text-slate-500">{selectedCategory.slug}</p>
                </div>

                <button
                  type="button"
                  onClick={() => onEdit(selectedCategory)}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
                >
                  <Edit2 size={14} />
                  Chỉnh sửa
                </button>
              </div>

              <ImagePreview src={selectedCategory.imageUrl} alt={selectedCategory.name} />

              <div className="grid gap-3">
                <DetailRow label="ID" value={selectedCategory.id} />
                <DetailRow label="Tên" value={selectedCategory.name} />
                <DetailRow label="Slug" value={selectedCategory.slug} />
                <DetailRow label="Mô tả" value={selectedCategory.description || 'Chưa có'} />
                <DetailRow label="Ảnh" value={selectedCategory.imageUrl || 'Chưa có'} />
                <DetailRow label="Parent" value={selectedCategory.parentId || 'Root'} />
                <DetailRow label="Trạng thái" value={selectedCategory.isActive ? 'Đang hoạt động' : 'Đã ẩn'} />
                <DetailRow label="Tạo lúc" value={formatDateTime(selectedCategory.createdAt)} />
                <DetailRow label="Cập nhật lúc" value={formatDateTime(selectedCategory.updatedAt)} />
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              <p className="m-0 text-sm text-slate-600">Chọn một category từ danh sách để xem chi tiết.</p>
              <p className="m-0 text-sm text-slate-500">Để tạo category mới, hãy bấm nút "Thêm category" ở bên trái (sẽ mở modal).</p>
              <div className="mt-4 flex justify-end">
                <button type="button" onClick={onCreateNew} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700">Tạo category</button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
};

const BrandPanel = ({
  brands,
  loading,
  error,
  search,
  setSearch,
  filteredBrands,
  selectedBrand,
  panelMode,
  onCreateNew,
  onEdit,
  onView,
  onToggleStatus,
}: {
  brands: BrandResponse[];
  loading: boolean;
  error: string | null;
  search: string;
  setSearch: (value: string) => void;
  filteredBrands: BrandResponse[];
  selectedBrand: BrandResponse | null;
  panelMode: PanelMode;
  onCreateNew: () => void;
  onEdit: (brand: BrandResponse) => void;
  onView: (brand: BrandResponse) => void;
  onToggleStatus: (brand: BrandResponse) => void;
}) => {
  const isViewing = panelMode === 'view' && Boolean(selectedBrand);

  return (
    <section className="grid gap-6 rounded-[32px] border border-slate-200 bg-[#f8f9fa] p-4 shadow-[0_20px_55px_rgba(15,23,42,0.06)] lg:p-6">
      <SectionTitle
        eyebrow="Brand"
        title="Quản lý brand"
        description="Tạo mới, cập nhật và bật/tắt brand từ cùng một tab làm việc."
      />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
              <BadgeCheck size={16} />
              Danh sách brand
            </div>
            <button
              type="button"
              onClick={onCreateNew}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition hover:shadow-xl"
            >
              <Plus size={16} />
              Thêm brand
            </button>
          </div>

          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-100">
            <Search size={18} className="text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo tên, slug, mô tả..."
              className="w-full border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard 
                label="Tổng nhãn hàng" 
                value={brands.length} 
                tone="bg-white border-slate-300" 
            />
            <StatCard 
                label="Đang hoạt động" 
                value={brands.filter((item) => item.isActive).length} 
                tone="bg-white border-slate-300" 
            />
            <StatCard 
                label="Đã ẩn" 
                value={brands.filter((item) => !item.isActive).length} 
                tone="bg-white border-slate-300" 
            />
            </div>

          {loading ? (
            <div className="grid gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-900">
              <p className="m-0 font-bold">Không thể tải brand</p>
              <p className="m-0 mt-2 text-sm">{error}</p>
            </div>
          ) : filteredBrands.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-500">
              Chưa có brand nào phù hợp.
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredBrands.map((brand) => {
                const active = selectedBrand?.id === brand.id;

                return (
                  <ResourceListItem key={brand.id} active={active}>
                      <div className="relative">
                        <div className="flex min-w-0 items-start gap-3 pr-28">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                            {brand.logoUrl ? (
                              <img src={brand.logoUrl} alt={brand.name} className="h-full w-full object-cover" />
                            ) : (
                              <Users size={18} className="text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="m-0 text-base font-bold text-slate-900">{brand.name}</h3>
                              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${brand.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                {brand.isActive ? 'Đang hoạt động' : 'Đã ẩn'}
                              </span>
                            </div>
                            <p className="m-0 mt-1 text-sm text-slate-500">{brand.slug}</p>
                            <p className="m-0 mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                              {brand.description || 'Chưa có mô tả'}
                            </p>
                          </div>
                        </div>

                        <div className="absolute right-4 top-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => onView(brand)}
                            className="inline-flex flex-none items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                          >
                            <Eye size={14} />
                            Xem
                          </button>
                          <button
                            type="button"
                            onClick={() => onEdit(brand)}
                            className="inline-flex flex-none items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                          >
                            <Edit2 size={14} />
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => onToggleStatus(brand)}
                            className={`inline-flex flex-none items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold transition ${
                              brand.isActive
                                ? 'border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                                : 'border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                            }`}
                          >
                            <EyeOff size={14} />
                            {brand.isActive ? 'Ẩn' : 'Hiện'}
                          </button>
                        </div>
                      </div>
                    </ResourceListItem>
                );
              })}
            </div>
          )}
        </div>

        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          {isViewing && selectedBrand ? (
            <div className="grid gap-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="m-0 text-[0.72rem] font-bold uppercase tracking-[0.2em] text-amber-600">Chi tiết brand</p>
                  <h3 className="m-0 mt-2 text-xl font-extrabold text-slate-900">{selectedBrand.name}</h3>
                  <p className="m-0 mt-1 text-sm text-slate-500">{selectedBrand.slug}</p>
                </div>

                <button
                  type="button"
                  onClick={() => onEdit(selectedBrand)}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
                >
                  <Edit2 size={14} />
                  Chỉnh sửa
                </button>
              </div>

              <ImagePreview src={selectedBrand.logoUrl} alt={selectedBrand.name} />

              <div className="grid gap-3">
                <DetailRow label="ID" value={selectedBrand.id} />
                <DetailRow label="Tên" value={selectedBrand.name} />
                <DetailRow label="Slug" value={selectedBrand.slug} />
                <DetailRow label="Mô tả" value={selectedBrand.description || 'Chưa có'} />
                <DetailRow label="Logo" value={selectedBrand.logoUrl || 'Chưa có'} />
                <DetailRow label="Quốc gia" value={selectedBrand.originCountry || 'Chưa có'} />
                <DetailRow label="Website" value={selectedBrand.websiteUrl || 'Chưa có'} />
                <DetailRow label="Trạng thái" value={selectedBrand.isActive ? 'Đang hoạt động' : 'Đã ẩn'} />
                <DetailRow label="Tạo lúc" value={formatDateTime(selectedBrand.createdAt)} />
                <DetailRow label="Cập nhật lúc" value={formatDateTime(selectedBrand.updatedAt)} />
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              <p className="m-0 text-sm text-slate-600">Chọn một brand từ danh sách để xem chi tiết.</p>
              <p className="m-0 text-sm text-slate-500">Để tạo brand mới, hãy bấm nút "Thêm brand" ở bên trái (sẽ mở modal).</p>
              <div className="mt-4 flex justify-end">
                <button type="button" onClick={onCreateNew} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700">Tạo brand</button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
};

export const ProductManagement = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('products');

  const [products, setProducts] = useState<ProductCardRow[]>([]);
  const [productLoading, setProductLoading] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);

  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryPanelMode, setCategoryPanelMode] = useState<PanelMode>('create');
  const [categorySelected, setCategorySelected] = useState<CategoryResponse | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(emptyCategoryForm());
  

  const [brands, setBrands] = useState<BrandResponse[]>([]);
  const [brandLoading, setBrandLoading] = useState(false);
  const [brandError, setBrandError] = useState<string | null>(null);
  const [brandSearch, setBrandSearch] = useState('');
  const [brandPanelMode, setBrandPanelMode] = useState<PanelMode>('create');
  const [brandSelected, setBrandSelected] = useState<BrandResponse | null>(null);
  const [brandForm, setBrandForm] = useState<BrandFormState>(emptyBrandForm());
  
  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const brandFileInputRef = useRef<HTMLInputElement | null>(null);
  const [brandUploading, setBrandUploading] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const categoryFileInputRef = useRef<HTMLInputElement | null>(null);
  const [categoryUploading, setCategoryUploading] = useState(false);

  const loadProducts = async () => {
    try {
      setProductLoading(true);
      setProductError(null);

      const response = await productManagementApi.getAllProducts({ page: 0, size: 20, sort: 'createdAt,desc' });
      setProducts((response.content || []) as ProductCardRow[]);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Không thể tải danh sách sản phẩm.';
      setProductError(message);
    } finally {
      setProductLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      setCategoryLoading(true);
      setCategoryError(null);

      const response = await categoryApi.getCategoryPage({ page: 0, size: 100, sort: 'name,asc' });
      setCategories(response.content || []);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Không thể tải danh sách category.';
      setCategoryError(message);
    } finally {
      setCategoryLoading(false);
    }
  };

  const loadBrands = async () => {
    try {
      setBrandLoading(true);
      setBrandError(null);

      const response = await brandApi.getBrandPage({ page: 0, size: 100, sort: 'name,asc' });
      setBrands(response.content || []);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Không thể tải danh sách brand.';
      setBrandError(message);
    } finally {
      setBrandLoading(false);
    }
  };

  useEffect(() => {
    void loadProducts();
  }, []);

  useEffect(() => {
    if (activeTab === 'categories' && categories.length === 0 && !categoryLoading) {
      void loadCategories();
    }
    if (activeTab === 'brands' && brands.length === 0 && !brandLoading) {
      void loadBrands();
    }
  }, [activeTab, categories.length, brands.length, categoryLoading, brandLoading]);

  const openCreateCategory = () => {
    setCategoryPanelMode('create');
    setCategorySelected(null);
    setCategoryForm(emptyCategoryForm());
    setCategoryModalOpen(true);
  };

  const openCategoryView = (category: CategoryResponse) => {
    setCategoryPanelMode('view');
    setCategorySelected(category);
    setCategoryForm({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      imageUrl: category.imageUrl || '',
      parentId: category.parentId || '',
      isActive: category.isActive,
    });
  };

  const openCategoryEdit = (category: CategoryResponse) => {
    setCategoryPanelMode('edit');
    setCategorySelected(category);
    setCategoryForm({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      imageUrl: category.imageUrl || '',
      parentId: category.parentId || '',
      isActive: category.isActive,
    });
    setCategoryModalOpen(true);
  };

  const openCreateBrand = () => {
    setBrandPanelMode('create');
    setBrandSelected(null);
    setBrandForm(emptyBrandForm());
    setBrandModalOpen(true);
  };

  const openBrandView = (brand: BrandResponse) => {
    setBrandPanelMode('view');
    setBrandSelected(brand);
    setBrandForm({
      name: brand.name,
      slug: brand.slug,
      description: brand.description || '',
      logoUrl: brand.logoUrl || '',
      originCountry: brand.originCountry || '',
      websiteUrl: brand.websiteUrl || '',
      isActive: brand.isActive,
    });
  };

  const openBrandEdit = (brand: BrandResponse) => {
    setBrandPanelMode('edit');
    setBrandSelected(brand);
    setBrandForm({
      name: brand.name,
      slug: brand.slug,
      description: brand.description || '',
      logoUrl: brand.logoUrl || '',
      originCountry: brand.originCountry || '',
      websiteUrl: brand.websiteUrl || '',
      isActive: brand.isActive,
    });
    setBrandModalOpen(true);
  };

  

  const submitBrand = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload: BrandRequest = {
      name: brandForm.name.trim(),
      slug: brandForm.slug.trim(),
      description: trimOrUndefined(brandForm.description),
      logoUrl: trimOrUndefined(brandForm.logoUrl),
      originCountry: trimOrUndefined(brandForm.originCountry),
      websiteUrl: trimOrUndefined(brandForm.websiteUrl),
      isActive: brandForm.isActive,
    };

    try {
      if (brandPanelMode === 'edit' && brandSelected) {
        const updated = await brandApi.updateBrand(brandSelected.id, payload);
        setBrands((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        setBrandSelected(updated);
        setBrandForm({
          name: updated.name,
          slug: updated.slug,
          description: updated.description || '',
          logoUrl: updated.logoUrl || '',
          originCountry: updated.originCountry || '',
          websiteUrl: updated.websiteUrl || '',
          isActive: updated.isActive,
        });
        setBrandPanelMode('view');
        toast.success('Đã cập nhật brand.');
        if (brandModalOpen) setBrandModalOpen(false);
      } else {
        const created = await brandApi.createBrand(payload);
        setBrands((current) => [created, ...current]);
        setBrandSelected(created);
        setBrandForm({
          name: created.name,
          slug: created.slug,
          description: created.description || '',
          logoUrl: created.logoUrl || '',
          originCountry: created.originCountry || '',
          websiteUrl: created.websiteUrl || '',
          isActive: created.isActive,
        });
        setBrandPanelMode('view');
        toast.success('Đã tạo brand mới.');
        if (brandModalOpen) setBrandModalOpen(false);
      }
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Không thể lưu brand.';
      toast.error(message);
    }
  };

  const submitCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      name: (categoryForm as CategoryFormState).name.trim(),
      slug: (categoryForm as CategoryFormState).slug.trim(),
      description: trimOrUndefined((categoryForm as CategoryFormState).description),
      imageUrl: trimOrUndefined((categoryForm as CategoryFormState).imageUrl),
      parentId: (categoryForm as CategoryFormState).parentId || undefined,
      isActive: (categoryForm as CategoryFormState).isActive,
    } as unknown as any;

    try {
      if (categoryPanelMode === 'edit' && categorySelected) {
        const updated = await categoryApi.updateCategory(categorySelected.id, payload);
        setCategories((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        setCategorySelected(updated);
        setCategoryForm({
          name: updated.name,
          slug: updated.slug,
          description: updated.description || '',
          imageUrl: updated.imageUrl || '',
          parentId: updated.parentId || '',
          isActive: updated.isActive,
        });
        setCategoryPanelMode('view');
        toast.success('Đã cập nhật category.');
        if (categoryModalOpen) setCategoryModalOpen(false);
      } else {
        const created = await categoryApi.createCategory(payload);
        setCategories((current) => [created, ...current]);
        setCategorySelected(created);
        setCategoryForm({
          name: created.name,
          slug: created.slug,
          description: created.description || '',
          imageUrl: created.imageUrl || '',
          parentId: created.parentId || '',
          isActive: created.isActive,
        });
        setCategoryPanelMode('view');
        toast.success('Đã tạo category mới.');
        if (categoryModalOpen) setCategoryModalOpen(false);
      }
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Không thể lưu category.';
      toast.error(message);
    }
  };

  const toggleCategoryStatus = async (category: CategoryResponse) => {
    const payload: CategoryStatusRequest = { isActive: !category.isActive };

    try {
      await categoryApi.updateCategoryStatus(category.id, payload);
      const updated = { ...category, isActive: payload.isActive };
      setCategories((current) => current.map((item) => (item.id === category.id ? updated : item)));
      if (categorySelected?.id === category.id) {
        setCategorySelected(updated);
        setCategoryForm((current) => ({ ...current, isActive: payload.isActive }));
      }
      toast.success(payload.isActive ? 'Đã hiển thị category.' : 'Đã ẩn category.');
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Không thể thay đổi trạng thái category.';
      toast.error(message);
    }
  };

  const toggleBrandStatus = async (brand: BrandResponse) => {
    const payload: BrandStatusRequest = { isActive: !brand.isActive };

    try {
      const updated = await brandApi.updateBrandStatus(brand.id, payload);
      setBrands((current) => current.map((item) => (item.id === brand.id ? updated : item)));
      if (brandSelected?.id === brand.id) {
        setBrandSelected(updated);
        setBrandForm((current) => ({ ...current, isActive: updated.isActive }));
      }
      toast.success(payload.isActive ? 'Đã hiển thị brand.' : 'Đã ẩn brand.');
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Không thể thay đổi trạng thái brand.';
      toast.error(message);
    }
  };

  const toggleProductStatus = async (product: ProductCardRow) => {
    const payload = { isActive: !product.isActive };

    try {
      const updated = await productManagementApi.changeProductStatus(product.id, payload);
      setProducts((current) => current.map((item) => (item.id === updated.id ? { ...item, isActive: updated.isActive } : item)));
      toast.success(updated.isActive ? 'Đã hiển thị product.' : 'Đã ẩn product.');
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Không thể thay đổi trạng thái product.';
      toast.error(message);
    }
  };

  // Brand upload helpers for modal
  const handleBrandFile = async (file: File | null) => {
    if (!file) return;
    setBrandUploading(true);
    try {
      const uploaded = await uploadSingleMedia(file, 'AVATAR');
      setBrandForm((cur) => ({ ...cur, logoUrl: uploaded.url }));
      toast.success('Ảnh logo đã được tải lên.');
    } catch (err) {
      toast.error('Không thể upload ảnh.');
    } finally {
      setBrandUploading(false);
    }
  };

  const handleCategoryFile = async (file: File | null) => {
    if (!file) return;
    setCategoryUploading(true);
    try {
      const uploaded = await uploadSingleMedia(file, 'PRODUCT');
      setCategoryForm((cur) => ({ ...cur, imageUrl: uploaded.url }));
      toast.success('Ảnh category đã được tải lên.');
    } catch (err) {
      toast.error('Không thể upload ảnh.');
    } finally {
      setCategoryUploading(false);
    }
  };

  const onBrandFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    void handleBrandFile(file);
  };

  const onBrandDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0] || null;
    void handleBrandFile(file);
  };

  const openBrandFilePicker = () => brandFileInputRef.current?.click();
  const openCategoryFilePicker = () => categoryFileInputRef.current?.click();

  const filteredCategories = useMemo(() => {
    const keyword = categorySearch.trim().toLowerCase();
    if (!keyword) {
      return categories;
    }

    return categories.filter((category) => {
      const haystack = [category.name, category.slug, category.description, category.parentId].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(keyword);
    });
  }, [categories, categorySearch]);

  const filteredBrands = useMemo(() => {
    const keyword = brandSearch.trim().toLowerCase();
    if (!keyword) {
      return brands;
    }

    return brands.filter((brand) => {
      const haystack = [brand.name, brand.slug, brand.description, brand.originCountry, brand.websiteUrl].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(keyword);
    });
  }, [brandSearch, brands]);

  // react-select country options for brand origin
  const countryOptions = useMemo(() => {
    try {
      return countryList().getData();
    } catch (err) {
      return [] as { value: string; label: string }[];
    }
  }, []);

  const parentCategoryOptions = useMemo(() => {
    return categories.map((c) => ({ value: c.id, label: c.name }));
  }, [categories]);

  const reactSelectStyles = useMemo(() => ({
    control: (base: any) => ({
      ...base,
      borderRadius: 8,
      borderColor: '#cbd5e1', // slate-300
      minHeight: 44,
      paddingLeft: 8,
      paddingRight: 8,
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#f59e0b', // amber-500
      },
    }),
    menu: (base: any) => ({ ...base, zIndex: 60 }),
    singleValue: (base: any) => ({ ...base, color: '#0f172a' }),
  }), []);

  

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[32px] border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <p className="m-0 text-[0.72rem] font-bold uppercase tracking-[0.24em] text-amber-700">Quản trị nội dung catalog</p>
          <h1 className="m-0 mt-2 text-2xl font-extrabold tracking-tight text-slate-900">Products, categories, brands</h1>
          <p className="m-0 mt-2 text-sm text-slate-500">Chuyển tab để quản lý sản phẩm, category và brand ngay trong cùng một màn hình.</p>
        </div>

        <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
          <button type="button" onClick={() => setActiveTab('products')} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${tabStyles(activeTab === 'products')}`}>
            <Package2 size={16} />
            Quản lý sản phẩm
          </button>
          <button type="button" onClick={() => setActiveTab('categories')} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${tabStyles(activeTab === 'categories')}`}>
            <LayoutGrid size={16} />
            Category
          </button>
          <button type="button" onClick={() => setActiveTab('brands')} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${tabStyles(activeTab === 'brands')}`}>
            <BadgeCheck size={16} />
            Brand
          </button>
        </div>
      </div>

      {activeTab === 'products' ? (
        <ProductsTab products={products} loading={productLoading} error={productError} onToggleStatus={toggleProductStatus} />
      ) : null}

      {activeTab === 'categories' ? (
        <CategoryPanel
          categories={categories}
          loading={categoryLoading}
          error={categoryError}
          search={categorySearch}
          setSearch={setCategorySearch}
          filteredCategories={filteredCategories}
          selectedCategory={categorySelected}
          panelMode={categoryPanelMode}
          onCreateNew={openCreateCategory}
          onEdit={openCategoryEdit}
          onView={openCategoryView}
          onToggleStatus={toggleCategoryStatus}
        />
      ) : null}

      {activeTab === 'brands' ? (
        <BrandPanel
          brands={brands}
          loading={brandLoading}
          error={brandError}
          search={brandSearch}
          setSearch={setBrandSearch}
          filteredBrands={filteredBrands}
          selectedBrand={brandSelected}
          panelMode={brandPanelMode}
          onCreateNew={openCreateBrand}
          onEdit={openBrandEdit}
          onView={openBrandView}
          onToggleStatus={toggleBrandStatus}
        />
      ) : null}
      {brandModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg">
            <form onSubmit={submitBrand} className="grid gap-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="m-0 text-[0.72rem] font-bold uppercase tracking-[0.18em] text-amber-600">Thêm / Sửa brand</p>
                  <h3 className="m-0 mt-2 text-xl font-extrabold text-slate-900">{brandPanelMode === 'edit' ? 'Chỉnh sửa brand' : 'Tạo brand'}</h3>
                </div>
                <button type="button" onClick={() => setBrandModalOpen(false)} className="text-sm text-slate-500 hover:text-slate-700">Đóng</button>
              </div>

              <div className="grid gap-3">
                <div>
                  <FieldLabel>Logo (1:1)</FieldLabel>
                  <div
                    onDrop={onBrandDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="relative mt-2 flex items-center justify-center gap-4 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-4 text-center"
                  >
                    <input ref={brandFileInputRef} type="file" accept="image/*" onChange={onBrandFileInput} className="hidden" />
                    {brandForm.logoUrl ? (
                      <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-white p-1">
                        <img src={brandForm.logoUrl} alt="logo" className="max-h-full max-w-full object-contain" />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-sm text-slate-500">Kéo thả hoặc</p>
                        <button type="button" onClick={openBrandFilePicker} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700">Chọn file</button>
                      </div>
                    )}
                    {brandUploading ? <div className="absolute right-3 top-3 text-xs text-slate-500">Đang upload...</div> : null}
                  </div>
                </div>

                <div className="grid gap-2">
                  <FieldLabel>Tên brand</FieldLabel>
                  <input placeholder="Ví dụ: L'Oréal Paris" value={brandForm.name} onChange={(e) => {
                      const name = e.target.value;
                      setBrandForm((c) => ({ ...c, name, slug: brandPanelMode === 'create' ? slugify(name) : c.slug }));
                    }} className="w-full rounded-lg border border-b-slate-900 bg-white px-4 py-3 text-sm outline-none placeholder:text-slate-400 transition-all focus:border-amber-600 focus:ring-2 focus:ring-amber-500/10" />
                </div>

                <div className="grid gap-2">
                  <FieldLabel>Slug (tự động)</FieldLabel>
                  <input placeholder="Tự động sinh từ tên" readOnly value={brandForm.slug} className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none" />
                </div>

                <div className="grid gap-2">
                  <FieldLabel>Mô tả</FieldLabel>
                  <textarea  value={brandForm.description} onChange={(e) => setBrandForm((c) => ({ ...c, description: e.target.value }))} rows={4} className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-amber-600 focus:ring-2 focus:ring-amber-500/10" />
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <FieldLabel>Quốc gia</FieldLabel>
                    <Select
                      options={countryOptions}
                      value={countryOptions.find((o: any) => o.label === brandForm.originCountry) || null}
                      onChange={(opt: any) => setBrandForm((c) => ({ ...c, originCountry: opt?.label || '' }))}
                      isClearable
                      placeholder="Chọn quốc gia"
                      styles={reactSelectStyles}
                      menuPlacement="top"
                      menuPosition="fixed"
                      className="w-full"
                      classNamePrefix="react-select"
                    />
                  </div>

                  <div>
                    <FieldLabel>Website</FieldLabel>
                    <input value={brandForm.websiteUrl} onChange={(e) => setBrandForm((c) => ({ ...c, websiteUrl: e.target.value }))} placeholder="https://example.com" className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none placeholder:text-slate-400" />
                  </div>
                </div>

                {/* Đang hiển thị mặc định true; không hiển thị checkbox theo yêu cầu */}

                <div className="flex items-center justify-end gap-2">
                  <button type="button" onClick={() => setBrandModalOpen(false)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Hủy</button>
                  <button type="submit" className="rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 px-4 py-2 text-sm font-bold text-white">{brandPanelMode === 'edit' ? 'Lưu' : 'Tạo'}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}
      {categoryModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg">
            <form onSubmit={submitCategory} className="grid gap-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="m-0 text-[0.72rem] font-bold uppercase tracking-[0.18em] text-amber-600">Thêm / Sửa category</p>
                  <h3 className="m-0 mt-2 text-xl font-extrabold text-slate-900">{categoryPanelMode === 'edit' ? 'Chỉnh sửa category' : 'Tạo category'}</h3>
                </div>
                <button type="button" onClick={() => setCategoryModalOpen(false)} className="text-sm text-slate-500 hover:text-slate-700">Đóng</button>
              </div>

              <div className="grid gap-3">
                <div>
                  <FieldLabel>Ảnh danh mục</FieldLabel>
                  <div
                    onDrop={(e) => { e.preventDefault(); const file = e.dataTransfer.files?.[0] || null; void handleCategoryFile(file); }}
                    onDragOver={(e) => e.preventDefault()}
                    className="relative mt-2 flex items-center justify-center gap-4 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-4 text-center"
                  >
                    <input ref={categoryFileInputRef} type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0] || null; void handleCategoryFile(file); }} className="hidden" />
                    {(categoryForm as CategoryFormState).imageUrl ? (
                      <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-white p-1">
                        <img src={(categoryForm as CategoryFormState).imageUrl} alt="category" className="max-h-full max-w-full object-contain" />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-sm text-slate-500">Kéo thả hoặc</p>
                        <button type="button" onClick={openCategoryFilePicker} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700">Chọn file</button>
                      </div>
                    )}
                    {categoryUploading ? <div className="absolute right-3 top-3 text-xs text-slate-500">Đang upload...</div> : null}
                  </div>
                </div>

                <div className="grid gap-2">
                  <FieldLabel>Tên</FieldLabel>
                  <input
                    placeholder="Tên danh mục"
                    value={(categoryForm as CategoryFormState).name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setCategoryForm((c) => ({ ...(c as CategoryFormState), name, slug: categoryPanelMode === 'create' ? slugify(name) : (c as CategoryFormState).slug }));
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none placeholder:text-slate-400 transition-all focus:border-amber-600 focus:ring-2 focus:ring-amber-500/10"
                  />
                </div>

                <div className="grid gap-2">
                  <FieldLabel>Slug (tự động)</FieldLabel>
                  <input placeholder="Tự động sinh" readOnly value={(categoryForm as CategoryFormState).slug} className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none" />
                </div>

                <div className="grid gap-2">
                  <FieldLabel>Mô tả</FieldLabel>
                  <textarea value={(categoryForm as CategoryFormState).description} onChange={(e) => setCategoryForm((c) => ({ ...(c as CategoryFormState), description: e.target.value }))} rows={4} className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-amber-600 focus:ring-2 focus:ring-amber-500/10" />
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <FieldLabel>Parent</FieldLabel>
                    <Select
                      options={parentCategoryOptions}
                      value={parentCategoryOptions.find((o: any) => o.value === (categoryForm as CategoryFormState).parentId) || null}
                      onChange={(opt: any) => setCategoryForm((c) => ({ ...(c as CategoryFormState), parentId: (opt as any)?.value || '' }))}
                      isClearable
                      placeholder="Chọn parent"
                      styles={reactSelectStyles}
                      menuPlacement="top"
                      menuPosition="fixed"
                      className="w-full"
                      classNamePrefix="react-select"
                    />
                  </div>

                  <div>
                    <FieldLabel>Ẩn / Hiện</FieldLabel>
                    <p className="text-sm text-slate-500 mt-2">Trạng thái mặc định: đang hiển thị</p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button type="button" onClick={() => setCategoryModalOpen(false)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Hủy</button>
                  <button type="submit" className="rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 px-4 py-2 text-sm font-bold text-white">{categoryPanelMode === 'edit' ? 'Lưu' : 'Tạo'}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};