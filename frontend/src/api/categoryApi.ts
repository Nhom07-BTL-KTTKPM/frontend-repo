import { axiosClient } from './axiosClient';
import type { CategoryResponse } from '../types/catalog';

export const categoryApi = {
  // Get all active categories
  getActiveCategories: async (): Promise<CategoryResponse[]> => {
    try {
      const response = await axiosClient.get<CategoryResponse[]>('/catalog/categories/active');
      const payload = response as unknown as CategoryResponse[];
      return Array.isArray(payload) ? payload : [];
    } catch (error) {
      console.error('Error fetching active categories:', error);
      throw error;
    }
  },

  // Get category by slug
  getCategoryBySlug: async (slug: string): Promise<CategoryResponse> => {
    try {
      const response = await axiosClient.get<CategoryResponse>(`/catalog/categories/slug/${slug}`);
      return response as unknown as CategoryResponse;
    } catch (error) {
      console.error('Error fetching category by slug:', error);
      throw error;
    }
  },

  // Get root categories
  getRootCategories: async (): Promise<CategoryResponse[]> => {
    try {
      const response = await axiosClient.get<CategoryResponse[]>('/catalog/categories/root');
      const payload = response as unknown as CategoryResponse[];
      return Array.isArray(payload) ? payload : [];
    } catch (error) {
      console.error('Error fetching root categories:', error);
      throw error;
    }
  },

  // Get child categories
  getChildCategories: async (parentId: string): Promise<CategoryResponse[]> => {
    try {
      const response = await axiosClient.get<CategoryResponse[]>(`/catalog/categories/children/${parentId}`);
      const payload = response as unknown as CategoryResponse[];
      return Array.isArray(payload) ? payload : [];
    } catch (error) {
      console.error('Error fetching child categories:', error);
      throw error;
    }
  },
};
