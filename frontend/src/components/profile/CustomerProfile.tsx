import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Calendar, CheckCircle, Edit3, Mail, Phone, ShieldCheck, Sparkles, User, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { CustomerProfileInfo, CustomerUpdateRequest, UserProfileInfo } from '../../types/api';

type CustomerProfileProps = {
  user: UserProfileInfo;
  customer: CustomerProfileInfo;
  onSave: (data: CustomerUpdateRequest) => Promise<void>;
};

const genderOptions = [
  { label: 'Nam', value: 'MALE' },
  { label: 'Nữ', value: 'FEMALE' },
  { label: 'Khác', value: 'OTHER' },
];

export const CustomerProfile = ({ user, customer, onSave }: CustomerProfileProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [fullName, setFullName] = useState(user.fullName ?? '');
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber ?? '');
  const [dateOfBirth, setDateOfBirth] = useState(formatDateInput(user.dateOfBirth));
  const [gender, setGender] = useState(user.gender ?? '');
  const [skinType, setSkinType] = useState(user.skinType ?? '');

  useEffect(() => {
    setFullName(user.fullName ?? '');
    setPhoneNumber(user.phoneNumber ?? '');
    setDateOfBirth(formatDateInput(user.dateOfBirth));
    setGender(user.gender ?? '');
    setSkinType(user.skinType ?? '');
    setFieldErrors({});
  }, [user]);

  const hasChanges = useMemo(() => {
    return (
      fullName.trim() !== (user.fullName ?? '') ||
      phoneNumber.trim() !== (user.phoneNumber ?? '') ||
      dateOfBirth !== formatDateInput(user.dateOfBirth) ||
      gender !== (user.gender ?? '') ||
      skinType.trim() !== (user.skinType ?? '')
    );
  }, [dateOfBirth, gender, fullName, phoneNumber, skinType, user]);

  const handleCancel = () => {
    setIsEditing(false);
    setFieldErrors({});
    setFullName(user.fullName ?? '');
    setPhoneNumber(user.phoneNumber ?? '');
    setDateOfBirth(formatDateInput(user.dateOfBirth));
    setGender(user.gender ?? '');
    setSkinType(user.skinType ?? '');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const errors: Record<string, string> = {};
    const trimmedFullName = fullName.trim();
    const trimmedPhoneNumber = phoneNumber.trim();
    const trimmedSkinType = skinType.trim();

    if (!trimmedFullName) {
      errors.fullName = 'Vui lòng nhập họ và tên';
    }

    if (!trimmedPhoneNumber) {
      errors.phoneNumber = 'Vui lòng nhập số điện thoại';
    } else if (!/^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(trimmedPhoneNumber)) {
      errors.phoneNumber = 'Số điện thoại không hợp lệ';
    }

    if (dateOfBirth && Number.isNaN(new Date(dateOfBirth).getTime())) {
      errors.dateOfBirth = 'Ngày sinh không hợp lệ';
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
        dateOfBirth: dateOfBirth || undefined,
        gender: gender || undefined,
        skinType: trimmedSkinType || undefined,
      });

      toast.success('Cập nhật thông tin cá nhân thành công.');
      setIsEditing(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể cập nhật thông tin cá nhân.';
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
          <h3 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>{user.fullName || 'Khách hàng'}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', marginTop: '4px', flexWrap: 'wrap' }}>
            <span style={{ background: '#e0e7ff', color: '#6366f1', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
              CUSTOMER
            </span>
            {user.status === 'ACTIVE' && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontSize: '0.8rem' }}>
                <CheckCircle size={14} /> Hoạt động
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ padding: '0 2rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <ProfileRow icon={<Mail size={16} />} label="Email" value={user.email} verified={user.emailVerified} />
            <ProfileRow icon={<Phone size={16} />} label="Số điện thoại" value={user.phoneNumber || 'Chưa cập nhật'} />
            <ProfileRow icon={<ShieldCheck size={16} />} label="Phương thức đăng nhập" value={user.provider === 'GOOGLE' ? 'Google OAuth2' : 'Tài khoản thường (Local)'} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <ProfileRow icon={<Calendar size={16} />} label="Ngày tham gia" value={formatDate(user.createdAt)} />
            <ProfileRow icon={<Calendar size={16} />} label="Ngày sinh" value={formatDate(user.dateOfBirth)} />
            <ProfileRow icon={<Sparkles size={16} />} label="Điểm tích lũy" value={String(user.loyaltyPoints ?? 0)} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <ProfileRow icon={<Sparkles size={16} />} label="Loại da" value={user.skinType || 'Chưa cập nhật'} />
            <ProfileRow icon={<Sparkles size={16} />} label="Giới tính" value={user.gender || 'Chưa cập nhật'} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', fontSize: '0.9rem', marginBottom: '4px' }}>
                <Sparkles size={16} /> Mối quan tâm về da
              </div>
              <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>
                {user.skinConcerns?.length ? user.skinConcerns.join(', ') : 'Chưa cập nhật'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #f3f4f6', padding: '1.5rem 2rem 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#111827' }}>Thông tin cá nhân có thể chỉnh sửa</h4>
            <p style={{ margin: '0.35rem 0 0', color: '#6b7280', fontSize: '0.92rem' }}>Cập nhật tên, số điện thoại, ngày sinh, giới tính và loại da của bạn.</p>
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

              <TextField
                label="Ngày sinh"
                value={dateOfBirth}
                error={fieldErrors.dateOfBirth}
                onChange={(value) => {
                  setDateOfBirth(value);
                  setFieldErrors((prev) => ({ ...prev, dateOfBirth: '' }));
                }}
                type="date"
              />

              <SelectField
                label="Giới tính"
                value={gender}
                onChange={setGender}
                options={genderOptions}
              />

              <TextField
                label="Loại da"
                value={skinType}
                onChange={setSkinType}
                placeholder="Ví dụ: Da dầu, da khô..."
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
            {customer.id ? 'Bấm Chỉnh sửa để cập nhật thông tin cá nhân.' : 'Không tìm thấy mã hồ sơ khách hàng để chỉnh sửa.'}
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

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: '8px',
          border: '1px solid #d1d5db',
          background: '#fff',
          color: '#111827',
          outline: 'none',
        }}
      >
        <option value="">Chưa cập nhật</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
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

function formatDateInput(dateString?: string) {
  if (!dateString) {
    return '';
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(0, 10);
}