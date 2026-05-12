import { axiosClient } from './axiosClient';
import { resolveBaseUrl, serviceBase } from './serviceBase';
import type { CreateOrderRequest, OrderResponse } from '../types/order';

export const orderApi = {
  createOrder: (payload: CreateOrderRequest) => {
    return axiosClient.post<unknown, OrderResponse>('/orders', payload, {
      baseURL: resolveBaseUrl(serviceBase.order),
    });
  },

  getOrderById: (orderId: string) => {
    return axiosClient.get<unknown, OrderResponse>(`/orders/${orderId}`, {
      baseURL: resolveBaseUrl(serviceBase.order),
    });
  },

  getOrdersByCustomerId: (customerId: string) => {
    return axiosClient.get<unknown, OrderResponse[]>(`/orders/customer/${customerId}`, {
      baseURL: resolveBaseUrl(serviceBase.order),
    });
  },
};
