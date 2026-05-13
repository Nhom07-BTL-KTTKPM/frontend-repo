import { AdminTable } from '../../components/admin/AdminTable';

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
};

const users: UserRow[] = [
  { id: '1', name: 'Marylin Mondrong', email: 'admin@kusale.com', role: 'ADMIN' },
  { id: '2', name: 'Nguyen Van A', email: 'employee@kusale.com', role: 'EMPLOYEE' },
  { id: '3', name: 'Tran Thi B', email: 'user@kusale.com', role: 'CUSTOMER' },
];

export const UserManagement = () => {
  return (
    <AdminTable
      title="Quản lý người dùng"
      description="Tài khoản nội bộ và khách hàng"
      rows={users}
      columns={[
        { header: 'Họ tên', render: (row) => row.name },
        { header: 'Email', render: (row) => row.email },
        { header: 'Role', render: (row) => row.role },
      ]}
    />
  );
};