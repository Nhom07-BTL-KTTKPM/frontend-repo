import { axiosClient } from './axiosClient';
import axios from 'axios';
import type { ReviewResponse, ReviewRequest, PageResponse } from '../types/review';

// Review Service không bọc trong ApiResponse mà trả thẳng (nếu không dùng chung ApiResponse object của Shared Library)
// Wait, Controller của review trả thẳng ResponseEntity.ok(Page<ReviewResponse>).
// Nên axios interceptor có the parse data thẳng luôn.
// Let's assume it returns directly (as axiosClient returns response.data).

const reviewReadClient = axios.create({
  baseURL: import.meta.env.VITE_REVIEW_API_URL || 'http://13.212.210.31:8088/api/v1',
  headers: {
    Accept: 'application/json',
  },
});

export const reviewApi = {
  getReviewsByProductId: (productId: string, page = 0, size = 5) => {
    return reviewReadClient
      .get<PageResponse<ReviewResponse>>(`/review/product/${productId}`, {
      params: { page, size }
      })
      .then((response) => response.data);
  },

  createReview: (request: ReviewRequest) => {
    return axiosClient.post<unknown, ReviewResponse>('/review', request);
  },

  getReviewsByCustomerId: (customerId: string) => {
    return reviewReadClient
      .get<ReviewResponse[]>(`/review/customer/${customerId}`)
      .then((response) => response.data);
  },

  updateReview: (reviewId: string, request: ReviewRequest) => {
    return axiosClient.put<unknown, ReviewResponse>(`/review/${reviewId}`, request);
  }
};
