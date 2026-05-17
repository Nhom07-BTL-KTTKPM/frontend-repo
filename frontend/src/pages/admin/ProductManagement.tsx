import { useEffect, useState } from 'react';
import { ChevronDown, Search, SlidersHorizontal, Edit2, Eye, Trash2, Copy, ToggleRight } from 'lucide-react';
import { productManagementApi } from '../../api/admin/productManagementApi';

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
  return (variants || []).reduce((sum, v) => sum + (v.stockQuantity || 0), 0);
};

const getTotalSold = (variants?: ProductVariantRow[]) => {
  return (variants || []).reduce((sum, v) => sum + (v.sold || 0), 0);
};

export const ProductManagement = () => {
  const [products, setProducts] = useState<ProductCardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const stats = {
    total: products.length,
    active: products.filter((p) => p.isActive).length,
    featured: products.filter((p) => p.isFeatured).length,
    outOfStock: products.filter((p) => getTotalStock(p.variants) === 0).length,
  };

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await productManagementApi.getProducts({ page: 0, size: 20 });

        if (!isMounted) {
          return;
        }

        setProducts((response.content || []) as ProductCardRow[]);
      } catch (requestError) {
        if (!isMounted) {
          return;
        }

        const message = requestError instanceof Error ? requestError.message : 'Không thể tải danh sách sản phẩm.';
        setError(message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const totalVariants = products.reduce((sum, product) => sum + (product.variants?.length || 0), 0);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div>
          <p className="m-0 text-slate-500 text-sm">Quản trị sản phẩm</p>
          <h2 className="m-0 mt-1 text-slate-900 text-2xl font-bold">Product management</h2>
          <p className="m-0 mt-2 text-slate-500 text-sm">
            {products.length} sản phẩm, {totalVariants} variants
          </p>
        </div>

        <button className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition">
          Add product
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Tổng sản phẩm', value: stats.total, color: 'from-blue-500 to-blue-600' },
          { label: 'Đang bán', value: stats.active, color: 'from-emerald-500 to-emerald-600' },
          { label: 'Sản phẩm tiêu biểu', value: stats.featured, color: 'from-amber-500 to-amber-600' },
          { label: 'Hết hàng', value: stats.outOfStock, color: 'from-red-500 to-red-600' },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`bg-gradient-to-br ${stat.color} rounded-xl p-4 text-white shadow-md`}
          >
            <p className="text-xs font-semibold opacity-90">{stat.label}</p>
            <p className="text-3xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <section className="grid gap-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="grid grid-cols-[1.8fr_1fr_1fr_1fr] gap-3 items-center">
          <label className="flex items-center gap-3 px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 transition">
            <Search size={18} />
            <input
              type="text"
              placeholder="Tìm theo tên sản phẩm, SKU, brand..."
              readOnly
              className="w-full border-none outline-none bg-transparent text-slate-900 text-sm placeholder-slate-400"
            />
          </label>

          <label className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer transition">
            <span className="whitespace-nowrap text-sm">Danh mục</span>
            <span className="flex items-center gap-1 text-slate-400">
              <span className="text-slate-900 font-semibold text-sm">Tất cả</span>
              <ChevronDown size={16} />
            </span>
          </label>

          <label className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer transition">
            <span className="whitespace-nowrap text-sm">Brand</span>
            <span className="flex items-center gap-1 text-slate-400">
              <span className="text-slate-900 font-semibold text-sm">Tất cả</span>
              <ChevronDown size={16} />
            </span>
          </label>

          <label className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer transition">
            <span className="whitespace-nowrap text-sm">Sắp xếp</span>
            <span className="flex items-center gap-1 text-slate-400">
              <span className="text-slate-900 font-semibold text-sm">Mới nhất</span>
              <ChevronDown size={16} />
            </span>
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-600 font-bold text-sm">
            <SlidersHorizontal size={16} />
            Lọc nhanh
          </div>

          <div className="flex flex-wrap gap-2">
            {['Nổi bật', 'Còn hàng', 'Đang bán chạy', 'Giá tăng dần'].map((label) => (
              <button
                key={label}
                type="button"
                className={`px-3 py-2 rounded-full text-xs font-bold transition ${
                  label === 'Nổi bật'
                    ? 'bg-slate-900 text-white hover:bg-slate-800'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {loading ? (
        <section className="grid grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
          {Array.from({ length: 12 }).map((_, index) => (
            <article
              key={index}
              className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm"
            >
              <div className="aspect-video bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-slate-200 rounded-full w-2/5 animate-pulse" />
                <div className="h-4 bg-slate-200 rounded-full w-3/4 animate-pulse" />
                <div className="h-3 bg-slate-100 rounded-full w-full animate-pulse" />
                <div className="h-8 bg-slate-100 rounded-lg animate-pulse mt-2" />
              </div>
            </article>
          ))}
        </section>
      ) : error ? (
        <section className="rounded-2xl bg-orange-50 p-5 border border-orange-200 text-orange-900">
          <h3 className="m-0 font-bold">Không thể tải sản phẩm</h3>
          <p className="m-0 mt-2 text-sm">{error}</p>
        </section>
      ) : products.length === 0 ? (
        <section className="rounded-2xl bg-white p-5 border border-slate-200 text-slate-500">
          Chưa có sản phẩm nào để hiển thị.
        </section>
      ) : (
        <section className="grid grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
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
                className="group overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-md hover:shadow-lg hover:border-slate-300 transition-all duration-200 cursor-pointer grid"
              >
                <div
                  className="relative aspect-video bg-slate-100 overflow-hidden"
                  style={{
                    background: imageUrl
                      ? `linear-gradient(180deg, rgba(15, 23, 42, 0.05), rgba(15, 23, 42, 0.15)), url(${imageUrl}) center/cover`
                      : 'linear-gradient(135deg, #dbeafe, #e0f2fe)',
                  }}
                >
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition duration-200" />

                  <div className="absolute top-2 left-2 flex gap-2 flex-wrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${tone.className}`}>
                      {tone.label}
                    </span>
                  </div>

                  {product.isFeatured ? (
                    <span
                      className="absolute right-2 top-2 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-300 to-amber-400 text-amber-900 shadow-md"
                    >
                      ⭐ Nổi bật
                    </span>
                  ) : null}

                  <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition duration-200">
                    <button className="p-2.5 bg-white rounded-full shadow-lg hover:bg-slate-50 transition" title="Xem chi tiết">
                      <Eye size={16} className="text-slate-700" />
                    </button>
                    <button className="p-2.5 bg-white rounded-full shadow-lg hover:bg-slate-50 transition" title="Chỉnh sửa">
                      <Edit2 size={16} className="text-slate-700" />
                    </button>
                    <button className="p-2.5 bg-white rounded-full shadow-lg hover:bg-slate-50 transition" title="Nhân bản">
                      <Copy size={16} className="text-slate-700" />
                    </button>
                    <button className="p-2.5 bg-white rounded-full shadow-lg hover:bg-slate-50 transition" title="Tắt/Bật">
                      <ToggleRight size={16} className="text-slate-700" />
                    </button>
                    <button className="p-2.5 bg-white rounded-full shadow-lg hover:bg-red-50 transition" title="Xóa">
                      <Trash2 size={16} className="text-red-600" />
                    </button>
                  </div>
                </div>

                <div className="p-3 grid gap-2">
                  <div className="min-w-0">
                    <p className="m-0 text-slate-500 text-xs font-semibold">{product.categoryName || 'Chưa có danh mục'}</p>
                    <h3 className="m-0 mt-1 text-slate-900 text-sm font-bold line-clamp-2">
                      {product.name}
                    </h3>
                  </div>

                  <div className="space-y-1">
                    <strong className="text-slate-900 text-sm font-bold block">
                      {displayPrice}
                    </strong>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 p-1.5 rounded-lg">
                      <p className="text-slate-500 font-semibold">Tồn kho</p>
                      <p className={`font-bold ${stockStatus.className}`}>{totalStock}</p>
                    </div>
                    <div className="bg-slate-50 p-1.5 rounded-lg">
                      <p className="text-slate-500 font-semibold">Đã bán</p>
                      <p className="font-bold text-slate-900">{totalSold}</p>
                    </div>
                  </div>

                  <div className="flex gap-1 pt-1">
                    <span className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
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