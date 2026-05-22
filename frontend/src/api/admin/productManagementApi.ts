import { axiosClient } from '../axiosClient';
import { resolveBaseUrl, serviceBase } from '../serviceBase';
import type { PageResponse } from '../../types/api';
import type { CatalogProduct, CatalogProductCreateRequest, CatalogProductDetail } from '../../types/catalog';

export interface UpdateProductPayload {
  name?: string;
  description?: string;
  categoryId?: string;
  brandId?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'DRAFT';
}

const catalogProductsPath = '/catalog/products';

export const productManagementApi = {
  createProduct: (payload: CatalogProductCreateRequest) => {
    return axiosClient.post<unknown, CatalogProductDetail>(catalogProductsPath, payload, {
      baseURL: resolveBaseUrl(serviceBase.catalog),
    });
  },

  getProducts: (params?: Record<string, unknown>) => {
    return axiosClient.get<unknown, PageResponse<CatalogProduct>>(catalogProductsPath, {
      baseURL: resolveBaseUrl(serviceBase.catalog),
      params,
    });
  },

  getBestSellingProducts: (params?: Record<string, unknown>) => {
    return axiosClient.get<unknown, PageResponse<CatalogProduct>>(`${catalogProductsPath}/best-selling`, {
      baseURL: resolveBaseUrl(serviceBase.catalog),
      params,
    });
  },

  getTopRatedProducts: (params?: Record<string, unknown>) => {
    return axiosClient.get<unknown, PageResponse<CatalogProduct>>(`${catalogProductsPath}/top-rated`, {
      baseURL: resolveBaseUrl(serviceBase.catalog),
      params,
    });
  },

  updateProduct: (productId: string, payload: UpdateProductPayload) => {
    return axiosClient.put<unknown, CatalogProduct>(`${catalogProductsPath}/${productId}`, payload, {
      baseURL: resolveBaseUrl(serviceBase.catalog),
    });
  },

  deleteProduct: (productId: string) => {
    return axiosClient.delete<unknown, void>(`${catalogProductsPath}/${productId}`, {
      baseURL: resolveBaseUrl(serviceBase.catalog),
    });
  },
};