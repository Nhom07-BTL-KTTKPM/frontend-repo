import { axiosClient } from '../axiosClient';
import { resolveBaseUrl, serviceBase } from '../serviceBase';
import type { PageResponse } from '../../types/api';
import type { CatalogProduct } from '../../types/catalog';

export interface UpdateProductPayload {
  name?: string;
  description?: string;
  categoryId?: string;
  brandId?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'DRAFT';
}

const catalogProductsPath = '/catalog/products';

export const productManagementApi = {
  getProducts: (params?: Record<string, unknown>) => {
    return axiosClient.get<unknown, PageResponse<CatalogProduct>>(catalogProductsPath, {
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