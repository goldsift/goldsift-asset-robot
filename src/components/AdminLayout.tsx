'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  { icon: '📊', label: '控制台', href: '/admin' },
  { icon: '⚙️', label: '基础配置', href: '/admin/config' },
  { icon: '👥', label: '群组管理', href: '/admin/groups' },
  { icon: '⭐', label: '关注列表', href: '/admin/watchlist' }
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('登出失败:', error);
      setIsLoggingOut(false);
    }
  };

  const handleChangePassword = () => {
    setShowUserMenu(false);
    router.push('/admin/change-password');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-xl flex items-center justify-center">
              <span className="text-xl">🤖</span>
            </div>
            <span className="text-lg font-semibold text-gray-900">智能标的机器人</span>
          </div>

          <div className="relative flex items-center gap-2">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors"
            >
              <span className="text-lg">👤</span>
              <span className="text-sm font-medium text-gray-700">管理员</span>
              <span className="text-gray-500">{showUserMenu ? '▲' : '▼'}</span>
            </button>

            {/* 用户菜单 */}
            {showUserMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                <button
                  onClick={handleChangePassword}
                  className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <span>🔒</span>
                  <span>修改密码</span>
                </button>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-t border-gray-100 disabled:opacity-50"
                >
                  <span>🚪</span>
                  <span>{isLoggingOut ? '退出中...' : '退出登录'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* 侧边栏 */}
        <aside className="w-60 min-h-[calc(100vh-4rem)] bg-white border-r border-gray-200 shadow-sm">
          <nav className="py-6">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-6 py-3 transition-all border-l-3 ${
                    isActive
                      ? 'bg-yellow-50 text-yellow-600 border-l-yellow-500 font-semibold'
                      : 'text-gray-600 hover:bg-gray-50 border-l-transparent'
                  }`}
                >
                  <span className="text-xl w-6 text-center">{item.icon}</span>
                  <span className="text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* 主内容区 */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}