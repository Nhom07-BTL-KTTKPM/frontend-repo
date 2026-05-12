import { axiosClient } from './axiosClient';
import type { BrandResponse, BrandSummaryResponse } from '../types/catalog';

export const brandApi = {
  // Get all active brands (full payload)
  getActiveBrands: async (): Promise<BrandResponse[]> => {
    try {
      const response = await axiosClient.get<BrandResponse[]>('/catalog/brands/active');
      const payload = response as unknown as BrandResponse[];
      return Array.isArray(payload) ? payload : [];
    } catch (error) {
      console.error('Error fetching active brands:', error);
      throw error;
    }
  },

  // Get lightweight summaries of active brands (id, name, slug, logoUrl)
  getBrandSummaries: async (): Promise<BrandSummaryResponse[]> => {
    try {
      const response = await axiosClient.get<BrandSummaryResponse[]>('/catalog/brands/summary');
      const payload = response as unknown as BrandSummaryResponse[];
      return Array.isArray(payload) ? payload : [];
    } catch (error) {
      console.error('Error fetching brand summaries:', error);
      throw error;
    }
  },

  // Get brand by slug
  getBrandBySlug: async (slug: string): Promise<BrandResponse> => {
    try {
      const response = await axiosClient.get<BrandResponse>(`/catalog/brands/slug/${slug}`);
      return response as unknown as BrandResponse;
    } catch (error) {
      console.error('Error fetching brand by slug:', error);
      throw error;
    }
  },

  // Get all brands with pagination
  getAllBrands: async (page = 0, size = 20): Promise<{ content: BrandResponse[] }> => {
    try {
      const response = await axiosClient.get(`/catalog/brands`, {
        params: { page, size },
      });
      return response as unknown as { content: BrandResponse[] };
    } catch (error) {
      console.error('Error fetching all brands:', error);
      throw error;
    }
  },
};
