import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reviewApi } from '../../api/reviewApi';

interface ReviewSectionProps {
  productId: string;
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({ productId }) => {
  const [page, setPage] = useState(0);
  const size = 5;

  const { data: pageData, isLoading, error } = useQuery({
    queryKey: ['reviews', productId, page],
    queryFn: () => reviewApi.getReviewsByProductId(productId, page, size),
    enabled: !!productId,
  });

  if (isLoading) return <div style={{ padding: '2rem 0' }}>Đang tải đánh giá...</div>;
  if (error) return <div style={{ padding: '2rem 0', color: 'var(--color-error)' }}>Lỗi tải đánh giá</div>;

  const reviews = pageData?.content || [];
  const totalElements = pageData?.totalElements || 0;
  const totalPages = pageData?.totalPages || 0;

  // Calculate average rating from the current page (or ideally from backend, but since we don't have it, we just show simple stats)
  // Since we only have paged data, we can't accurately calculate total average without a specific API. 
  // We'll just show the total count for now.

  return (
    <div style={{ marginTop: '4rem', borderTop: '1px solid var(--color-gray-300)', paddingTop: '2rem' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '1.5rem' }}>Đánh Giá Sản Phẩm ({totalElements})</h2>
      
      {reviews.length === 0 ? (
        <p style={{ color: 'var(--color-gray-500)' }}>Chưa có đánh giá nào cho sản phẩm này.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {reviews.map((review) => (
            <div key={review.id} style={{ background: 'white', padding: '1.5rem', borderRadius: 8, boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div style={{ fontWeight: 600 }}>{review.customerName || 'Người dùng'}</div>
                <div style={{ color: 'var(--color-gray-500)', fontSize: '0.85rem' }}>
                  {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                </div>
              </div>
              
              <div style={{ color: 'var(--color-gold)', marginBottom: '1rem', letterSpacing: 2 }}>
                {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
              </div>
              
              <p style={{ color: 'var(--color-gray-700)', marginBottom: review.imageUrls?.length > 0 ? '1rem' : 0 }}>
                {review.comment}
              </p>

              {review.imageUrls && review.imageUrls.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {review.imageUrls.map((url, idx) => (
                    <img 
                      key={idx} 
                      src={url} 
                      alt="review attachment" 
                      style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4, border: '1px solid #eee' }} 
                    />
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Phân trang */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
              <button
                className="btn btn--outline btn--sm"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                Trước
              </button>
              <span style={{ display: 'flex', alignItems: 'center', color: 'var(--color-gray-700)' }}>
                Trang {page + 1} / {totalPages}
              </span>
              <button
                className="btn btn--outline btn--sm"
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                Sau
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
