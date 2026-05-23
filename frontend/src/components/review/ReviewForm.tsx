import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewApi } from '../../api/reviewApi';
import { uploadApi } from '../../api/uploadApi';
import { useAuthStore } from '../../store/authStore';
import type { ReviewRequest, ReviewResponse } from '../../types/review';

interface ReviewFormProps {
  productId: string;
  orderItemId: string;
  customerId: string;
  existingReview?: ReviewResponse;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({ productId, orderItemId, customerId, existingReview, onSuccess, onCancel }) => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  const [rating, setRating] = useState<number>(existingReview?.rating || 5);
  const [comment, setComment] = useState<string>(existingReview?.comment || '');
  const [existingImages, setExistingImages] = useState<string[]>(existingReview?.imageUrls || []);
  const [images, setImages] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createReviewMutation = useMutation({
    mutationFn: (request: ReviewRequest) => reviewApi.createReview(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
      if (onSuccess) onSuccess();
    },
    onError: (err: any) => {
      setError(err.message || 'Có lỗi xảy ra khi gửi đánh giá');
    }
  });

  const updateReviewMutation = useMutation({
    mutationFn: (data: { id: string, request: ReviewRequest }) => reviewApi.updateReview(data.id, data.request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
      if (onSuccess) onSuccess();
    },
    onError: (err: any) => {
      setError(err.message || 'Có lỗi xảy ra khi cập nhật đánh giá');
    }
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setImages(prev => [...prev, ...filesArray]);
    }
  };

  const removeNewImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      setError('Không tìm thấy thông tin khách hàng để đánh giá');
      return;
    }

    try {
      setError(null);
      setIsUploading(true);

      // Upload images
      const uploadedUrls: string[] = [];
      for (const file of images) {
        const url = await uploadApi.uploadFile(file);
        uploadedUrls.push(url);
      }
      
      const imageUrls = [...existingImages, ...uploadedUrls];

      // Create review - productId is resolved by backend from orderItem's variant
      const request: ReviewRequest = {
        customerId,
        orderItemId,
        rating,
        comment,
        imageUrls
      };

      if (existingReview) {
        await updateReviewMutation.mutateAsync({ id: existingReview.id, request });
      } else {
        await createReviewMutation.mutateAsync(request);
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi khi upload ảnh');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ background: '#fff', padding: 24, borderRadius: 8, boxShadow: 'var(--shadow-sm)' }}>
      <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 16 }}>{existingReview ? 'Chỉnh sửa đánh giá' : 'Viết đánh giá'}</h3>
      
      {error && <div style={{ color: 'var(--color-error)', marginBottom: 16 }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Chất lượng sản phẩm</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                style={{ 
                  fontSize: 24, 
                  color: star <= rating ? 'var(--color-gold)' : 'var(--color-gray-300)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Đánh giá của bạn</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
            style={{ 
              width: '100%', 
              padding: 12, 
              border: '1px solid var(--color-gray-300)', 
              borderRadius: 4,
              fontFamily: 'inherit'
            }}
            required
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Thêm hình ảnh (Tuỳ chọn)</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageChange}
            style={{ marginBottom: 12 }}
          />
          {existingImages.length > 0 || images.length > 0 ? (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {existingImages.map((url, index) => (
                <div key={`existing-${index}`} style={{ position: 'relative', width: 80, height: 80 }}>
                  <img 
                    src={url} 
                    alt="existing preview" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }} 
                  />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(index)}
                    style={{
                      position: 'absolute', top: -8, right: -8,
                      background: 'var(--color-error)', color: '#fff',
                      width: 20, height: 20, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, cursor: 'pointer', border: 'none'
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
              {images.map((file, index) => (
                <div key={`new-${index}`} style={{ position: 'relative', width: 80, height: 80 }}>
                  <img 
                    src={URL.createObjectURL(file)} 
                    alt="new preview" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }} 
                  />
                  <button
                    type="button"
                    onClick={() => removeNewImage(index)}
                    style={{
                      position: 'absolute', top: -8, right: -8,
                      background: 'var(--color-error)', color: '#fff',
                      width: 20, height: 20, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, cursor: 'pointer', border: 'none'
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          {onCancel && (
            <button 
              type="button" 
              onClick={onCancel}
              className="btn btn--outline"
              disabled={isUploading || createReviewMutation.isPending}
            >
              Hủy
            </button>
          )}
          <button 
            type="submit" 
            className="btn btn--primary"
            disabled={isUploading || createReviewMutation.isPending || updateReviewMutation.isPending}
          >
            {isUploading ? 'Đang tải ảnh lên...' : (createReviewMutation.isPending || updateReviewMutation.isPending) ? 'Đang gửi...' : (existingReview ? 'Cập nhật' : 'Gửi Đánh Giá')}
          </button>
        </div>
      </form>
    </div>
  );
};
