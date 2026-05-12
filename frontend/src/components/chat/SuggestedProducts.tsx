import type { SuggestedProduct } from '../../types/ai';

interface SuggestedProductsProps {
  products: SuggestedProduct[];
}

export const SuggestedProducts = ({ products }: SuggestedProductsProps) => {
  if (!products.length) {
    return (
      <div className="rounded-3xl border border-dashed border-[#c9a96e]/40 bg-white/80 p-6 text-sm text-[#888]">
        Sản phẩm gợi ý sẽ hiển thị khi AI đưa ra đề xuất.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full rounded-3xl border border-white/40 bg-white/90 p-5 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.25)]">
      <div className="mb-3">
        <p className="text-[11px] uppercase tracking-[0.25em] text-[#a68b5b]">Tuyển chọn</p>
        <h3 className="text-lg font-semibold text-[#1a1a1a]">Sản phẩm gợi ý</h3>
      </div>
      <div className="flex-1 min-h-0 space-y-3 overflow-y-auto pr-2">
        {products.map((product, index) => (
          <div
            key={product.id || product.productId || `prod-${index}`}
            className="flex flex-col gap-3 rounded-2xl border border-[#f0e8dc] bg-[#faf6f0] p-3"
          >
            <div className="flex items-start gap-3">
              <div className="h-14 w-14 overflow-hidden rounded-xl bg-white/80">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-[#a68b5b]">
                    Chưa có ảnh
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#2d2d2d]">{product.name}</p>
                {product.reason && (
                  <p className="mt-1 text-xs text-[#888]">{product.reason}</p>
                )}
                {product.price !== undefined && (
                  <p className="mt-1 text-xs font-semibold text-[#6b5438]">
                    ${product.price.toFixed(2)}
                  </p>
                )}
              </div>
              {product.productUrl && (
                <a
                  href={product.productUrl}
                  className="rounded-full border border-[#c9a96e]/60 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6b5438] transition hover:border-[#c9a96e]"
                >
                  Xem
                </a>
              )}
            </div>

            {product.score !== undefined && (
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e8d5a8]/30">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#c9a96e] to-[#a68b5b]"
                    style={{ width: `${Math.max(0, Math.min(100, product.score * 100))}%` }}
                  />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[#888]">
                  {Math.round(product.score * 100)}% {product.score >= 0.7 ? 'phù hợp' : 'cân nhắc'}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
