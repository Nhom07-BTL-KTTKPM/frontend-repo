import { PackageSearch, Users, ShoppingBag, CircleDollarSign, BellRing } from 'lucide-react';
import { AdminTable } from '../../components/admin/AdminTable';
import { StatCard } from '../../components/admin/StatCard';

type ActivityRow = {
  id: string;
  subject: string;
  owner: string;
  status: string;
  updatedAt: string;
};

const activities: ActivityRow[] = [
  { id: '1', subject: 'Xiaomi Watch 2 Pro', owner: 'Product team', status: 'Updated', updatedAt: '10:40' },
  { id: '2', subject: 'User permission sync', owner: 'System', status: 'Pending', updatedAt: '09:15' },
  { id: '3', subject: 'Order queue cleanup', owner: 'Ops', status: 'Done', updatedAt: '08:05' },
];

export const Dashboard = () => {
  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <section
        style={{
          borderRadius: '24px',
          padding: '1.5rem',
          color: 'var(--color-black)',
          background: 'linear-gradient(135deg, var(--color-cream) 0%, var(--color-cream-dark) 55%, var(--color-gold-light) 100%)',
          boxShadow: '0 18px 40px rgba(201, 169, 110, 0.18)',
          border: '1px solid rgba(201,169,110,0.18)',
        }}
      >
        <p style={{ margin: 0, letterSpacing: '0.2em', textTransform: 'uppercase', fontSize: '0.75rem', color: 'var(--color-gold-dark)' }}>
          LUMIÈRE ADMIN
        </p>
        <h2 style={{ margin: '0.4rem 0 0', fontSize: '2rem', color: 'var(--color-black)' }}>Theo dõi dữ liệu hệ thống và chỉnh sửa sản phẩm</h2>
        <p style={{ margin: '0.65rem 0 0', maxWidth: '60ch', color: 'var(--color-gray-700)' }}>
          Khu vực nội bộ dành cho nhân viên và admin để quản lý sản phẩm, người dùng và trạng thái vận hành.
        </p>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '1rem' }}>
        <StatCard label="Sản phẩm" value="128" detail="+12 so với tuần trước" icon={<PackageSearch size={18} />} accent="var(--color-gold)" />
        <StatCard label="Người dùng" value="3,451" detail="82 tài khoản nội bộ" icon={<Users size={18} />} accent="var(--color-primary)" />
        <StatCard label="Đơn hàng" value="842" detail="26 đơn đang xử lý" icon={<ShoppingBag size={18} />} accent="var(--color-rose-dark)" />
        <StatCard label="Doanh thu" value="$48.2k" detail="Cập nhật lúc 5 phút trước" icon={<CircleDollarSign size={18} />} accent="var(--color-gold-dark)" />
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.9fr', gap: '1rem' }}>
        <AdminTable
          title="Hoạt động gần đây"
          description="Các thay đổi nổi bật trong hệ thống"
          rows={activities}
          columns={[
            { header: 'Nội dung', render: (row) => row.subject },
            { header: 'Người phụ trách', render: (row) => row.owner },
            { header: 'Trạng thái', render: (row) => row.status },
            { header: 'Cập nhật', render: (row) => row.updatedAt, align: 'right' },
          ]}
        />

        <section
          style={{
            borderRadius: '20px',
            background: 'var(--color-white)',
            padding: '1.25rem',
            boxShadow: '0 12px 30px rgba(201,169,110,0.12)',
            border: '1px solid rgba(201,169,110,0.18)',
            display: 'grid',
            gap: '1rem',
          }}
        >
          <div>
            <p style={{ margin: 0, color: 'var(--color-gray-500)', fontSize: '0.9rem' }}>Quick actions</p>
            <h3 style={{ margin: '0.35rem 0 0', color: 'var(--color-black)' }}>Điều hướng nhanh</h3>
          </div>

          <button
            style={{
              border: 'none',
              borderRadius: '14px',
              padding: '0.95rem 1rem',
              background: 'linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))',
              color: 'var(--color-white)',
              fontWeight: 700,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            Tạo sản phẩm mới
          </button>

          <button
            style={{
              border: '1px solid rgba(201,169,110,0.35)',
              borderRadius: '14px',
              padding: '0.95rem 1rem',
              background: 'var(--color-cream)',
              color: 'var(--color-black)',
              fontWeight: 700,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            Xem danh sách user
          </button>

          <div style={{ borderRadius: '16px', background: '#eff6ff', padding: '1rem', color: '#1d4ed8' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <BellRing size={18} />
              <strong>Thông báo</strong>
            </div>
            <p style={{ margin: 0, color: '#334155' }}>Trang admin này là khung ban đầu để nối API thật sau.</p>
          </div>
        </section>
      </section>
    </div>
  );
};