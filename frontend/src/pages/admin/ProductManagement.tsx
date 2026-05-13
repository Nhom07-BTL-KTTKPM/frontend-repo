import { AdminTable } from '../../components/admin/AdminTable';
import { productManagementApi } from '../../api/admin/productManagementApi';

type ProductRow = {
  id: string;
  name: string;
  category: string;
  price: string;
  status: string;
};

const products: ProductRow[] = [
  { id: '1', name: 'Xiaomi Watch 2 Pro', category: 'Electronics', price: '$118.89', status: 'ACTIVE' },
  { id: '2', name: 'Serum Repair Night', category: 'Skincare', price: '$24.00', status: 'DRAFT' },
  { id: '3', name: 'Cleanser Gentle Foam', category: 'Skincare', price: '$17.50', status: 'INACTIVE' },
];

export const ProductManagement = () => {
  void productManagementApi.getProducts();

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <section style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <p style={{ margin: 0, color: '#64748b' }}>Quản trị sản phẩm</p>
          <h2 style={{ margin: '0.25rem 0 0', color: '#0f172a' }}>Product management</h2>
        </div>

        <button
          style={{
            border: 'none',
            borderRadius: '14px',
            padding: '0.9rem 1.2rem',
            background: 'linear-gradient(135deg, #4f46e5, #2563eb)',
            color: '#fff',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Add product
        </button>
      </section>

      <AdminTable
        title="Danh sách sản phẩm"
        description="Khu vực chỉnh sửa thông tin sản phẩm và trạng thái hiển thị"
        rows={products}
        columns={[
          { header: 'Sản phẩm', render: (row) => row.name },
          { header: 'Danh mục', render: (row) => row.category },
          { header: 'Giá', render: (row) => row.price },
          {
            header: 'Trạng thái',
            render: (row) => (
              <span
                style={{
                  display: 'inline-flex',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '999px',
                  background: row.status === 'ACTIVE' ? '#dcfce7' : row.status === 'DRAFT' ? '#fef3c7' : '#fee2e2',
                  color: row.status === 'ACTIVE' ? '#166534' : row.status === 'DRAFT' ? '#92400e' : '#991b1b',
                  fontWeight: 700,
                }}
              >
                {row.status}
              </span>
            ),
          },
        ]}
      />
    </div>
  );
};