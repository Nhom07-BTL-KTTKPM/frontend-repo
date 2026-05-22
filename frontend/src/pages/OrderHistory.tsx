import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { orderApi } from '../api/orderApi';
import { useAuthStore } from '../store/authStore';
import { ReviewForm } from '../components/review/ReviewForm';

export const OrderHistory: React.FC = () => {
  const { user } = useAuthStore();
  const [reviewingItem, setReviewingItem] = useState<{ productId: string, orderItemId: string } | null>(null);

  const { data: ordersData, isLoading, error } = useQuery({
    queryKey: ['orders', user?.accountId],
    queryFn: () => user?.accountId ? orderApi.getOrdersByCustomerId(user.accountId).then(res => res.data) : Promise.resolve(null),
    enabled: !!user?.accountId,
  });

  if (!user) {
    return <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>Vui lòng đăng nhập để xem đơn hàng.</div>;
  }

  if (isLoading) return <div className="container" style={{ padding: '4rem 0' }}>Đang tải lịch sử đơn hàng...</div>;
  if (error) return <div className="container" style={{ padding: '4rem 0', color: 'red' }}>Không thể tải lịch sử đơn hàng</div>;

  const orders = ordersData || [];

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', marginBottom: '2rem' }}>Lịch sử đơn hàng</h1>
      
      {orders.length === 0 ? (
        <p>Bạn chưa có đơn hàng nào.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {orders.map(order => (
            <div key={order.id} style={{ background: 'white', padding: '1.5rem', borderRadius: 8, boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-gray-300)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>Mã Đơn: #{order.id.slice(0, 8).toUpperCase()}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-gray-500)' }}>
                    Ngày đặt: {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600, color: order.status === 'DELIVERED' ? 'var(--color-success)' : 'var(--color-gold)' }}>
                    {order.status}
                  </div>
                  <div style={{ fontWeight: 700 }}>Tổng tiền: {order.totalAmount.toLocaleString()} đ</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {order.items.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div>Sản phẩm ID: {item.productVariantId}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-gray-500)' }}>Số lượng: {item.quantity} x {item.price.toLocaleString()} đ</div>
                    </div>
                    {order.status === 'DELIVERED' && (
                      <button 
                        className="btn btn--primary btn--sm"
                        onClick={() => setReviewingItem({ productId: item.productVariantId /* Tạm dùng variantId thay vì productId thật vì API order đang thiết kế như vậy */, orderItemId: item.id })}
                      >
                        Đánh giá
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Đánh Giá */}
      {reviewingItem && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ width: '100%', maxWidth: 600 }}>
            <ReviewForm 
              productId={reviewingItem.productId} 
              orderItemId={reviewingItem.orderItemId} 
              onCancel={() => setReviewingItem(null)}
              onSuccess={() => {
                alert('Cảm ơn bạn đã đánh giá!');
                setReviewingItem(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
