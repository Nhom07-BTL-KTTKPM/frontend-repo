import { axiosClient } from './axiosClient';
import { resolveBaseUrl, serviceBase } from './serviceBase';
import type { ApiResponse, CustomerProfileInfo } from '../types/api';

export const userApi = {
  getCustomerByAccountId: (accountId: string) => {
    return axiosClient.get<unknown, ApiResponse<CustomerProfileInfo>>(`/user/customers/account/${accountId}`, {
      baseURL: resolveBaseUrl(serviceBase.user),
    });
  },
};
