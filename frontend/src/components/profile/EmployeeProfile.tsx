import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Calendar, CheckCircle, Edit3, Mail, Phone, User, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { EmployeeProfileInfo, EmployeeUpdateRequest, UserProfileInfo } from '../../types/api';

type EmployeeProfileProps = {
  user: UserProfileInfo;
  employee: EmployeeProfileInfo;
  onSave: (data: EmployeeUpdateRequest) => Promise<void>;
};

export const EmployeeProfile = ({ user, employee, onSave }: EmployeeProfileProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [fullName, setFullName] = useState(user.fullName ?? '');
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber ?? '');

  useEffect(() => {
    setFullName(user.fullName ?? '');
    setPhoneNumber(user.phoneNumber ?? '');
    setFieldErrors({});
  }, [user]);

  const hasChanges = useMemo(() => {
    return (
      fullName.trim() !== (user.fullName ?? '') ||
      phoneNumber.trim() !== (user.phoneNumber ?? '')
    );
  }, [fullName, phoneNumber, user]);

  const handleCancel = () => {
    setIsEditing(false);
    setFieldErrors({});
    setFullName(user.fullName ?? '');
    setPhoneNumber(user.phoneNumber ?? '');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const errors: Record<string, string> = {};
    const trimmedFullName = fullName.trim();
    const trimmedPhoneNumber = phoneNumber.trim();

    if (!trimmedFullName) {
      errors.fullName = 'Vui lòng nhập họ và tên';
    }

    if (!trimmedPhoneNumber) {
      errors.phoneNumber = 'Vui lòng nhập số điện thoại';
    } else if (!/^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(trimmedPhoneNumber)) {
      errors.phoneNumber = 'Số điện thoại không hợp lệ';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSaving(true);
    setFieldErrors({});

    try {
      await onSave({
        fullName: trimmedFullName,
        phoneNumber: trimmedPhoneNumber,
      });

      toast.success('Cập nhật thông tin thành công.');
      setIsEditing(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể cập nhật thông tin.';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', overflow: 'hidden', marginBottom: '2rem' }}>
      <div style={{ background: 'linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))', height: '120px', position: 'relative' }} />

      <div style={{ padding: '0 2rem', marginTop: '-50px', display: 'flex', alignItems: 'flex-end', gap: '1.5rem', marginBottom: '2rem', position: 'relative', zIndex: 10 }}>
        <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#fff', padding: '4px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', position: 'relative', flexShrink: 0 }}>
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
              <User size={40} />
            </div>
          )}
        </div>
        <div style={{ paddingBottom: '10px' }}>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>{user.fullName || 'Nhân viên'}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', marginTop: '4px', flexWrap: 'wrap' }}>
            <span style={{ background: '#fef3c7', color: '#f59e0b', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
              EMPLOYEE
            </span>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 2rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <ProfileRow icon={<Mail size={16} />} label="Email" value={user.email} verified={user.emailVerified} />
            <ProfileRow icon={<Phone size={16} />} label="Số điện thoại" value={user.phoneNumber || 'Chưa cập nhật'} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <ProfileRow icon={<Calendar size={16} />} label="Mã nhân viên" value={user.employeeCode || 'Chưa cập nhật'} />
            <ProfileRow icon={<Calendar size={16} />} label="Ngày vào làm" value={formatDate(user.hireDate)} />
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #f3f4f6', padding: '1.5rem 2rem 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#111827' }}>Thông tin cơ bản có thể chỉnh sửa</h4>
            <p style={{ margin: '0.35rem 0 0', color: '#6b7280', fontSize: '0.92rem' }}>Cập nhật tên và số điện thoại của bạn.</p>
          </div>

          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="btn btn--outline"
              style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #d1d5db', background: 'transparent', cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <Edit3 size={16} /> Chỉnh sửa
            </button>
          ) : null}
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <TextField
                label="Họ và tên"
                value={fullName}
                error={fieldErrors.fullName}
                onChange={(value) => {
                  setFullName(value);
                  setFieldErrors((prev) => ({ ...prev, fullName: '' }));
                }}
                placeholder="Nhập họ và tên"
              />

              <TextField
                label="Số điện thoại"
                value={phoneNumber}
                error={fieldErrors.phoneNumber}
                onChange={(value) => {
                  setPhoneNumber(value);
                  setFieldErrors((prev) => ({ ...prev, phoneNumber: '' }));
                }}
                placeholder="0901234567"
                type="tel"
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="submit"
                disabled={isSaving || !hasChanges}
                className="btn btn--primary"
                style={{ padding: '10px 20px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
              >
                {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="btn"
                style={{ padding: '10px 20px', background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
              >
                Hủy
              </button>
            </div>
          </form>
        ) : (
          <div style={{ color: '#6b7280', fontSize: '0.95rem' }}>
            {employee.id ? 'Bấm Chỉnh sửa để cập nhật thông tin.' : 'Không tìm thấy mã nhân viên để chỉnh sửa.'}
          </div>
        )}
      </div>
    </div>
  );
};

function TextField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  error?: string;
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: '8px',
          border: `1px solid ${error ? '#ef4444' : '#d1d5db'}`,
          background: '#fff',
          color: '#111827',
          outline: 'none',
        }}
      />
      {error && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{error}</span>}
    </div>
  );
}

function ProfileRow({
  icon,
  label,
  value,
  verified,
}: {
  icon: ReactNode;
  label: string;
  value?: string;
  verified?: boolean;
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', fontSize: '0.9rem', marginBottom: '4px' }}>
        {icon} {label}
      </div>
      <div style={{ fontWeight: 600, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{ wordBreak: 'break-all' }}>{value || 'Chưa cập nhật'}</span>
        {typeof verified === 'boolean' && (
          verified ? <span title="Đã xác thực" style={{ color: '#10b981', display: 'flex', flexShrink: 0 }}><CheckCircle size={16} /></span> : <span title="Chưa xác thực" style={{ color: '#f59e0b', display: 'flex', flexShrink: 0 }}><XCircle size={16} /></span>
        )}
      </div>
    </div>
  );
}

function formatDate(dateString?: string) {
  if (!dateString) return 'Chưa có thông tin';
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(dateString));
  } catch {
    return dateString;
  }
}