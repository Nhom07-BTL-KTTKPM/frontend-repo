import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  ChevronDown,
  Copy,
  Edit2,
  Eye,
  Layers3,
  LayoutGrid,
  Package2,
  Plus,
  Search,
  SlidersHorizontal,
  ToggleRight,
  Trash2,
  Upload,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { productManagementApi } from '../../api/admin/productManagementApi';
import { brandApi } from '../../api/brandApi';
import { categoryApi } from '../../api/categoryApi';
import type { BrandRequest, BrandResponse, BrandStatusRequest, CategoryRequest, CategoryResponse, CategoryStatusRequest } from '../../types/catalog';

type ProductVariantRow = {
  id: string;
  variantName?: string;
  sku?: string;
  price: number;
  originalPrice?: number;
  stockQuantity?: number;
  sold?: number;
  isActive?: boolean;
};

type ProductImageRow = {
  url: string;
  altText?: string;
  isPrimary?: boolean;
};

type ProductCardRow = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  minPrice?: number | null;
  maxPrice?: number | null;
  averageRating?: number;
  totalReviews?: number;
  totalSold?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  categoryName?: string;
  brandName?: string;
  brandLogoUrl?: string;
  images?: ProductImageRow[];
  variants?: ProductVariantRow[];
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
  return product.images?.find((image) => image.isPrimary)?.url || product.images?.[0]?.url || '';
};

const getPriceLabel = (product: ProductCardRow) => {
  if (product.minPrice !== undefined && product.minPrice !== null) {
    if (product.maxPrice !== undefined && product.maxPrice !== null && product.maxPrice !== product.minPrice) {
      return `${formatCurrency(product.minPrice)} - ${formatCurrency(product.maxPrice)}`;
    }

    return formatCurrency(product.minPrice);
  }

  const variantPrices = product.variants?.map((variant) => variant.price).filter((price): price is number => typeof price === 'number') || [];
  if (variantPrices.length === 0) {
    return 'Liên hệ';
  }

  const minPrice = Math.min(...variantPrices);
  const maxPrice = Math.max(...variantPrices);

  return minPrice === maxPrice ? formatCurrency(minPrice) : `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`;
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

const getTotalStock = (variants?: ProductVariantRow[]) => {
  return (variants || []).reduce((sum, variant) => sum + (variant.stockQuantity || 0), 0);
};

const getTotalSold = (variants?: ProductVariantRow[]) => {
  return (variants || []).reduce((sum, variant) => sum + (variant.sold || 0), 0);
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
    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50';

const resourceCardStyles = (active: boolean) =>
  active
    ? 'border-amber-300 bg-amber-50/50 shadow-[0_16px_34px_rgba(201,169,110,0.10)]'
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
      <p className="m-0 text-[0.72rem] font-bold uppercase tracking-[0.24em] text-amber-700">{eyebrow}</p>
      <h2 className="m-0 mt-2 text-2xl font-extrabold tracking-tight text-slate-900">{title}</h2>
      {description ? <p className="m-0 mt-2 max-w-3xl text-sm leading-6 text-slate-500">{description}</p> : null}
    </div>
  </div>
);

const StatCard = ({ label, value, tone }: { label: string; value: string | number; tone: string }) => (
  <article className={`rounded-2xl border px-4 py-4 shadow-sm ${tone}`}>
    <p className="m-0 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
    <p className="m-0 mt-2 text-3xl font-extrabold tracking-tight text-slate-900">{value}</p>
  </article>
);

const ProductStats = ({ products }: { products: ProductCardRow[] }) => {
  const stats = {
    total: products.length,
    active: products.filter((product) => product.isActive).length,
    featured: products.filter((product) => product.isFeatured).length,
    outOfStock: products.filter((product) => getTotalStock(product.variants) === 0).length,
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

const ProductsTab = ({ products, loading, error }: { products: ProductCardRow[]; loading: boolean; error: string | null }) => {
  const totalVariants = products.reduce((sum, product) => sum + (product.variants?.length || 0), 0);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div>
          <p className="m-0 text-sm text-slate-500">Quản trị sản phẩm</p>
          <h2 className="m-0 mt-1 text-2xl font-bold text-slate-900">Product management</h2>
          <p className="m-0 mt-2 text-sm text-slate-500">
            {products.length} sản phẩm, {totalVariants} variants
          </p>
        </div>

        <Link
          to="/admin/products/new"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-3 font-bold text-white shadow-lg transition hover:shadow-xl"
        >
          <Plus size={16} />
          Thêm sản phẩm
        </Link>
      </div>

      <ProductStats products={products} />

      <section className="grid gap-4 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 xl:grid-cols-[1.8fr_1fr_1fr_1fr]">
          <label className="flex items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-600 transition hover:bg-slate-50">
            <Search size={18} />
            <input
              type="text"
              placeholder="Tìm theo tên sản phẩm, SKU, brand..."
              readOnly
              className="w-full border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
          </label>

          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-600 transition hover:bg-slate-50">
            <span className="whitespace-nowrap text-sm">Danh mục</span>
            <span className="flex items-center gap-1 text-slate-400">
              <span className="text-sm font-semibold text-slate-900">Tất cả</span>
              <ChevronDown size={16} />
            </span>
          </label>

          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-600 transition hover:bg-slate-50">
            <span className="whitespace-nowrap text-sm">Brand</span>
            <span className="flex items-center gap-1 text-slate-400">
              <span className="text-sm font-semibold text-slate-900">Tất cả</span>
              <ChevronDown size={16} />
            </span>
          </label>

          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-600 transition hover:bg-slate-50">
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
            <article key={index} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
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
        <section className="rounded-2xl border border-orange-200 bg-orange-50 p-5 text-orange-900">
          <h3 className="m-0 font-bold">Không thể tải sản phẩm</h3>
          <p className="m-0 mt-2 text-sm">{error}</p>
        </section>
      ) : products.length === 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-500">
          Chưa có sản phẩm nào để hiển thị.
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
          {products.map((product) => {
            const imageUrl = getProductImage(product);
            const variants = product.variants || [];
            const tone = statusTone(product.isActive);
            const displayPrice = getPriceLabel(product);
            const totalStock = getTotalStock(variants);
            const totalSold = getTotalSold(variants);
            const stockStatus = getStockStatus(totalStock);

            return (
              <article
                key={product.id}
                className="group grid cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md transition-all duration-200 hover:border-slate-300 hover:shadow-lg"
              >
                <div
                  className="relative aspect-video overflow-hidden bg-slate-100"
                  style={{
                    background: imageUrl
                      ? `linear-gradient(180deg, rgba(15, 23, 42, 0.05), rgba(15, 23, 42, 0.15)), url(${imageUrl}) center/cover`
                      : 'linear-gradient(135deg, #dbeafe, #e0f2fe)',
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
                    <button className="rounded-full bg-white p-2.5 shadow-lg transition hover:bg-slate-50" title="Xem chi tiết">
                      <Eye size={16} className="text-slate-700" />
                    </button>
                    <button className="rounded-full bg-white p-2.5 shadow-lg transition hover:bg-slate-50" title="Chỉnh sửa">
                      <Edit2 size={16} className="text-slate-700" />
                    </button>
                    <button className="rounded-full bg-white p-2.5 shadow-lg transition hover:bg-slate-50" title="Nhân bản">
                      <Copy size={16} className="text-slate-700" />
                    </button>
                    <button className="rounded-full bg-white p-2.5 shadow-lg transition hover:bg-slate-50" title="Tắt/Bật">
                      <ToggleRight size={16} className="text-slate-700" />
                    </button>
                    <button className="rounded-full bg-white p-2.5 shadow-lg transition hover:bg-red-50" title="Xóa">
                      <Trash2 size={16} className="text-red-600" />
                    </button>
                  </div>
                </div>

                <div className="grid gap-2 p-3">
                  <div className="min-w-0">
                    <p className="m-0 text-xs font-semibold text-slate-500">{product.categoryName || 'Chưa có danh mục'}</p>
                    <h3 className="m-0 mt-1 line-clamp-2 text-sm font-bold text-slate-900">{product.name}</h3>
                  </div>

                  <div className="space-y-1">
                    <strong className="block text-sm font-bold text-slate-900">{displayPrice}</strong>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-slate-50 p-1.5">
                      <p className="font-semibold text-slate-500">Tồn kho</p>
                      <p className={`font-bold ${stockStatus.className}`}>{totalStock}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-1.5">
                      <p className="font-semibold text-slate-500">Đã bán</p>
                      <p className="font-bold text-slate-900">{totalSold}</p>
                    </div>
                  </div>

                  <div className="flex gap-1 pt-1">
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                      {product.brandName || 'No brand'}
                    </span>
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
}) => <article className={`rounded-2xl border p-4 transition ${resourceCardStyles(active)}`}>{children}</article>;

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
    <p className="m-0 text-[0.72rem] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p>
    <div className="mt-2 text-sm font-medium text-slate-900">{value}</div>
  </div>
);

const ImagePreview = ({ src, alt }: { src?: string; alt: string }) => {
  if (!src) {
    return (
      <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-400">
        Chưa có hình ảnh
      </div>
    );
  }

  return <img src={src} alt={alt} className="h-32 w-full rounded-2xl border border-slate-200 object-cover" />;
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
  form,
  setForm,
  slugTouched,
  setSlugTouched,
  onCreateNew,
  onEdit,
  onView,
  onToggleStatus,
  onSubmit,
  parentOptions,
}: {
  categories: CategoryResponse[];
  loading: boolean;
  error: string | null;
  search: string;
  setSearch: (value: string) => void;
  filteredCategories: CategoryResponse[];
  selectedCategory: CategoryResponse | null;
  panelMode: PanelMode;
  form: CategoryFormState;
  setForm: React.Dispatch<React.SetStateAction<CategoryFormState>>;
  slugTouched: boolean;
  setSlugTouched: React.Dispatch<React.SetStateAction<boolean>>;
  onCreateNew: () => void;
  onEdit: (category: CategoryResponse) => void;
  onView: (category: CategoryResponse) => void;
  onToggleStatus: (category: CategoryResponse) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  parentOptions: CategoryResponse[];
}) => {
  const isEditing = panelMode === 'edit';
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
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition hover:shadow-xl"
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
            <StatCard label="Tổng category" value={categories.length} tone="bg-white border-slate-200" />
            <StatCard label="Đang hiển thị" value={categories.filter((item) => item.isActive).length} tone="bg-white border-slate-200" />
            <StatCard label="Root category" value={categories.filter((item) => !item.parentId).length} tone="bg-white border-slate-200" />
          </div>

          {loading ? (
            <div className="grid gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5 text-orange-900">
              <p className="m-0 font-bold">Không thể tải category</p>
              <p className="m-0 mt-2 text-sm">{error}</p>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-500">
              Chưa có category nào phù hợp.
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredCategories.map((category) => {
                const active = selectedCategory?.id === category.id;

                return (
                  <ResourceListItem key={category.id} active={active}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                          {category.imageUrl ? (
                            <img src={category.imageUrl} alt={category.name} className="h-full w-full object-cover" />
                          ) : (
                            <Layers3 size={18} className="text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="m-0 text-base font-bold text-slate-900">{category.name}</h3>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${category.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                              {category.isActive ? 'Đang hiển thị' : 'Đã ẩn'}
                            </span>
                          </div>
                          <p className="m-0 mt-1 text-sm text-slate-500">{category.slug}</p>
                          <p className="m-0 mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                            {category.description || 'Chưa có mô tả'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => onView(category)}
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                        >
                          <Eye size={14} />
                          Xem
                        </button>
                        <button
                          type="button"
                          onClick={() => onEdit(category)}
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                        >
                          <Edit2 size={14} />
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleStatus(category)}
                          className={`inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold transition ${
                            category.isActive
                              ? 'border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                              : 'border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                          }`}
                        >
                          <ToggleRight size={14} />
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

        <aside className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          {isViewing && selectedCategory ? (
            <div className="grid gap-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="m-0 text-[0.72rem] font-bold uppercase tracking-[0.2em] text-amber-700">Chi tiết category</p>
                  <h3 className="m-0 mt-2 text-xl font-extrabold text-slate-900">{selectedCategory.name}</h3>
                  <p className="m-0 mt-1 text-sm text-slate-500">{selectedCategory.slug}</p>
                </div>

                <button
                  type="button"
                  onClick={() => onEdit(selectedCategory)}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
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
                <DetailRow label="Trạng thái" value={selectedCategory.isActive ? 'Đang hiển thị' : 'Đã ẩn'} />
                <DetailRow label="Tạo lúc" value={formatDateTime(selectedCategory.createdAt)} />
                <DetailRow label="Cập nhật lúc" value={formatDateTime(selectedCategory.updatedAt)} />
              </div>
            </div>
          ) : (
            <form className="grid gap-4" onSubmit={onSubmit}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="m-0 text-[0.72rem] font-bold uppercase tracking-[0.2em] text-amber-700">
                    {isEditing ? 'Chỉnh sửa category' : 'Thêm category mới'}
                  </p>
                  <h3 className="m-0 mt-2 text-xl font-extrabold text-slate-900">
                    {isEditing ? selectedCategory?.name || 'Category' : 'Tạo category'}
                  </h3>
                </div>

                {panelMode !== 'create' ? (
                  <button
                    type="button"
                    onClick={onCreateNew}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    Tạo mới
                  </button>
                ) : null}
              </div>

              <div className="grid gap-3">
                <div className="grid gap-2">
                  <FieldLabel>Tên category</FieldLabel>
                  <input
                    value={form.name}
                    onChange={(event) => {
                      const value = event.target.value;
                      setForm((current) => ({
                        ...current,
                        name: value,
                        slug: slugTouched ? current.slug : slugify(value),
                      }));
                    }}
                    placeholder="Ví dụ: Chăm sóc da"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                  />
                </div>

                <div className="grid gap-2">
                  <FieldLabel>Slug</FieldLabel>
                  <input
                    value={form.slug}
                    onChange={(event) => {
                      setSlugTouched(true);
                      setForm((current) => ({ ...current, slug: event.target.value }));
                    }}
                    placeholder="vi-du-cham-soc-da"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                  />
                </div>

                <div className="grid gap-2">
                  <FieldLabel>Mô tả</FieldLabel>
                  <textarea
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    rows={4}
                    placeholder="Mô tả category"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                  />
                </div>

                <div className="grid gap-2">
                  <FieldLabel>Ảnh category</FieldLabel>
                  <input
                    value={form.imageUrl}
                    onChange={(event) => setForm((current) => ({ ...current, imageUrl: event.target.value }))}
                    placeholder="https://..."
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                  />
                </div>

                <div className="grid gap-2">
                  <FieldLabel>Category cha</FieldLabel>
                  <select
                    value={form.parentId}
                    onChange={(event) => setForm((current) => ({ ...current, parentId: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                  >
                    <option value="">Root category</option>
                    {parentOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </div>

                <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                  <span>Đang hiển thị</span>
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
                    className="h-4 w-4 accent-amber-600"
                  />
                </label>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:shadow-xl"
                >
                  <Upload size={16} />
                  {isEditing ? 'Lưu thay đổi' : 'Tạo category'}
                </button>
              </div>
            </form>
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
  form,
  setForm,
  slugTouched,
  setSlugTouched,
  onCreateNew,
  onEdit,
  onView,
  onToggleStatus,
  onSubmit,
}: {
  brands: BrandResponse[];
  loading: boolean;
  error: string | null;
  search: string;
  setSearch: (value: string) => void;
  filteredBrands: BrandResponse[];
  selectedBrand: BrandResponse | null;
  panelMode: PanelMode;
  form: BrandFormState;
  setForm: React.Dispatch<React.SetStateAction<BrandFormState>>;
  slugTouched: boolean;
  setSlugTouched: React.Dispatch<React.SetStateAction<boolean>>;
  onCreateNew: () => void;
  onEdit: (brand: BrandResponse) => void;
  onView: (brand: BrandResponse) => void;
  onToggleStatus: (brand: BrandResponse) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) => {
  const isEditing = panelMode === 'edit';
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
            <StatCard label="Tổng brand" value={brands.length} tone="bg-white border-slate-200" />
            <StatCard label="Đang hiển thị" value={brands.filter((item) => item.isActive).length} tone="bg-white border-slate-200" />
            <StatCard label="Có logo" value={brands.filter((item) => Boolean(item.logoUrl)).length} tone="bg-white border-slate-200" />
          </div>

          {loading ? (
            <div className="grid gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5 text-orange-900">
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
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-3">
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
                              {brand.isActive ? 'Đang hiển thị' : 'Đã ẩn'}
                            </span>
                          </div>
                          <p className="m-0 mt-1 text-sm text-slate-500">{brand.slug}</p>
                          <p className="m-0 mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                            {brand.description || 'Chưa có mô tả'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => onView(brand)}
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                        >
                          <Eye size={14} />
                          Xem
                        </button>
                        <button
                          type="button"
                          onClick={() => onEdit(brand)}
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                        >
                          <Edit2 size={14} />
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleStatus(brand)}
                          className={`inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold transition ${
                            brand.isActive
                              ? 'border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                              : 'border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                          }`}
                        >
                          <ToggleRight size={14} />
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

        <aside className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          {isViewing && selectedBrand ? (
            <div className="grid gap-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="m-0 text-[0.72rem] font-bold uppercase tracking-[0.2em] text-indigo-700">Chi tiết brand</p>
                  <h3 className="m-0 mt-2 text-xl font-extrabold text-slate-900">{selectedBrand.name}</h3>
                  <p className="m-0 mt-1 text-sm text-slate-500">{selectedBrand.slug}</p>
                </div>

                <button
                  type="button"
                  onClick={() => onEdit(selectedBrand)}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
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
                <DetailRow label="Trạng thái" value={selectedBrand.isActive ? 'Đang hiển thị' : 'Đã ẩn'} />
                <DetailRow label="Tạo lúc" value={formatDateTime(selectedBrand.createdAt)} />
                <DetailRow label="Cập nhật lúc" value={formatDateTime(selectedBrand.updatedAt)} />
              </div>
            </div>
          ) : (
            <form className="grid gap-4" onSubmit={onSubmit}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="m-0 text-[0.72rem] font-bold uppercase tracking-[0.2em] text-indigo-700">
                    {isEditing ? 'Chỉnh sửa brand' : 'Thêm brand mới'}
                  </p>
                  <h3 className="m-0 mt-2 text-xl font-extrabold text-slate-900">
                    {isEditing ? selectedBrand?.name || 'Brand' : 'Tạo brand'}
                  </h3>
                </div>

                {panelMode !== 'create' ? (
                  <button
                    type="button"
                    onClick={onCreateNew}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    Tạo mới
                  </button>
                ) : null}
              </div>

              <div className="grid gap-3">
                <div className="grid gap-2">
                  <FieldLabel>Tên brand</FieldLabel>
                  <input
                    value={form.name}
                    onChange={(event) => {
                      const value = event.target.value;
                      setForm((current) => ({
                        ...current,
                        name: value,
                        slug: slugTouched ? current.slug : slugify(value),
                      }));
                    }}
                    placeholder="Ví dụ: L'Oréal Paris"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                <div className="grid gap-2">
                  <FieldLabel>Slug</FieldLabel>
                  <input
                    value={form.slug}
                    onChange={(event) => {
                      setSlugTouched(true);
                      setForm((current) => ({ ...current, slug: event.target.value }));
                    }}
                    placeholder="loreal-paris"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                <div className="grid gap-2">
                  <FieldLabel>Mô tả</FieldLabel>
                  <textarea
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    rows={4}
                    placeholder="Mô tả brand"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                <div className="grid gap-2">
                  <FieldLabel>Logo URL</FieldLabel>
                  <input
                    value={form.logoUrl}
                    onChange={(event) => setForm((current) => ({ ...current, logoUrl: event.target.value }))}
                    placeholder="https://..."
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <FieldLabel>Quốc gia</FieldLabel>
                    <input
                      value={form.originCountry}
                      onChange={(event) => setForm((current) => ({ ...current, originCountry: event.target.value }))}
                      placeholder="France"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>

                  <div className="grid gap-2">
                    <FieldLabel>Website</FieldLabel>
                    <input
                      value={form.websiteUrl}
                      onChange={(event) => setForm((current) => ({ ...current, websiteUrl: event.target.value }))}
                      placeholder="https://..."
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>
                </div>

                <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                  <span>Đang hiển thị</span>
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
                    className="h-4 w-4 accent-indigo-600"
                  />
                </label>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:shadow-xl"
                >
                  <Upload size={16} />
                  {isEditing ? 'Lưu thay đổi' : 'Tạo brand'}
                </button>
              </div>
            </form>
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
  const [categorySlugTouched, setCategorySlugTouched] = useState(false);

  const [brands, setBrands] = useState<BrandResponse[]>([]);
  const [brandLoading, setBrandLoading] = useState(false);
  const [brandError, setBrandError] = useState<string | null>(null);
  const [brandSearch, setBrandSearch] = useState('');
  const [brandPanelMode, setBrandPanelMode] = useState<PanelMode>('create');
  const [brandSelected, setBrandSelected] = useState<BrandResponse | null>(null);
  const [brandForm, setBrandForm] = useState<BrandFormState>(emptyBrandForm());
  const [brandSlugTouched, setBrandSlugTouched] = useState(false);

  const loadProducts = async () => {
    try {
      setProductLoading(true);
      setProductError(null);

      const response = await productManagementApi.getProducts({ page: 0, size: 20 });
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
    setCategorySlugTouched(false);
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
    setCategorySlugTouched(true);
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
    setCategorySlugTouched(true);
  };

  const openCreateBrand = () => {
    setBrandPanelMode('create');
    setBrandSelected(null);
    setBrandForm(emptyBrandForm());
    setBrandSlugTouched(false);
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
    setBrandSlugTouched(true);
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
    setBrandSlugTouched(true);
  };

  const submitCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload: CategoryRequest = {
      name: categoryForm.name.trim(),
      slug: categoryForm.slug.trim(),
      description: trimOrUndefined(categoryForm.description),
      imageUrl: trimOrUndefined(categoryForm.imageUrl),
      parentId: categoryForm.parentId.trim() || null,
      isActive: categoryForm.isActive,
    };

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
        setCategorySlugTouched(true);
        toast.success('Đã cập nhật category.');
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
        setCategorySlugTouched(true);
        toast.success('Đã tạo category mới.');
      }
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Không thể lưu category.';
      toast.error(message);
    }
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
        setBrandSlugTouched(true);
        toast.success('Đã cập nhật brand.');
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
        setBrandSlugTouched(true);
        toast.success('Đã tạo brand mới.');
      }
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Không thể lưu brand.';
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

  const parentCategoryOptions = useMemo(
    () => categories.filter((category) => category.id !== categorySelected?.id),
    [categories, categorySelected?.id],
  );

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
        <ProductsTab products={products} loading={productLoading} error={productError} />
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
          form={categoryForm}
          setForm={setCategoryForm}
          slugTouched={categorySlugTouched}
          setSlugTouched={setCategorySlugTouched}
          onCreateNew={openCreateCategory}
          onEdit={openCategoryEdit}
          onView={openCategoryView}
          onToggleStatus={toggleCategoryStatus}
          onSubmit={submitCategory}
          parentOptions={parentCategoryOptions}
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
          form={brandForm}
          setForm={setBrandForm}
          slugTouched={brandSlugTouched}
          setSlugTouched={setBrandSlugTouched}
          onCreateNew={openCreateBrand}
          onEdit={openBrandEdit}
          onView={openBrandView}
          onToggleStatus={toggleBrandStatus}
          onSubmit={submitBrand}
        />
      ) : null}
    </div>
  );
};