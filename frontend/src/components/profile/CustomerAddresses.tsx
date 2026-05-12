import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, Edit3, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Address, AddressCreateRequest } from '../../types/api';
import { userApi } from '../../api/userApi';
import { useAuthStore } from '../../store/authStore';

export const CustomerAddresses = ({ customerId }: { customerId: string | undefined }) => {
  const queryClient = useQueryClient();
  const authUser = useAuthStore((s) => s.user);
  const [isAdding, setIsAdding] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [form, setForm] = useState<AddressCreateRequest>({
    recipientName: '',
    phone: '',
    streetAddress: '',
    ward: '',
    district: '',
    city: '',
    isDefault: false,
  });

  const addressesQuery = useQuery({
    queryKey: ['profile', 'customer', 'addresses', customerId ?? authUser?.accountId],
    queryFn: async () => {
      if (!customerId) return [] as Address[];
      const res = await userApi.getAddressesByCustomerId(customerId);
      return res.data;
    },
    enabled: !!customerId,
  });

  const addMutation = useMutation({
    mutationFn: (payload: AddressCreateRequest) => userApi.addAddress(customerId!, payload),
    onSuccess: async () => {
      toast.success('Đã thêm địa chỉ');
      queryClient.invalidateQueries({ queryKey: ['profile', 'customer', 'addresses'] });
      setIsAdding(false);
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Không thể thêm địa chỉ');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AddressCreateRequest }) => userApi.updateAddress(id, payload),
    onSuccess: () => {
      toast.success('Cập nhật địa chỉ');
      queryClient.invalidateQueries({ queryKey: ['profile', 'customer', 'addresses'] });
      setEditing(null);
    },
    onError: (err: any) => toast.error(err?.message || 'Không thể cập nhật địa chỉ'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => userApi.deleteAddress(id),
    onSuccess: () => {
      toast.success('Đã xóa địa chỉ');
      queryClient.invalidateQueries({ queryKey: ['profile', 'customer', 'addresses'] });
    },
    onError: (err: any) => toast.error(err?.message || 'Không thể xóa địa chỉ'),
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => userApi.setDefaultAddress(id),
    onSuccess: () => {
      toast.success('Đã đặt địa chỉ mặc định');
      queryClient.invalidateQueries({ queryKey: ['profile', 'customer', 'addresses'] });
    },
    onError: (err: any) => toast.error(err?.message || 'Không thể đặt địa chỉ mặc định'),
  });

  if (!customerId) {
    return <div style={{ background: '#fff', borderRadius: 12, padding: 16 }}>Không tìm thấy hồ sơ khách hàng.</div>;
  }

  const addresses = addressesQuery.data ?? [];

  function resetForm() {
    setForm({ recipientName: '', phone: '', streetAddress: '', ward: '', district: '', city: '', isDefault: false });
  }

  return (
    <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 10px 25px rgba(0,0,0,0.05)', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 18 }}>Địa chỉ giao hàng</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { setIsAdding((s) => !s); setEditing(null); resetForm(); }} className="btn btn--primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <PlusCircle size={16} /> Thêm địa chỉ
          </button>
        </div>
      </div>

      {(isAdding || editing) && (
        <form onSubmit={(e) => {
          e.preventDefault();
          const payload = form;
          if (editing) {
            updateMutation.mutate({ id: editing.id as any as string, payload });
          } else {
            addMutation.mutate(payload);
          }
        }} style={{ marginBottom: 18, borderTop: '1px solid #f3f4f6', paddingTop: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
            <Input label="Tên người nhận" value={form.recipientName || ''} onChange={(v) => setForm((s) => ({ ...s, recipientName: v }))} />
            <Input label="Số điện thoại" value={form.phone || ''} onChange={(v) => setForm((s) => ({ ...s, phone: v }))} />
            <Input label="Địa chỉ (số nhà, đường)" value={form.streetAddress || ''} onChange={(v) => setForm((s) => ({ ...s, streetAddress: v }))} />
            <Input label="Phường/Xã" value={form.ward || ''} onChange={(v) => setForm((s) => ({ ...s, ward: v }))} />
            <Input label="Quận/Huyện" value={form.district || ''} onChange={(v) => setForm((s) => ({ ...s, district: v }))} />
            <Input label="Tỉnh/Thành phố" value={form.city || ''} onChange={(v) => setForm((s) => ({ ...s, city: v }))} />
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button type="submit" className="btn btn--primary" disabled={addMutation.isPending || updateMutation.isPending}>
              {editing ? 'Lưu' : 'Thêm'}
            </button>
            <button type="button" className="btn" onClick={() => { setIsAdding(false); setEditing(null); resetForm(); }}>
              Hủy
            </button>
          </div>
        </form>
      )}

      <div style={{ display: 'grid', gap: 10 }}>
        {addresses.length === 0 && <div style={{ color: 'var(--color-gray-600)' }}>Chưa có địa chỉ nào.</div>}
        {addresses.map((a) => (
          <div key={a.id} style={{ border: '1px solid #eef2f7', padding: 12, borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700 }}>{a.recipientName} {a.isDefault ? <span style={{ marginLeft: 8, fontSize: 12, background: 'var(--color-gold)', color: '#fff', padding: '2px 6px', borderRadius: 6 }}>Mặc định</span> : null}</div>
              <div style={{ color: 'var(--color-gray-600)' }}>{a.phone}</div>
              <div style={{ marginTop: 6 }}>{a.streetAddress}, {a.ward}, {a.district}, {a.city}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {!a.isDefault && (
                <button className="btn btn--outline" onClick={() => setDefaultMutation.mutate(a.id as any as string)}>Đặt mặc định</button>
              )}
              <button className="btn" onClick={() => { setEditing(a); setIsAdding(false); setForm({ recipientName: a.recipientName || '', phone: a.phone || '', streetAddress: a.streetAddress || '', ward: a.ward || '', district: a.district || '', city: a.city || '', isDefault: !!a.isDefault }); }}>
                <Edit3 size={14} />
              </button>
              <button className="btn" onClick={() => deleteMutation.mutate(a.id as any as string)}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--color-gray-200)' }} />
    </div>
  );
}
