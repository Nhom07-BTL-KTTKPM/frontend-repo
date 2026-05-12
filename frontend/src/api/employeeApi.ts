import { axiosClient } from './axiosClient';
import type { ApiResponse, EmployeeProfileInfo, EmployeeUpdateRequest } from '../types/api';

export const employeeApi = {
  getEmployeeByAccountId: (accountId: string) => {
    return axiosClient.get<unknown, ApiResponse<EmployeeProfileInfo>>(`/user/employees/account/${accountId}`);
  },

  updateEmployee: (employeeId: string, data: EmployeeUpdateRequest) => {
    return axiosClient.put<unknown, ApiResponse<void>>(`/user/employees/${employeeId}`, data);
  },
};