'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 验证输入
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('请填写所有字段');
      return;
    }

    if (newPassword.length < 6) {
      setError('新密码长度至少为 6 位');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('两次输入的新密码不一致');
      return;
    }

    if (oldPassword === newPassword) {
      setError('新密码不能与旧密码相同');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });

      const data = await response.json();

      if (data.success) {
        alert('密码修改成功，请重新登录');
        router.push('/login');
      } else {
        setError(data.message || '密码修改失败');
      }
    } catch (error) {
      console.error('修改密码错误:', error);
      setError('修改密码失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex-1 max-w-2xl">
        {/* 页面标题 */}
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">修改密码</h1>
          <p className="text-gray-600">为了账户安全，请定期修改密码</p>
        </div>

        {/* 表单卡片 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-900 mb-2">
                当前密码
              </label>
              <input
                type="password"
                id="oldPassword"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100 transition-all"
                placeholder="请输入当前密码"
                required
              />
            </div>

            <div className="mb-6">
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-900 mb-2">
                新密码
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100 transition-all"
                placeholder="请输入新密码（至少6位）"
                required
              />
            </div>

            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-900 mb-2">
                确认新密码
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100 transition-all"
                placeholder="请再次输入新密码"
                required
              />
            </div>

            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 h-12 bg-gradient-to-r from-yellow-300 to-yellow-500 text-gray-900 font-semibold rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '修改中...' : '确认修改'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                disabled={loading}
                className="px-6 h-12 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                取消
              </button>
            </div>
          </form>

          {/* 安全提示 */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex gap-3">
              <span className="text-xl">💡</span>
              <div>
                <div className="font-semibold text-blue-900 text-sm mb-1">密码安全建议</div>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 密码长度至少 6 位</li>
                  <li>• 建议使用字母、数字和符号的组合</li>
                  <li>• 不要使用过于简单的密码</li>
                  <li>• 定期更换密码以保证安全</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}