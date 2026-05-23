import { axiosClient } from './axiosClient';
import type { Product } from '../types/product';
import type { PageResponse } from '../types/api';


const catalogProductsPath = '/catalog/products';

export const productApi = {
  // GET /api/v1/catalog/products (list with pagination)
  getProducts: (params?: Record<string, unknown>) => {
    return axiosClient.get<unknown, PageResponse<Product>>(catalogProductsPath, { params });
  },

  // GET /api/v1/catalog/products/:id (by UUID)
  getProduct: (id: string) => {
    return axiosClient.get<unknown, Product>(`${catalogProductsPath}/${id}`);
  },

  // GET /api/v1/catalog/products/slug/:slug (by slug - SEO friendly)
  getProductBySlug: (slug: string) => {
    return axiosClient.get<unknown, Product>(`${catalogProductsPath}/slug/${slug}`);
  },

  // GET /api/v1/catalog/products/brand/:brandId
  getProductsByBrand: (brandId: string, params?: Record<string, unknown>) => {
    return axiosClient.get<unknown, PageResponse<Product> | Product[]>(
      `${catalogProductsPath}/brand/${brandId}`,
      { params }
    );
  },

  // GET /api/v1/catalog/products/category/root/:categoryId
  getProductsByCategoryRoot: (categoryId: string, params?: Record<string, unknown>) => {
    return axiosClient.get<unknown, PageResponse<Product> | Product[]>(
      `${catalogProductsPath}/category/root/${categoryId}`,
      { params }
    );
  },
};
