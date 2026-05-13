import { axiosClient } from '../axiosClient';
import type { PageResponse } from '../../types/api';
import type { Product } from '../../types/product';

export interface UpdateProductPayload {
  name?: string;
  description?: string;
  categoryId?: string;
  brandId?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'DRAFT';
}

export const productManagementApi = {
  getProducts: (params?: Record<string, unknown>) => {
    return axiosClient.get<unknown, PageResponse<Product>>('/admin/products', { params });
  },

  updateProduct: (productId: string, payload: UpdateProductPayload) => {
    return axiosClient.put<unknown, Product>(`/admin/products/${productId}`, payload);
  },

  deleteProduct: (productId: string) => {
    return axiosClient.delete<unknown, void>(`/admin/products/${productId}`);
  },
};