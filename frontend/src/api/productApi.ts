import { axiosClient } from './axiosClient';
import type { PageResponse } from '../types/api';
import type { Product } from '../types/product';

const catalogProductsPath = '/catalog/products';

export const productApi = {
  // GET /api/v1/catalog/products
  getProducts: (params?: Record<string, unknown>) => {
    return axiosClient.get<unknown, PageResponse<Product>>(catalogProductsPath, { params });
  },

  // GET /api/v1/catalog/products/:id
  getProduct: (id: string) => {
    return axiosClient.get<unknown, Product>(`${catalogProductsPath}/${id}`);
  },
};