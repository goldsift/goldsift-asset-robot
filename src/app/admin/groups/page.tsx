'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';

interface Group {
  id: number;
  group_id: string;
  group_name: string;
  description: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
  watchlist_count?: number;
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGroupId, setNewGroupId] = useState('');
  const [newGroupName, setNewGroupName] = useState('');

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const res = await fetch('/api/groups');
      const data = await res.json();

      if (data.success) {
        setGroups(data.data);
      }
    } catch (error) {
      console.error('加载群组失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newGroupId || !newGroupName) {
      alert('请填写完整信息');
      return;
    }

    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: newGroupId,
          groupName: newGroupName
        })
      });

      const data = await res.json();

      if (data.success) {
        alert('添加成功');
        setShowAddModal(false);
        setNewGroupId('');
        setNewGroupName('');
        loadGroups();
      } else {
        alert('添加失败: ' + (data.error || data.message));
      }
    } catch (error) {
      console.error('添加群组失败:', error);
      alert('添加失败,请稍后重试');
    }
  };

  const handleToggleActive = async (groupId: string, currentStatus: number) => {
    const action = currentStatus === 1 ? '禁用' : '启用';
    if (!confirm(`确定要${action}这个群组吗？`)) {
      return;
    }

    try {
      const res = await fetch('/api/groups', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          isActive: currentStatus === 1 ? 0 : 1
        })
      });

      const data = await res.json();

      if (data.success) {
        alert(`${action}成功`);
        loadGroups();
      } else {
        alert(`${action}失败: ` + (data.error || data.message));
      }
    } catch (error) {
      console.error(`${action}群组失败:`, error);
      alert(`${action}失败,请稍后重试`);
    }
  };

  const handleDelete = async (groupId: string) => {
    if (!confirm('确定要删除这个群组吗？\n\n删除后该群组将无法使用机器人功能')) {
      return;
    }

    try {
      const res = await fetch('/api/groups', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId })
      });

      const data = await res.json();

      if (data.success) {
        alert('删除成功');
        loadGroups();
      } else {
        alert('删除失败: ' + (data.error || data.message));
      }
    } catch (error) {
      console.error('删除群组失败:', error);
      alert('删除失败,请稍后重试');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">加载中...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex-1">
        {/* 页面标题 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">群组管理</h1>
            <p className="text-gray-600">管理允许使用机器人的群组白名单</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-yellow-300 to-yellow-500 text-gray-900 font-semibold rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2"
          >
            ➕ 添加群组
          </button>
        </div>

        {/* 群组列表 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="text-lg font-semibold text-gray-900">📋 白名单群组</div>
            <div className="text-sm text-gray-600 mt-1">共 {groups.length} 个群组</div>
          </div>

          {groups.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">群组名称</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">群组 ID</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">状态</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">关注标的</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">添加时间</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group, index) => (
                    <tr
                      key={group.id}
                      className={`hover:bg-gray-50 ${index !== groups.length - 1 ? 'border-b border-gray-200' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{group.group_name}</div>
                        {group.description && (
                          <div className="text-xs text-gray-500 mt-1">{group.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-mono text-sm text-gray-600">{group.group_id}</div>
                      </td>
                      <td className="px-6 py-4">
                        {group.is_active === 1 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ 已启用
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            ○ 待审核
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-900">{group.watchlist_count || 0}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(group.created_at).toLocaleString('zh-CN')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {group.is_active === 1 ? (
                            <button
                              onClick={() => handleToggleActive(group.group_id, group.is_active)}
                              className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 text-sm font-medium rounded-lg transition-colors"
                            >
                              禁用
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleActive(group.group_id, group.is_active)}
                              className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-600 text-sm font-medium rounded-lg transition-colors"
                            >
                              启用
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(group.group_id)}
                            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-lg transition-colors"
                          >
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">👥</div>
              <div className="text-lg font-semibold text-gray-900 mb-2">暂无群组</div>
              <div className="text-sm text-gray-600 mb-6">点击上方"添加群组"按钮,将群组添加到白名单</div>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-yellow-300 to-yellow-500 text-gray-900 font-semibold rounded-lg hover:shadow-lg transition-all inline-flex items-center gap-2"
              >
                ➕ 添加第一个群组
              </button>
            </div>
          )}
        </div>

        {/* 添加群组模态框 */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">添加群组</h2>

              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  群组 ID
                </label>
                <input
                  type="text"
                  value={newGroupId}
                  onChange={(e) => setNewGroupId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100"
                  placeholder="例如: -1001234567890"
                />
                <p className="text-xs text-gray-500 mt-1">可以使用机器人命令 /getid 获取群组 ID</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  群组名称
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100"
                  placeholder="例如: 币圈交流群"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAdd}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-300 to-yellow-500 text-gray-900 font-semibold rounded-lg hover:shadow-lg transition-all"
                >
                  确认添加
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewGroupId('');
                    setNewGroupName('');
                  }}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}