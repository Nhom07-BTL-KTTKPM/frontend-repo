import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, Star, X } from 'lucide-react';
import { productApi } from '../api/productApi';
import ProductCard from '../components/ProductCard';
import type { Product } from '../types/product';

export const ProductList: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['products'],
    // Ưu tiên lấy res.content từ develop (chuẩn Spring Boot Page), fallback về res.data của HEAD
    queryFn: () => productApi.getProducts().then((res: any) => res.content ?? res.data ?? []),
  });

  const products = (data ?? []) as Product[];
  const [searchInput, setSearchInput] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [sortBy, setSortBy] = useState('default');

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSkinTypes, setSelectedSkinTypes] = useState<string[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const [selectedAvailability, setSelectedAvailability] = useState<string[]>(['in-stock']);
  const [selectedPromotions, setSelectedPromotions] = useState<string[]>(['best-seller']);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);

  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(0);
  const [computedPriceMax, setComputedPriceMax] = useState(200);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Lazy load filter lists only when user interacts with filter area or opens drawer
  const [shouldLoadFilters, setShouldLoadFilters] = useState(false);

  // fetch summaries lazily via productApi
  const {
    data: categoriesSummary,
    isLoading: isLoadingCategories,
  } = useQuery({
    queryKey: ['categories', 'summary'],
    queryFn: () => productApi.getCategoriesSummary().then((res: any) => res ?? []),
    enabled: shouldLoadFilters,
  });

  const {
    data: brandsSummary,
    isLoading: isLoadingBrands,
  } = useQuery({
    queryKey: ['brands', 'summary'],
    queryFn: () => productApi.getBrandsSummary().then((res: any) => res ?? []),
    enabled: shouldLoadFilters,
  });

  const categoryOptions = useMemo(() => {
    if (!shouldLoadFilters) return [];

    if (Array.isArray(categoriesSummary) && categoriesSummary.length > 0) {
      // Prefer summary endpoint response; try to map to name or title
      return Array.from(new Set(categoriesSummary.map((c: any) => c.name ?? c.title ?? String(c))));
    }
    return Array.from(
      new Set(products.map((p) => p.category?.name).filter((name): name is string => Boolean(name && name.trim())))
    );
  }, [categoriesSummary, products, shouldLoadFilters]);

  const brandOptions = useMemo(() => {
    if (!shouldLoadFilters) return [];

    if (Array.isArray(brandsSummary) && brandsSummary.length > 0) {
      return Array.from(new Set(brandsSummary.map((b: any) => b.name ?? b.title ?? String(b))));
    }
    return Array.from(new Set(products.map((p) => p.brand?.name).filter((name): name is string => Boolean(name && name.trim()))));
  }, [brandsSummary, products, shouldLoadFilters]);

  const skinTypeOptions = ['Normal', 'Oily', 'Dry', 'Combination', 'Sensitive'];
  const promotionOptions = ['Hàng mới', 'Bán chạy', 'Đang giảm giá'];
  const availabilityOptions = [
    { id: 'in-stock', label: 'Còn hàng' },
    { id: 'out-of-stock', label: 'Hết hàng' },
  ];

  const displayedProducts = useMemo(() => {
    let list = products;

    // keyword
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.trim().toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(keyword));
    }

    // categories filter
    if (selectedCategories.length > 0) {
      list = list.filter((p) => selectedCategories.includes(p.category?.name ?? ''));
    }

    // brands filter
    if (selectedBrands.length > 0) {
      list = list.filter((p) => selectedBrands.includes(p.brand?.name ?? ''));
    }

    // skin types (if available on product)
    if (selectedSkinTypes.length > 0) {
      list = list.filter((p) => {
        const types = p.suitableSkinTypes ?? [];
        return selectedSkinTypes.some((t) => types.includes(t));
      });
    }

    // price range (min/max may come from product fields minPrice/maxPrice)
    list = list.filter((p) => {
      const min = p.minPrice ?? 0;
      const max = p.maxPrice ?? 0;
      return max >= priceMin && min <= priceMax;
    });

    // ratings
    if (selectedRatings.length > 0) {
      list = list.filter((p) => selectedRatings.includes(Math.round(p.averageRating ?? 0)));
    }

    return list;
  }, [products, searchKeyword, selectedCategories, selectedBrands, selectedSkinTypes, priceMin, priceMax, selectedRatings]);

  // compute global price bounds from products so default slider doesn't filter everything
  React.useEffect(() => {
    if (!products || products.length === 0) return;
    const mins = products.map((p) => Number(p.minPrice ?? p.price ?? 0)).filter((v) => !Number.isNaN(v));
    const maxs = products.map((p) => Number(p.maxPrice ?? p.price ?? 0)).filter((v) => !Number.isNaN(v));
    const globalMin = mins.length ? Math.min(...mins) : 0;
    const globalMax = maxs.length ? Math.max(...maxs) : 200;
    setComputedPriceMax(globalMax > 0 ? globalMax : 200);

    // if user hasn't adjusted price (both 0), initialize to product bounds
    if (priceMin === 0 && priceMax === 0) {
      setPriceMin(globalMin > 0 ? globalMin : 0);
      setPriceMax(globalMax > 0 ? globalMax : 200);
    }
  }, [products]);

  const totalPages = Math.max(1, Math.ceil(displayedProducts.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedProducts = displayedProducts.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);
  const pageStart = displayedProducts.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const pageEnd = Math.min(safeCurrentPage * pageSize, displayedProducts.length);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchKeyword]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategories, selectedBrands, selectedSkinTypes, priceMin, priceMax, selectedRatings]);

  // Scroll to top of product list when user navigates pages
  React.useEffect(() => {
    try {
      const el = document.querySelector('.product-list-page');
      if (el) {
        const top = (window.scrollY || window.pageYOffset) + el.getBoundingClientRect().top - 20;
        window.scrollTo({ top, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      // fallback
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage]);

  const toggleTextFilter = (
    value: string,
    setSelected: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setSelected((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
  };

  const toggleRatingFilter = (rating: number) => {
    setSelectedRatings((prev) => (prev.includes(rating) ? prev.filter((item) => item !== rating) : [...prev, rating]));
  };

  const onSubmitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchKeyword(searchInput);
  };

  const renderFilterPanel = () => (
    <>
      <div className="product-list__filter-group">
        <h3>Theo danh mục</h3>
        <div className="product-list__filter-items">
          {shouldLoadFilters && isLoadingCategories ? (
            <p className="product-list__filter-loading">Đang tải danh mục...</p>
          ) : categoryOptions.length > 0 ? (
            categoryOptions.map((categoryName) => (
              <label key={categoryName} className="product-list__check-row">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(categoryName)}
                  onChange={() => toggleTextFilter(categoryName, setSelectedCategories)}
                />
                <span>{categoryName}</span>
              </label>
            ))
          ) : (
            <p className="product-list__filter-empty">Chưa có danh mục để hiển thị</p>
          )}
        </div>
      </div>

        <div className="product-list__filter-group">
          <h3>Theo thương hiệu</h3>
          <div className="product-list__filter-items">
              {shouldLoadFilters && isLoadingBrands ? (
                <p className="product-list__filter-loading">Đang tải thương hiệu...</p>
              ) : brandOptions.length > 0 ? (
              brandOptions.map((brandName) => (
                <label key={brandName} className="product-list__check-row">
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brandName)}
                    onChange={() => toggleTextFilter(brandName, setSelectedBrands)}
                  />
                  <span>{brandName}</span>
                </label>
              ))
            ) : (
              <p className="product-list__filter-empty">Chưa có thương hiệu để hiển thị</p>
            )}
          </div>
        </div>

      <div className="product-list__filter-group">
        <h3>Theo loại da</h3>
        <div className="product-list__filter-items">
          {skinTypeOptions.map((skinType) => (
            <label key={skinType} className="product-list__check-row">
              <input
                type="checkbox"
                checked={selectedSkinTypes.includes(skinType)}
                  onChange={() => toggleTextFilter(skinType, setSelectedSkinTypes)}
              />
              <span>{skinType}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="product-list__filter-group">
        <h3>Giá</h3>
        <div className="product-list__price-range">
          <div className="product-list__price-labels">
            <span>{priceMin.toLocaleString()}</span>
            <span>{priceMax.toLocaleString()}</span>
          </div>
          <input
            type="range"
            min={0}
            max={computedPriceMax}
            value={priceMin}
            onChange={(e) => setPriceMin(Math.min(Number(e.target.value), priceMax))}
          />
          <input
            type="range"
            min={0}
            max={computedPriceMax}
            value={priceMax}
            onChange={(e) => setPriceMax(Math.max(Number(e.target.value), priceMin))}
          />
        </div>
      </div>

      <div className="product-list__filter-group">
        <h3>Đánh giá</h3>
        <div className="product-list__filter-items">
          {[5, 4, 3, 2, 1].map((rating) => (
            <button
              key={rating}
              type="button"
              className={`product-list__rating-row${selectedRatings.includes(rating) ? ' is-active' : ''}`}
              onClick={() => toggleRatingFilter(rating)}
            >
              <span className="product-list__stars" aria-hidden>
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={`${rating}-${index}`} size={14} fill={index < rating ? 'currentColor' : 'none'} />
                ))}
              </span>
              <span>{rating} sao</span>
            </button>
          ))}
        </div>
      </div>

      <div className="product-list__filter-group">
        <h3>Theo khuyến mãi</h3>
        <div className="product-list__filter-items">
          {promotionOptions.map((promotion) => (
            <label key={promotion} className="product-list__check-row">
              <input
                type="checkbox"
                checked={selectedPromotions.includes(promotion)}
                  onChange={() => toggleTextFilter(promotion, setSelectedPromotions)}
              />
              <span>{promotion}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="product-list__filter-group">
        <h3>Tình trạng</h3>
        <div className="product-list__filter-items">
          {availabilityOptions.map((availability) => (
            <label key={availability.id} className="product-list__check-row">
              <input
                type="checkbox"
                checked={selectedAvailability.includes(availability.id)}
                  onChange={() => toggleTextFilter(availability.id, setSelectedAvailability)}
              />
              <span>{availability.label}</span>
            </label>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <section className="product-list-page">
      <div className="container">
        <header className="product-list__header">
          <h1>Tùy chọn lọc</h1>
          <form className="product-list__search" onSubmit={onSubmitSearch}>
            <Search size={18} aria-hidden />
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Tìm theo tên sản phẩm"
              aria-label="Tìm sản phẩm"
            />
            <button type="submit">Tìm kiếm</button>
          </form>
          <button
            type="button"
            className="product-list__mobile-filter-btn"
            onClick={() => {
              setShouldLoadFilters(true);
              setIsFilterDrawerOpen(true);
            }}
          >
            <SlidersHorizontal size={16} />
            <span>Filters</span>
          </button>
        </header>

        <div className="product-list__active-filters">
          <span className="chip is-highlight">Bộ lọc đang áp dụng</span>
          <span className="chip">Giá: ${priceMin.toFixed(2)} - ${priceMax.toFixed(2)}</span>
          <span className="chip">Còn hàng</span>
        </div>

        <div className="product-list__meta-row">
          <p>
            Đang hiển thị {pageStart}-{pageEnd} / {displayedProducts.length} sản phẩm
          </p>
          <label className="product-list__sort">
            <span>Sắp xếp</span>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="default">Mặc định</option>
              <option value="popular">Phổ biến</option>
              <option value="newest">Mới nhất</option>
              <option value="price-asc">Giá: Thấp đến cao</option>
              <option value="price-desc">Giá: Cao đến thấp</option>
            </select>
          </label>
        </div>

        {isLoading && <p className="product-list__status">Đang tải sản phẩm...</p>}
        {error && <p className="product-list__status is-error">Không thể tải sản phẩm</p>}

        <div className="product-list__layout">
          <aside
            className="product-list__sidebar"
            tabIndex={0}
            onClick={() => {
              if (!shouldLoadFilters) setShouldLoadFilters(true);
            }}
            onFocus={() => {
              if (!shouldLoadFilters) setShouldLoadFilters(true);
            }}
            onMouseEnter={() => {
              if (!shouldLoadFilters) setShouldLoadFilters(true);
            }}
          >
            {shouldLoadFilters ? (
              renderFilterPanel()
            ) : (
              <div className="product-list__filter-placeholder">Nhấn vào đây để tải bộ lọc</div>
            )}
          </aside>

          <div className="product-list__grid">
            {paginatedProducts.map((p) => (
              <div key={p.id || p.productId} className="product-list__grid-item">
                <ProductCard product={p} />
              </div>
            ))}
            {!isLoading && displayedProducts.length === 0 && (
              <div className="product-list__empty">Không có sản phẩm phù hợp với từ khóa đã tìm.</div>
            )}
          </div>
        </div>

        {displayedProducts.length > 0 && totalPages > 1 && (
          <nav className="product-list__pagination" aria-label="Product pagination">
            <button
              type="button"
              className="product-list__pagination-btn"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={safeCurrentPage === 1}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                type="button"
                className={`product-list__pagination-btn${page === safeCurrentPage ? ' is-active' : ''}`}
                onClick={() => setCurrentPage(page)}
                aria-current={page === safeCurrentPage ? 'page' : undefined}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              className="product-list__pagination-btn"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={safeCurrentPage === totalPages}
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </nav>
        )}

        {isFilterDrawerOpen && (
          <div className="product-list__drawer-overlay" role="presentation" onClick={() => setIsFilterDrawerOpen(false)}>
            <aside
              className="product-list__drawer"
              role="dialog"
              aria-label="Filter options"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="product-list__drawer-head">
                <h2>Filters</h2>
                <button type="button" onClick={() => setIsFilterDrawerOpen(false)} aria-label="Close filters">
                  <X size={18} />
                </button>
              </div>
              {renderFilterPanel()}
            </aside>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductList;