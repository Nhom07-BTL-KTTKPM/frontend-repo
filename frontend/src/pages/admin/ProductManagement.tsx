import { useEffect, useState } from 'react';
import { ChevronDown, Search, SlidersHorizontal } from 'lucide-react';
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
      background: '#dcfce7',
      color: '#166534',
      fontSize: '10px',
      label: 'ACTIVE',
    };
  }

  return {
    background: '#fee2e2',
    color: '#991b1b',
    fontSize: '10px',
    label: 'INACTIVE',
  };
};

export const ProductManagement = () => {
  const [products, setProducts] = useState<ProductCardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    <div style={{ display: 'grid', gap: '1rem' }}>
      <section
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div>
          <p style={{ margin: 0, color: '#64748b' }}>Quản trị sản phẩm</p>
          <h2 style={{ margin: '0.25rem 0 0', color: '#0f172a' }}>Product management</h2>
          <p style={{ margin: '0.5rem 0 0', color: '#64748b' }}>
            {products.length} sản phẩm, {totalVariants} variants
          </p>
        </div>

        <button
          style={{
            border: 'none',
            borderRadius: '14px',
            padding: '0.9rem 1.2rem',
            background: 'linear-gradient(135deg, #4f46e5, #2563eb)',
            color: '#fff',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 12px 24px rgba(37, 99, 235, 0.25)',
          }}
        >
          Add product
        </button>
      </section>

      <section
        style={{
          display: 'grid',
          gap: '0.9rem',
          borderRadius: '22px',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.18)',
          boxShadow: '0 14px 36px rgba(15, 23, 42, 0.06)',
          padding: '1rem',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.8fr) repeat(3, minmax(160px, 1fr))',
            gap: '0.8rem',
            alignItems: 'center',
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.95rem 1rem',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              background: '#fff',
              color: '#475569',
            }}
          >
            <Search size={18} />
            <input
              type="text"
              placeholder="Tìm theo tên sản phẩm, SKU, brand..."
              readOnly
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                background: 'transparent',
                color: '#0f172a',
                fontSize: '0.95rem',
              }}
            />
          </label>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              padding: '0.95rem 1rem',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              background: '#fff',
              color: '#475569',
            }}
          >
            <span style={{ whiteSpace: 'nowrap', fontSize: '0.92rem' }}>Danh mục</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#94a3b8' }}>
              <span style={{ color: '#0f172a', fontWeight: 600 }}>Tất cả</span>
              <ChevronDown size={16} />
            </span>
          </label>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              padding: '0.95rem 1rem',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              background: '#fff',
              color: '#475569',
            }}
          >
            <span style={{ whiteSpace: 'nowrap', fontSize: '0.92rem' }}>Brand</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#94a3b8' }}>
              <span style={{ color: '#0f172a', fontWeight: 600 }}>Tất cả</span>
              <ChevronDown size={16} />
            </span>
          </label>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              padding: '0.95rem 1rem',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              background: '#fff',
              color: '#475569',
            }}
          >
            <span style={{ whiteSpace: 'nowrap', fontSize: '0.92rem' }}>Sắp xếp</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#94a3b8' }}>
              <span style={{ color: '#0f172a', fontWeight: 600 }}>Mới nhất</span>
              <ChevronDown size={16} />
            </span>
          </label>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.55rem', color: '#475569', fontWeight: 700 }}>
            <SlidersHorizontal size={16} />
            Lọc nhanh
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {['Featured', 'Còn hàng', 'Đang bán chạy', 'Giá tăng dần'].map((label) => (
              <button
                key={label}
                type="button"
                style={{
                  border: '1px solid #dbe4f0',
                  borderRadius: '999px',
                  padding: '0.55rem 0.85rem',
                  background: label === 'Featured' ? '#0f172a' : '#fff',
                  color: label === 'Featured' ? '#fff' : '#334155',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'default',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {loading ? (
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
            gap: '1rem',
          }}
        >
          {Array.from({ length: 6 }).map((_, index) => (
            <article
              key={index}
              style={{
                overflow: 'hidden',
                borderRadius: '24px',
                background: '#ffffff',
                border: '1px solid rgba(148, 163, 184, 0.18)',
                boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)',
              }}
            >
              <div style={{ aspectRatio: '16 / 11', background: 'linear-gradient(90deg, #e2e8f0 0%, #f8fafc 50%, #e2e8f0 100%)' }} />
              <div style={{ padding: '1rem', display: 'grid', gap: '0.7rem' }}>
                <div style={{ width: '42%', height: '14px', borderRadius: '999px', background: '#e2e8f0' }} />
                <div style={{ width: '78%', height: '22px', borderRadius: '999px', background: '#e2e8f0' }} />
                <div style={{ width: '100%', height: '54px', borderRadius: '16px', background: '#f1f5f9' }} />
                <div style={{ width: '100%', height: '78px', borderRadius: '16px', background: '#f8fafc' }} />
              </div>
            </article>
          ))}
        </section>
      ) : error ? (
        <section
          style={{
            borderRadius: '20px',
            background: '#fff7ed',
            padding: '1.25rem',
            border: '1px solid #fed7aa',
            color: '#9a3412',
          }}
        >
          <h3 style={{ margin: 0 }}>Không thể tải sản phẩm</h3>
          <p style={{ margin: '0.5rem 0 0' }}>{error}</p>
        </section>
      ) : products.length === 0 ? (
        <section
          style={{
            borderRadius: '20px',
            background: '#ffffff',
            padding: '1.25rem',
            border: '1px solid rgba(148, 163, 184, 0.18)',
            color: '#64748b',
          }}
        >
          Chưa có sản phẩm nào để hiển thị.
        </section>
      ) : (
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
            gap: '1rem',
          }}
        >
          {products.map((product) => {
            const imageUrl = getProductImage(product);
            const variants = product.variants || [];
            const tone = statusTone(product.isActive);
            const displayPrice = getPriceLabel(product);

            return (
              <article
                key={product.id}
                style={{
                  overflow: 'hidden',
                  borderRadius: '20px',
                  background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                  border: '1px solid rgba(148, 163, 184, 0.18)',
                  boxShadow: '0 14px 30px rgba(15, 23, 42, 0.08)',
                  display: 'grid',
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    aspectRatio: '4 / 3',
                    background: imageUrl
                      ? `linear-gradient(180deg, rgba(15, 23, 42, 0.04), rgba(15, 23, 42, 0.2)), url(${imageUrl}) center/cover`
                      : 'linear-gradient(135deg, #dbeafe, #e0f2fe)',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '1rem',
                      left: '1rem',
                      display: 'inline-flex',
                      gap: '0.5rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '0.35rem 0.7rem',
                        borderRadius: '999px',
                        background: tone.background,
                        color: tone.color,
                        fontSize: '0.78rem',
                        fontWeight: 800,
                      }}
                    >
                      {tone.label}
                    </span>
                  </div>

                  {product.isFeatured ? (
                    <span
                      style={{
                        position: 'absolute',
                        right: '1rem',
                        top: '1rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '0.35rem 0.7rem',
                        borderRadius: '999px',
                        background: '#fef3c7',
                        color: '#92400e',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                      }}
                    >
                      Featured
                    </span>
                  ) : null}
                </div>

                <div style={{ padding: '0.95rem', display: 'grid', gap: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '0.78rem' }}>{product.categoryName || 'Chưa có danh mục'}</p>
                      <h3
                        style={{
                          margin: '0.2rem 0 0',
                          color: '#0f172a',
                          lineHeight: 1.25,
                          fontSize: '0.98rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {product.name}
                      </h3>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: '0.25rem',
                    }}
                  >
                    <strong style={{ color: '#0f172a', fontSize: '0.98rem' }}>
                      {displayPrice}
                    </strong>

                    <span style={{ color: '#64748b', fontSize: '0.78rem' }}>
                      {variants.length} phân loại
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