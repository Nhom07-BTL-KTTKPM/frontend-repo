import React, { useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, Star, X } from 'lucide-react';
import { productApi } from '../api/productApi';
import ProductCard from '../components/ProductCard';
import type { Product } from '../types/product';
import type { PageResponse } from '../types/api';

type ProductListItem = Product & {
  price?: number;
  averageRating?: number;
  totalReviews?: number;
  totalSold?: number;
  suitableSkinTypes?: string[];
};

export const ProductList: React.FC = () => {
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

  React.useEffect(() => {
    // Nếu màn hình lớn hơn kích thước mobile (ví dụ 1024px), tự động bật load bộ lọc
    if (window.innerWidth >= 1024) {
      setShouldLoadFilters(true);
    }
  }, []);

  const isSearching = searchKeyword.trim().length > 0;

  const { data: pageData, isLoading, error } = useQuery<PageResponse<ProductListItem>>({
    queryKey: ['products', searchKeyword, currentPage, pageSize],
    queryFn: async (): Promise<PageResponse<ProductListItem>> => {
      const params = { page: currentPage - 1, size: pageSize };
      if (isSearching) {
        return productApi.searchProducts(searchKeyword.trim(), params) as unknown as PageResponse<ProductListItem>;
      }
      return productApi.getProducts(params) as unknown as PageResponse<ProductListItem>;
    },
    placeholderData: keepPreviousData,
  });

  const products = (pageData?.content ?? []) as ProductListItem[];

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

  const totalPages = Math.max(1, pageData?.totalPages ?? 1);
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedProducts = displayedProducts;
  const pageStart = displayedProducts.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const pageEnd = Math.min((safeCurrentPage - 1) * pageSize + displayedProducts.length, pageData?.totalElements ?? displayedProducts.length);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchKeyword]);

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
    setSearchKeyword(searchInput.trim());
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearchKeyword('');
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setSelectedSkinTypes([]);
    setSelectedRatings([]);
    setSelectedAvailability([]);
    setSelectedPromotions([]);
    setPriceMin(0);
    setPriceMax(computedPriceMax);
    setCurrentPage(1);
  };

  const removeCategory = (value: string) => setSelectedCategories((prev) => prev.filter((v) => v !== value));
  const removeBrand = (value: string) => setSelectedBrands((prev) => prev.filter((v) => v !== value));
  const removeSkinType = (value: string) => setSelectedSkinTypes((prev) => prev.filter((v) => v !== value));
  const removeRating = (value: number) => setSelectedRatings((prev) => prev.filter((v) => v !== value));
  const removeAvailability = (value: string) => setSelectedAvailability((prev) => prev.filter((v) => v !== value));
  const removePromotion = (value: string) => setSelectedPromotions((prev) => prev.filter((v) => v !== value));

  const hasActiveFilters = React.useMemo(() => {
    return (
      isSearching ||
      priceMin !== 0 ||
      priceMax !== computedPriceMax ||
      selectedAvailability.length > 0 ||
      selectedPromotions.length > 0 ||
      selectedCategories.length > 0 ||
      selectedBrands.length > 0 ||
      selectedSkinTypes.length > 0 ||
      selectedRatings.length > 0
    );
  }, [
    isSearching,
    priceMin,
    priceMax,
    computedPriceMax,
    selectedAvailability,
    selectedPromotions,
    selectedCategories,
    selectedBrands,
    selectedSkinTypes,
    selectedRatings,
  ]);


  const showFilterSkeleton = shouldLoadFilters && (isLoadingCategories || isLoadingBrands);

  const renderFilterSkeleton = () => (
    <div className="product-list__filter-skeleton">
      <div className="product-list__skeleton-block">
        <div className="product-list__skeleton-title" />
        <div className="product-list__skeleton-line" />
        <div className="product-list__skeleton-line" />
        <div className="product-list__skeleton-line short" />
      </div>
      <div className="product-list__skeleton-block">
        <div className="product-list__skeleton-title" />
        <div className="product-list__skeleton-line" />
        <div className="product-list__skeleton-line short" />
      </div>
      <div className="product-list__skeleton-block">
        <div className="product-list__skeleton-title" />
        <div className="product-list__skeleton-line" />
      </div>
    </div>
  );

  const formatCurrency = (value: number) => `${value.toLocaleString('vi-VN')}đ`;

  const renderFilterPanel = () => (
  <div className="flex flex-col gap-6 p-4 bg-white rounded-xl">
    {/* 1. Theo danh mục */}
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Theo danh mục</h3>
      <div className="flex flex-col gap-2.5 max-h-48 overflow-y-auto pr-1">
        {shouldLoadFilters && isLoadingCategories ? (
          <p className="text-xs text-gray-500 animate-pulse">Đang tải danh mục...</p>
        ) : categoryOptions.length > 0 ? (
          categoryOptions.map((categoryName) => (
            <label key={categoryName} className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer select-none hover:text-gray-900 transition-colors">
              <input
                type="checkbox"
                checked={selectedCategories.includes(categoryName)}
                onChange={() => toggleTextFilter(categoryName, setSelectedCategories)}
                className="w-4 h-4 rounded border-gray-300 text-[#D4AF37] focus:ring-[#D4AF37]/50 cursor-pointer"
              />
              <span>{categoryName}</span>
            </label>
          ))
        ) : (
          <p className="text-xs text-gray-400 italic">Chưa có danh mục để hiển thị</p>
        )}
      </div>
    </div>

    <hr className="border-gray-100" />

    {/* 2. Theo thương hiệu */}
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Theo thương hiệu</h3>
      <div className="flex flex-col gap-2.5 max-h-48 overflow-y-auto pr-1">
        {shouldLoadFilters && isLoadingBrands ? (
          <p className="text-xs text-gray-500 animate-pulse">Đang tải thương hiệu...</p>
        ) : brandOptions.length > 0 ? (
          brandOptions.map((brandName) => (
            <label key={brandName} className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer select-none hover:text-gray-900 transition-colors">
              <input
                type="checkbox"
                checked={selectedBrands.includes(brandName)}
                onChange={() => toggleTextFilter(brandName, setSelectedBrands)}
                className="w-4 h-4 rounded border-gray-300 text-[#D4AF37] focus:ring-[#D4AF37]/50 cursor-pointer"
              />
              <span>{brandName}</span>
            </label>
          ))
        ) : (
          <p className="text-xs text-gray-400 italic">Chưa có thương hiệu để hiển thị</p>
        )}
      </div>
    </div>

    <hr className="border-gray-100" />

    {/* 3. Theo loại da */}
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Theo loại da</h3>
      <div className="flex flex-col gap-2.5">
        {skinTypeOptions.map((skinType) => (
          <label key={skinType} className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer select-none hover:text-gray-900 transition-colors">
            <input
              type="checkbox"
              checked={selectedSkinTypes.includes(skinType)}
              onChange={() => toggleTextFilter(skinType, setSelectedSkinTypes)}
              className="w-4 h-4 rounded border-gray-300 text-[#D4AF37] focus:ring-[#D4AF37]/50 cursor-pointer"
            />
            <span>{skinType}</span>
          </label>
        ))}
      </div>
    </div>

    <hr className="border-gray-100" />

    {/* 4. Khoảng giá (Dual Range Slider) */}
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Giá</h3>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between text-xs font-semibold text-gray-700 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100">
          <span>{formatCurrency(priceMin)}</span>
          <span className="text-gray-300">|</span>
          <span>{formatCurrency(priceMax)}</span>
        </div>
        
        {/* Khung chứa thanh trượt kép sử dụng Pointer Events */}
        <div className="relative w-full h-2 bg-gray-100 rounded-full">
          {/* ĐƯỜNG NỐI MÀU VÀNG GIỮA MIN VÀ MAX */}
          <div 
            className="absolute h-2 bg-[#D4AF37] rounded-full z-10"
            style={{
              left: `${(priceMin / (computedPriceMax || 1)) * 100}%`,
              width: `${((priceMax - priceMin) / (computedPriceMax || 1)) * 100}%`
            }}
          />
          {/* Thanh trượt MIN */}
          <input
            type="range"
            min={0}
            max={computedPriceMax}
            value={priceMin}
            onChange={(e) => setPriceMin(Math.min(Number(e.target.value), priceMax))}
            className="absolute w-full h-2 bg-transparent appearance-none left-0 top-0 z-20
                      pointer-events-none accent-[#D4AF37]
                      [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-30
                      [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:relative [&::-moz-range-thumb]:z-30"
          />
          
          {/* Thanh trượt MAX */}
          <input
            type="range"
            min={0}
            max={computedPriceMax}
            value={priceMax}
            onChange={(e) => setPriceMax(Math.max(Number(e.target.value), priceMin))}
            className="absolute w-full h-2 bg-transparent appearance-none left-0 top-0 z-20
                      pointer-events-none accent-[#D4AF37]
                      [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-30
                      [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:relative [&::-moz-range-thumb]:z-30"
          />
        </div>
      </div>
    </div>

    <hr className="border-gray-100" />

    {/* 5. Đánh giá */}
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Đánh giá</h3>
      <div className="flex flex-col gap-1.5">
        {[5, 4, 3, 2, 1].map((rating) => {
          const isActive = selectedRatings.includes(rating);
          return (
            <button
              key={rating}
              type="button"
              onClick={() => toggleRatingFilter(rating)}
              className={`flex items-center gap-2.5 px-2.5 py-2 w-full rounded-lg text-sm font-medium transition-all text-left cursor-pointer
                ${isActive 
                  ? 'bg-[#D4AF37]/10 text-[#D4AF37] border border-solid border-[#D4AF37]/30' 
                  : 'bg-transparent text-gray-600 hover:bg-gray-50 border border-solid border-transparent'
                }`}
            >
              <span className={`flex items-center gap-0.5 ${isActive ? 'text-[#D4AF37]' : 'text-amber-400'}`} aria-hidden>
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star 
                    key={`${rating}-${index}`} 
                    size={14} 
                    fill={index < rating ? 'currentColor' : 'none'} 
                    strokeWidth={2}
                  />
                ))}
              </span>
              <span>{rating} sao</span>
            </button>
          );
        })}
      </div>
    </div>

    <hr className="border-gray-100" />

    {/* 6. Theo khuyến mãi */}
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Theo khuyến mãi</h3>
      <div className="flex flex-col gap-2.5">
        {promotionOptions.map((promotion) => (
          <label key={promotion} className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer select-none hover:text-gray-900 transition-colors">
            <input
              type="checkbox"
              checked={selectedPromotions.includes(promotion)}
              onChange={() => toggleTextFilter(promotion, setSelectedPromotions)}
              className="w-4 h-4 rounded border-gray-300 text-[#D4AF37] focus:ring-[#D4AF37]/50 cursor-pointer"
            />
            <span>{promotion}</span>
          </label>
        ))}
      </div>
    </div>
  </div>
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
            {searchKeyword && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Xóa tìm kiếm"
                title="Xóa tìm kiếm"
              >
                <X size={16} color="#ffffff"/>
              </button>
            )}
            
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
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2B6377] animate-pulse" />
            Bộ lọc đang chọn
          </div>
          {isSearching && (
            <span className="chip">
              Từ khóa: {searchKeyword}
              <button type="button" className="chip__close" onClick={clearSearch} aria-label="Xóa từ khóa">
                <X size={12} />
              </button>
            </span>
          )}

          {priceMin !== 0 || priceMax !== computedPriceMax ? (
            <span className="chip">
              Giá: {priceMin.toLocaleString('vi-VN')}đ - {priceMax.toLocaleString('vi-VN')}đ
              <button
                type="button"
                className="chip__close"
                onClick={() => {
                  setPriceMin(0);
                  setPriceMax(computedPriceMax);
                }}
                aria-label="Xóa bộ lọc giá"
              >
                <X size={12} />
              </button>
            </span>
          ) : null}


          {selectedPromotions.map((p) => (
            <span key={`promo-${p}`} className="chip">
              {p}
              <button type="button" className="chip__close" onClick={() => removePromotion(p)} aria-label={`Xóa ${p}`}>
                <X size={12} />
              </button>
            </span>
          ))}

          {selectedCategories.map((c) => (
            <span key={`cat-${c}`} className="chip">
              {c}
              <button type="button" className="chip__close" onClick={() => removeCategory(c)} aria-label={`Xóa ${c}`}>
                <X size={12} />
              </button>
            </span>
          ))}

          {selectedBrands.map((b) => (
            <span key={`brand-${b}`} className="chip">
              {b}
              <button type="button" className="chip__close" onClick={() => removeBrand(b)} aria-label={`Xóa ${b}`}>
                <X size={12} />
              </button>
            </span>
          ))}

          {selectedSkinTypes.map((s) => (
            <span key={`skin-${s}`} className="chip">
              {s}
              <button type="button" className="chip__close" onClick={() => removeSkinType(s)} aria-label={`Xóa ${s}`}>
                <X size={12} />
              </button>
            </span>
          ))}

          {selectedRatings.map((r) => (
            <span key={`rating-${r}`} className="chip">
              {r} sao
              <button type="button" className="chip__close" onClick={() => removeRating(r)} aria-label={`Xóa ${r} sao`}>
                <X size={12} />
              </button>
            </span>
          ))}

          {hasActiveFilters && (
            <div className="product-list__active-filters-actions">
              <button
                type="button"
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-gray-500 bg-gray-100 hover:bg-red-50 hover:text-red-600 rounded-full border border-gray-200 hover:border-red-200 transition-all shadow-sm"
              >
                <span>Xóa tất cả</span>
                <X size={12} className="opacity-70" />
              </button>
            </div>
          )}
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
          <aside className="product-list__sidebar">
            {showFilterSkeleton ? (
              renderFilterSkeleton()
            ) : shouldLoadFilters ? (
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

        {pageData?.totalElements && totalPages > 1 && (
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