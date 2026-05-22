import { axiosClient } from './axiosClient';
import type { OrderResponse } from '../types/order';
import type { ApiResponse } from '../types/api';

export const orderApi = {
  getOrdersByCustomerId: (customerId: string) => {
    return axiosClient.get<unknown, ApiResponse<OrderResponse[]>>(`/order/customer/${customerId}`);
  }
};
