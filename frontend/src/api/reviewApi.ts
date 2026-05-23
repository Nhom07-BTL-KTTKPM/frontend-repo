import { axiosClient } from './axiosClient';
import type { ReviewResponse, ReviewRequest, PageResponse } from '../types/review';

// Review Service không bọc trong ApiResponse mà trả thẳng (nếu không dùng chung ApiResponse object của Shared Library)
// Wait, Controller của review trả thẳng ResponseEntity.ok(Page<ReviewResponse>).
// Nên axios interceptor có the parse data thẳng luôn.
// Let's assume it returns directly (as axiosClient returns response.data).

export const reviewApi = {
  getReviewsByProductId: (productId: string, page = 0, size = 5) => {
    return axiosClient.get<unknown, PageResponse<ReviewResponse>>(`/review/product/${productId}`, {
      params: { page, size }
    });
  },

  createReview: (request: ReviewRequest) => {
    return axiosClient.post<unknown, ReviewResponse>('/review', request);
  }
};
