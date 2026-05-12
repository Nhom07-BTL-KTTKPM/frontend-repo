import type { SuggestedProduct } from '../../types/ai';

interface SuggestedProductsProps {
  products: SuggestedProduct[];
}

export const SuggestedProducts = ({ products }: SuggestedProductsProps) => {
  if (!products.length) {
    return (
      <div className="rounded-3xl border border-dashed border-[#c9a96e]/40 bg-white/80 p-6 text-sm text-[#888]">
        Suggested products will appear here when the advisor has recommendations.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/40 bg-white/90 p-6 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.25)]">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.3em] text-[#a68b5b]">Curated</p>
        <h3 className="text-xl font-semibold text-[#1a1a1a]">Suggested Products</h3>
      </div>
      <div className="space-y-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="flex items-start gap-4 rounded-2xl border border-[#f0e8dc] bg-[#faf6f0] p-4"
          >
            <div className="h-14 w-14 overflow-hidden rounded-xl bg-white/80">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-[#a68b5b]">
                  No image
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#2d2d2d]">{product.name}</p>
              {product.reason && (
                <p className="mt-1 text-xs text-[#888]">{product.reason}</p>
              )}
              {product.price !== undefined && (
                <p className="mt-2 text-xs font-semibold text-[#6b5438]">
                  ${product.price.toFixed(2)}
                </p>
              )}
            </div>
            {product.productUrl && (
              <a
                href={product.productUrl}
                className="rounded-full border border-[#c9a96e]/60 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6b5438] transition hover:border-[#c9a96e]"
              >
                View
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
