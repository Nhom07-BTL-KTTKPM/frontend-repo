import { axiosClient } from './axiosClient';

import { resolveBaseUrl, serviceBase } from './serviceBase';
import type { ApiResponse, CustomerProfileInfo, CustomerUpdateRequest, Address, AddressCreateRequest } from '../types/api';

export const userApi = {
  getCustomerByAccountId: (accountId: string) => {
    return axiosClient.get<unknown, ApiResponse<CustomerProfileInfo>>(`/customers/account/${accountId}`, {
      baseURL: resolveBaseUrl(serviceBase.user),
    });
  },

  updateCustomer: (customerId: string, data: CustomerUpdateRequest) => {
    return axiosClient.put<unknown, ApiResponse<void>>(`/user/customers/${customerId}`, data);
  },

  // Address endpoints
  getAddressesByCustomerId: (customerId: string) => {
    return axiosClient.get<unknown, ApiResponse<Address[]>>(`/user/addresses/customer/${customerId}`);
  },

  addAddress: (customerId: string, address: AddressCreateRequest) => {
    return axiosClient.post<unknown, ApiResponse<void>>(`/user/addresses/${customerId}`, address);
  },

  updateAddress: (addressId: string, address: AddressCreateRequest) => {
    return axiosClient.put<unknown, ApiResponse<void>>(`/user/addresses/update/${addressId}`, address);
  },

  setDefaultAddress: (addressId: string) => {
    return axiosClient.put<unknown, ApiResponse<void>>(`/user/addresses/default/${addressId}`);
  },

  deleteAddress: (addressId: string) => {
    return axiosClient.delete<unknown, ApiResponse<void>>(`/user/addresses/${addressId}`);
  },
};
