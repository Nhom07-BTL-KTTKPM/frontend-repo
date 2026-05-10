import { axiosClient } from './axiosClient';
import type { ApiResponse } from '../types/api';
import type { Product } from '../types/product';

export const productApi = {
  // GET /api/v1/products
  getProducts: (params?: Record<string, unknown>) => {
    return axiosClient.get<unknown, ApiResponse<Product[]>>('/products', { params });
  },

  // GET /api/v1/products/:id
  getProduct: (id: string) => {
    return axiosClient.get<unknown, ApiResponse<Product>>(`/products/${id}`);
  },
};
