import { axiosClient } from './axiosClient';
import type { CategoryResponse, CategorySummaryResponse } from '../types/catalog';

export const categoryApi = {
  // Get all active categories (full payload)
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

  // Get lightweight summaries of active categories (id, name, slug, imageUrl)
  getCategorySummaries: async (): Promise<CategorySummaryResponse[]> => {
    try {
      const response = await axiosClient.get<CategorySummaryResponse[]>('/catalog/categories/summary');
      const payload = response as unknown as CategorySummaryResponse[];
      return Array.isArray(payload) ? payload : [];
    } catch (error) {
      console.error('Error fetching category summaries:', error);
      throw error;
    }
  },

  // Get lightweight summaries of root active categories (parentId = null)
  getRootCategorySummaries: async (): Promise<CategorySummaryResponse[]> => {
    try {
      const response = await axiosClient.get<CategorySummaryResponse[]>('/catalog/categories/summary/root');
      const payload = response as unknown as CategorySummaryResponse[];
      return Array.isArray(payload) ? payload : [];
    } catch (error) {
      console.error('Error fetching root category summaries:', error);
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
