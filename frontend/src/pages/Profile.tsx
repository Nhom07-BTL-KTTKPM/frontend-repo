import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, Key, Mail, Phone, ShieldCheck, User, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { CustomerProfile } from '../components/profile/CustomerProfile.tsx';
import { EmployeeProfile } from '../components/profile/EmployeeProfile';
import { CustomerAddresses } from '../components/profile/CustomerAddresses';
import { employeeApi } from '../api/employeeApi';
import { userApi } from '../api/userApi';
import { useAuth } from '../hooks/useAuth';
import { useAuthStore } from '../store/authStore';
import type { ApiError, CustomerProfileInfo, CustomerUpdateRequest, EmployeeProfileInfo, EmployeeUpdateRequest, UserProfileInfo } from '../types/api';

export const Profile = () => {
  const { requestChangePasswordMutation, confirmChangePasswordMutation } = useAuth();
  const queryClient = useQueryClient();
  const authUser = useAuthStore((state) => state.user);

  const customerQuery = useQuery({
    queryKey: ['profile', 'customer', authUser?.accountId],
    queryFn: async () => {
      const response = await userApi.getCustomerByAccountId(authUser!.accountId);
      return response.data;
    },
    enabled: authUser?.role === 'CUSTOMER' && !!authUser?.accountId,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const employeeQuery = useQuery({
    queryKey: ['profile', 'employee', authUser?.accountId],
    queryFn: async () => {
      const response = await employeeApi.getEmployeeByAccountId(authUser!.accountId);
      return response.data;
    },
    enabled: authUser?.role === 'EMPLOYEE' && !!authUser?.accountId,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const user = useMemo(() => {
    if (!authUser) {
      return null;
    }

    if (authUser.role === 'CUSTOMER' && customerQuery.data) {
      return mergeCustomerProfile(authUser, customerQuery.data);
    }

    if (authUser.role === 'EMPLOYEE' && employeeQuery.data) {
      return mergeEmployeeProfile(authUser, employeeQuery.data);
    }

    return authUser;
  }, [authUser, customerQuery.data, employeeQuery.data]);

  const isLoading = !authUser || customerQuery.isLoading || employeeQuery.isLoading;
  const isError = customerQuery.isError || employeeQuery.isError;
  const error = customerQuery.error ?? employeeQuery.error;

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [otpRequested, setOtpRequested] = useState(false);
  const [customerTab, setCustomerTab] = useState<'profile' | 'addresses'>('profile');
  const [otp, setOtp] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleCustomerProfileSave = async (data: CustomerUpdateRequest) => {
    if (!authUser || authUser.role !== 'CUSTOMER') {
      throw new Error('Không thể cập nhật thông tin khách hàng lúc này.');
    }

    const customerId = customerQuery.data?.id;
    if (!customerId) {
      throw new Error('Không tìm thấy mã hồ sơ khách hàng để cập nhật.');
    }

    await userApi.updateCustomer(customerId, data);

    const nextCustomer: CustomerProfileInfo = {
      ...customerQuery.data,
      accountId: customerQuery.data?.accountId ?? authUser.accountId,
      ...data,
    };

    queryClient.setQueryData(['profile', 'customer', authUser.accountId], nextCustomer);
    useAuthStore.getState().setUser(mergeCustomerProfile(authUser, nextCustomer));
  };

  const handleEmployeeProfileSave = async (data: EmployeeUpdateRequest) => {
    if (!authUser || authUser.role !== 'EMPLOYEE') {
      throw new Error('Không thể cập nhật thông tin nhân viên lúc này.');
    }

    const employeeId = employeeQuery.data?.id;
    if (!employeeId) {
      throw new Error('Không tìm thấy mã nhân viên để cập nhật.');
    }

    await employeeApi.updateEmployee(employeeId, data);

    const nextEmployee: EmployeeProfileInfo = {
      ...employeeQuery.data,
      accountId: employeeQuery.data?.accountId ?? authUser.accountId,
      employeeCode: employeeQuery.data?.employeeCode ?? '',
      ...data,
    };

    queryClient.setQueryData(['profile', 'employee', authUser.accountId], nextEmployee);
    useAuthStore.getState().setUser(mergeEmployeeProfile(authUser, nextEmployee));
  };

  const handleRequestChangePassword = () => {
    requestChangePasswordMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success('Đã gửi mã OTP đến email của bạn.');
        setOtpRequested(true);
      },
      onError: (err: Error) => {
        toast.error(err.message || 'Lỗi khi yêu cầu đổi mật khẩu.');
      }
    });
  };

  const handleConfirmChangePassword = (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};
    if (!otp.trim()) {
      errors.otp = 'Vui lòng nhập mã OTP';
    } else if (otp.trim().length !== 6) {
      errors.otp = 'Mã OTP phải gồm 6 ký tự';
    }

    if (!oldPassword) {
      errors.oldPassword = 'Vui lòng nhập mật khẩu hiện tại';
    }

    if (!newPassword) {
      errors.newPassword = 'Vui lòng nhập mật khẩu mới';
    } else if (newPassword.length < 8) {
      errors.newPassword = 'Mật khẩu phải từ 8 ký tự';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp!';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});

    confirmChangePasswordMutation.mutate({ otp, oldPassword, newPassword }, {
      onSuccess: () => {
        toast.success('Đổi mật khẩu thành công!');
        setIsChangingPassword(false);
        setOtpRequested(false);
        setOtp('');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      },
      onError: (err: unknown) => {
        const apiErr = err as ApiError;
        if (apiErr.errors && Object.keys(apiErr.errors).length > 0) {
          setFieldErrors(apiErr.errors);
        } else {
          toast.error(apiErr.message || 'Lỗi khi đổi mật khẩu. Vui lòng kiểm tra lại OTP hoặc mật khẩu cũ.');
        }
      }
    });
  };

  const cancelChangePassword = () => {
    setIsChangingPassword(false);
    setOtpRequested(false);
    setOtp('');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  if (isLoading) {
    return <ProfileLoading />;
  }

  if (isError || !user) {
    return <ProfileError error={error} />;
  }

  const shouldShowPasswordCard = user.role !== 'CUSTOMER' || customerTab === 'profile';

  return (
    <div className="container" style={{ padding: '4rem 0', minHeight: '80vh' }}>
      {user.role === 'CUSTOMER' ? (
        <div style={{ margin: '0 auto', display: 'grid', gridTemplateColumns: '240px minmax(0, 1fr)', gap: '1.25rem', alignItems: 'start' }}>
          <aside style={{ background: '#fff', borderRadius: '12px', padding: '1rem', boxShadow: '0 6px 18px rgba(0,0,0,0.04)', position: 'sticky', top: '88px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button onClick={() => setCustomerTab('profile')} className={`btn ${customerTab === 'profile' ? 'btn--primary' : ''}`} style={{ textAlign: 'left', justifyContent: 'flex-start' }}>
                Hồ sơ
              </button>
              <button onClick={() => setCustomerTab('addresses')} className={`btn ${customerTab === 'addresses' ? 'btn--primary' : ''}`} style={{ textAlign: 'left', justifyContent: 'flex-start' }}>
                Địa chỉ
              </button>
            </div>
          </aside>

          <div>

            {customerTab === 'profile' ? (
              <CustomerProfile user={user} customer={customerQuery.data!} onSave={handleCustomerProfileSave} />
            ) : (
              <CustomerAddresses customerId={customerQuery.data?.id} />
            )}

            {shouldShowPasswordCard ? (
              <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', padding: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.25rem', margin: 0, color: 'var(--color-gray-800)' }}>
                    <Key size={20} color="var(--color-primary)" /> Đổi mật khẩu
                  </h3>
                  {!isChangingPassword && (
                    <button
                      onClick={() => setIsChangingPassword(true)}
                      style={{
                        padding: '10px 24px',
                        borderRadius: '12px',
                        border: '2px solid #D4AF37',
                        background: '#fff',
                        color: '#B8860B',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      THAY ĐỔI
                    </button>
                  )}
                </div>

                {isChangingPassword && (
                  <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--color-gray-200)', paddingTop: '1.5rem' }}>
                    {!otpRequested ? (
                      <div>
                        <p style={{ color: 'var(--color-gray-600)', marginBottom: '1rem', fontSize: '0.95rem' }}>
                          Để bảo mật, hệ thống sẽ gửi một mã OTP đến email <strong>{user.email}</strong>. Vui lòng nhấn nút bên dưới để nhận mã.
                        </p>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          <button
                            onClick={handleRequestChangePassword}
                            disabled={requestChangePasswordMutation.isPending}
                            className="btn btn--primary"
                            style={{
                              padding: '10px 24px',
                              borderRadius: '12px',
                              background: 'linear-gradient(135deg, #D4AF37, #B8860B)', // Nút vàng gradient
                              color: '#fff',
                              border: 'none',
                              boxShadow: '0 4px 15px rgba(184, 134, 11, 0.3)',
                              cursor: 'pointer',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '1px'
                            }}
                          >
                            {requestChangePasswordMutation.isPending ? 'Đang gửi...' : 'Gửi mã OTP'}
                          </button>
                          <button
                            onClick={cancelChangePassword}
                            className="btn"
                            style={{ padding: '10px 20px', background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                          >
                            Huỷ
                          </button>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleConfirmChangePassword} style={{ maxWidth: '420px' }}>
                        <InputField
                          label="Mã OTP (từ email)"
                          value={otp}
                          type="text"
                          placeholder="Nhập 6 số"
                          error={fieldErrors.otp}
                          onChange={(value) => {
                            setOtp(value);
                            setFieldErrors((prev) => ({ ...prev, otp: '' }));
                          }}
                        />
                        <InputField
                          label="Mật khẩu hiện tại"
                          value={oldPassword}
                          type="password"
                          placeholder="••••••••"
                          error={fieldErrors.oldPassword}
                          onChange={(value) => {
                            setOldPassword(value);
                            setFieldErrors((prev) => ({ ...prev, oldPassword: '' }));
                          }}
                        />
                        <InputField
                          label="Mật khẩu mới"
                          value={newPassword}
                          type="password"
                          placeholder="••••••••"
                          error={fieldErrors.newPassword}
                          onChange={(value) => {
                            setNewPassword(value);
                            setFieldErrors((prev) => ({ ...prev, newPassword: '' }));
                          }}
                        />
                        <InputField
                          label="Xác nhận mật khẩu mới"
                          value={confirmPassword}
                          type="password"
                          placeholder="••••••••"
                          error={fieldErrors.confirmPassword}
                          onChange={(value) => {
                            setConfirmPassword(value);
                            setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                          }}
                        />
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          <button
                            type="submit"
                            disabled={confirmChangePasswordMutation.isPending || !otp || !oldPassword || !newPassword}
                            className="btn btn--primary"
                            style={{
                              padding: '10px 24px',
                              borderRadius: '12px',
                              background: 'linear-gradient(135deg, #D4AF37, #B8860B)', // Nút vàng gradient
                              color: '#fff',
                              border: 'none',
                              boxShadow: '0 4px 15px rgba(184, 134, 11, 0.3)',
                              cursor: 'pointer',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '1px'
                            }}
                          >
                            {confirmChangePasswordMutation.isPending ? 'Đang xử lý...' : 'Xác nhận đổi'}
                          </button>
                          <button
                            type="button"
                            onClick={cancelChangePassword}
                            className="btn"
                            style={{ padding: '10px 20px', background: 'var(--color-gray-200)', color: 'var(--color-gray-700)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}
                          >
                            Huỷ
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div style={{ margin: '-50px auto' }}>

          {user.role === 'EMPLOYEE' ? (
            <EmployeeProfile user={user} employee={employeeQuery.data!} onSave={handleEmployeeProfileSave} />
          ) : (
            <GenericProfile user={user} />
          )}

          <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.25rem', margin: 0, color: 'var(--color-gray-800)' }}>
                <Key size={20} color="var(--color-primary)" /> Đổi mật khẩu
              </h3>
              {!isChangingPassword && (
                <button
                  onClick={() => setIsChangingPassword(true)}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '12px',
                    border: '2px solid #D4AF37',
                    background: '#fff',
                    color: '#B8860B',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  THAY ĐỔI
                </button>
              )}
            </div>

            {isChangingPassword && (
              <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--color-gray-200)', paddingTop: '1.5rem' }}>
                {!otpRequested ? (
                  <div>
                    <p style={{ color: 'var(--color-gray-600)', marginBottom: '1rem', fontSize: '0.95rem' }}>
                      Để bảo mật, hệ thống sẽ gửi một mã OTP đến email <strong>{user.email}</strong>. Vui lòng nhấn nút bên dưới để nhận mã.
                    </p>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <button
                        onClick={handleRequestChangePassword}
                        disabled={requestChangePasswordMutation.isPending}
                        className="btn btn--primary"
                        style={{
                          padding: '10px 24px',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #D4AF37, #B8860B)', // Nút vàng gradient
                          color: '#fff',
                          border: 'none',
                          boxShadow: '0 4px 15px rgba(184, 134, 11, 0.3)',
                          cursor: 'pointer',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '1px'
                        }}
                      >
                        {requestChangePasswordMutation.isPending ? 'Đang gửi...' : 'Gửi mã OTP'}
                      </button>
                      <button
                        onClick={cancelChangePassword}
                        className="btn"
                        style={{ padding: '10px 20px', background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Huỷ
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleConfirmChangePassword} style={{ maxWidth: '420px' }}>
                    <InputField
                      label="Mã OTP (từ email)"
                      value={otp}
                      type="text"
                      placeholder="Nhập 6 số"
                      error={fieldErrors.otp}
                      onChange={(value) => {
                        setOtp(value);
                        setFieldErrors((prev) => ({ ...prev, otp: '' }));
                      }}
                    />
                    <InputField
                      label="Mật khẩu hiện tại"
                      value={oldPassword}
                      type="password"
                      placeholder="••••••••"
                      error={fieldErrors.oldPassword}
                      onChange={(value) => {
                        setOldPassword(value);
                        setFieldErrors((prev) => ({ ...prev, oldPassword: '' }));
                      }}
                    />
                    <InputField
                      label="Mật khẩu mới"
                      value={newPassword}
                      type="password"
                      placeholder="••••••••"
                      error={fieldErrors.newPassword}
                      onChange={(value) => {
                        setNewPassword(value);
                        setFieldErrors((prev) => ({ ...prev, newPassword: '' }));
                      }}
                    />
                    <InputField
                      label="Xác nhận mật khẩu mới"
                      value={confirmPassword}
                      type="password"
                      placeholder="••••••••"
                      error={fieldErrors.confirmPassword}
                      onChange={(value) => {
                        setConfirmPassword(value);
                        setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                      }}
                    />
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <button
                        type="submit"
                        disabled={confirmChangePasswordMutation.isPending || !otp || !oldPassword || !newPassword}
                        className="btn btn--primary"
                        style={{
                          padding: '10px 24px',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #D4AF37, #B8860B)', // Nút vàng gradient
                          color: '#fff',
                          border: 'none',
                          boxShadow: '0 4px 15px rgba(184, 134, 11, 0.3)',
                          cursor: 'pointer',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '1px'
                        }}
                      >
                        {confirmChangePasswordMutation.isPending ? 'Đang xử lý...' : 'Xác nhận đổi'}
                      </button>
                      <button
                        type="button"
                        onClick={cancelChangePassword}
                        className="btn"
                        style={{ padding: '10px 20px', background: 'var(--color-gray-200)', color: 'var(--color-gray-700)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}
                      >
                        Huỷ
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ProfileLoading = () => (
  <div className="container" style={{ padding: '4rem 0', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ color: 'var(--color-gray-600)', fontSize: '1rem' }}>Đang tải hồ sơ người dùng...</div>
  </div>
);

const ProfileError = ({ error }: { error: unknown }) => {
  const message = getErrorMessage(error) ?? 'Không thể tải hồ sơ người dùng.';

  return (
    <div className="container" style={{ padding: '4rem 0', minHeight: '80vh' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto', background: '#fff', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', padding: '2rem', textAlign: 'center' }}>
        <XCircle size={40} color="var(--color-error)" style={{ marginBottom: '1rem' }} />
        <h2 style={{ margin: 0, marginBottom: '0.75rem' }}>Không tải được hồ sơ</h2>
        <p style={{ color: 'var(--color-gray-600)', margin: 0 }}>{message}</p>
      </div>
    </div>
  );
};

const GenericProfile = ({ user }: { user: UserProfileInfo }) => (
  <div style={{
    background: '#fff',
    boxShadow: '0 12px 30px rgba(201,169,110,0.12)',
    borderRadius: '16px',
    overflow: 'hidden',
    marginBottom: '2rem',
    border: '1px solid rgba(201,169,110,0.18)',
  }}>

    <div style={{ padding: '0 2.5rem', marginTop: '40px', display: 'flex', alignItems: 'flex-end', gap: '1.5rem', marginBottom: '2.5rem', position: 'relative', zIndex: 10 }}>
      <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: '#fff', padding: '5px', boxShadow: '0 8px 20px rgba(184, 134, 11, 0.2)', border: '3px solid #D4AF37', flexShrink: 0 }}>
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#f9f7f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37' }}>
            <User size={48} />
          </div>
        )}
      </div>

      <div style={{ paddingBottom: '15px' }}>
        <h3 style={{ fontSize: '2.2rem', fontWeight: 700, margin: 0, color: '#1a1a1a', letterSpacing: '-0.5px' }}>{user.fullName || 'Quản trị viên'}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
          <span style={{ background: 'linear-gradient(to right, #fef3c7, #fde68a)', color: '#92400e', padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, display: 'inline-block', textTransform: 'uppercase' }}>
            {user.role}
          </span>
        </div>
      </div>
    </div>

    <div style={{ padding: '0 2.5rem 2.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
          <SimpleRow icon={<Mail size={18} color="#D4AF37" />} label="Email" value={user.email} />
        </div>
      </div>
    </div>
  </div>
);

const SimpleRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) => (
  <div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', fontSize: '0.9rem', marginBottom: '4px' }}>
      {icon} {label}
    </div>
    <div style={{ fontWeight: 600, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
      <span style={{ wordBreak: 'break-all' }}>{value || 'Chưa cập nhật'}</span>
    </div>
  </div>
);

const InputField = ({
  label,
  value,
  type,
  placeholder,
  error,
  onChange,
}: {
  label: string;
  value: string;
  type: string;
  placeholder: string;
  error?: string;
  onChange: (value: string) => void;
}) => (
  <div style={{ marginBottom: '1rem' }}>
    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-gray-700)' }}>{label}</label>
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      style={{ width: '100%', padding: '10px', border: `1px solid ${error ? 'var(--color-error)' : 'var(--color-gray-300)'}`, borderRadius: '6px' }}
      placeholder={placeholder}
    />
    {error && <span style={{ color: 'var(--color-error)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{error}</span>}
  </div>
);

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

function getErrorMessage(error: unknown): string | undefined {
  if (!error) return undefined;
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  const apiError = error as ApiError;
  return apiError.message;
}

function mergeCustomerProfile(
  authProfile: UserProfileInfo,
  customer: NonNullable<Awaited<ReturnType<typeof userApi.getCustomerByAccountId>>>['data'],
): UserProfileInfo {
  return {
    ...authProfile,
    fullName: customer.fullName ?? authProfile.fullName,
    phoneNumber: customer.phoneNumber ?? authProfile.phoneNumber,
    dateOfBirth: customer.dateOfBirth ?? authProfile.dateOfBirth,
    gender: customer.gender ?? authProfile.gender,
    skinType: customer.skinType ?? authProfile.skinType,
    loyaltyPoints: customer.loyaltyPoints ?? authProfile.loyaltyPoints,
    skinConcerns: customer.skinConcerns ?? authProfile.skinConcerns,
  };
}

function mergeEmployeeProfile(
  authProfile: UserProfileInfo,
  employee: NonNullable<Awaited<ReturnType<typeof employeeApi.getEmployeeByAccountId>>>['data'],
): UserProfileInfo {
  return {
    ...authProfile,
    fullName: employee.fullName ?? authProfile.fullName,
    phoneNumber: employee.phoneNumber ?? authProfile.phoneNumber,
    employeeCode: employee.employeeCode,
    hireDate: employee.hireDate,
    createdAt: employee.hireDate ?? authProfile.createdAt,
    status: employee.active ? 'ACTIVE' : 'DISABLED',
  };
}