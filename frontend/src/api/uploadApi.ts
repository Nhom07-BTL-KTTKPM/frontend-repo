import { axiosClient } from './axiosClient';
import type { ApiResponse } from '../types/api';

export const uploadApi = {
  uploadFile: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Upload service trả về URL dạng string trong ApiResponse.data
    const response = await axiosClient.post<unknown, ApiResponse<string>>('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};
