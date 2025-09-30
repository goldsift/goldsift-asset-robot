'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { formatTimestamp } from '@/utils/time-client';

interface Watchlist {
  id: number;
  chat_id: number;
  group_name: string;
  symbol: string;
  type: 'spot' | 'futures' | 'alpha';
  reference_price: number;
  threshold: number;
  added_at: number;  // Unix 时间戳（秒）
  current_price?: number;
  price_change?: number;
}

export default function WatchlistPage() {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [filteredList, setFilteredList] = useState<Watchlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterGroup, setFilterGroup] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [groups, setGroups] = useState<string[]>([]);

  // 编辑相关状态
  const [editingItem, setEditingItem] = useState<Watchlist | null>(null);
  const [editForm, setEditForm] = useState({
    reference_price: '',
    threshold: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let filtered = watchlists;

    if (filterGroup !== 'all') {
      filtered = filtered.filter(w => w.group_name === filterGroup);
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(w => w.type === filterType);
    }

    setFilteredList(filtered);
  }, [watchlists, filterGroup, filterType]);

  const loadData = async () => {
    try {
      const res = await fetch('/api/watchlist');
      const data = await res.json();

      if (data.success) {
        setWatchlists(data.data);

        // 提取唯一的群组名称
        const uniqueGroups = Array.from(new Set(data.data.map((w: Watchlist) => w.group_name).filter(Boolean)));
        setGroups(uniqueGroups as string[]);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个关注标的吗?')) {
      return;
    }

    try {
      const res = await fetch(`/api/watchlist?id=${id}`, {
        method: 'DELETE'
      });

      const data = await res.json();

      if (data.success) {
        alert('删除成功');
        loadData();
      } else {
        alert('删除失败: ' + data.message);
      }
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败,请稍后重试');
    }
  };

  const handleEdit = (item: Watchlist) => {
    setEditingItem(item);
    setEditForm({
      reference_price: item.reference_price.toString(),
      threshold: item.threshold.toString()
    });
  };

  const handleEditSubmit = async () => {
    if (!editingItem) return;

    const referencePrice = parseFloat(editForm.reference_price);
    const threshold = parseFloat(editForm.threshold);

    // 验证输入
    if (isNaN(referencePrice) || referencePrice <= 0) {
      alert('请输入有效的参考价格');
      return;
    }

    if (isNaN(threshold) || threshold <= 0 || threshold > 100) {
      alert('请输入有效的阈值 (0-100)');
      return;
    }

    try {
      const res = await fetch('/api/watchlist', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingItem.id,
          reference_price: referencePrice,
          price_threshold: threshold
        })
      });

      const data = await res.json();

      if (data.success) {
        alert('更新成功');
        setEditingItem(null);
        loadData();
      } else {
        alert('更新失败: ' + data.message);
      }
    } catch (error) {
      console.error('更新失败:', error);
      alert('更新失败,请稍后重试');
    }
  };

  const handleEditCancel = () => {
    setEditingItem(null);
    setEditForm({
      reference_price: '',
      threshold: ''
    });
  };

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'spot':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'futures':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'alpha':
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'spot':
        return '现货';
      case 'futures':
        return '合约';
      case 'alpha':
        return 'Alpha';
      default:
        return type;
    }
  };

  const formatPrice = (price?: number) => {
    if (price === null || price === undefined) return '-';
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}`;
  };

  const formatChange = (change?: number) => {
    if (change === null || change === undefined) return '-';
    const sign = change >= 0 ? '+' : '';
    const color = change >= 0 ? 'text-green-600' : 'text-red-600';
    return <span className={`font-semibold ${color}`}>{sign}{change.toFixed(2)}%</span>;
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
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">关注列表</h1>
          <p className="text-gray-600">查看和管理所有群组的关注标的</p>
        </div>

        {/* 筛选栏 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-5 flex items-center gap-4">
          <span className="text-sm font-medium text-gray-600">筛选群组:</span>
          <select
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100"
          >
            <option value="all">全部群组</option>
            {groups.map(group => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>

          <span className="text-sm font-medium text-gray-600 ml-4">筛选类型:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100"
          >
            <option value="all">全部类型</option>
            <option value="spot">现货</option>
            <option value="futures">合约</option>
            <option value="alpha">Alpha</option>
          </select>
        </div>

        {/* 关注列表 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="text-lg font-semibold text-gray-900">⭐ 关注的标的</div>
            <div className="text-sm text-gray-600 mt-1">共 {filteredList.length} 个标的</div>
          </div>

          {filteredList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">标的</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">类型</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">参考价格</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">当前价格</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">变动</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">阈值</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">所属群组</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">添加时间</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((item, index) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-gray-50 ${index !== filteredList.length - 1 ? 'border-b border-gray-200' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{item.symbol}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getTypeBadgeClass(item.type)}`}>
                          {getTypeLabel(item.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-mono text-sm text-gray-900">{formatPrice(item.reference_price)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-mono text-sm text-gray-900">{formatPrice(item.current_price)}</div>
                      </td>
                      <td className="px-6 py-4">{formatChange(item.price_change)}</td>
                      <td className="px-6 py-4 text-gray-900">{item.threshold}%</td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-3 py-1 bg-gray-100 border border-gray-200 rounded-lg text-xs text-gray-700">
                          {item.group_name || '未知群组'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatTimestamp(item.added_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm font-medium rounded-lg transition-colors"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
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
              <div className="text-6xl mb-4">⭐</div>
              <div className="text-lg font-semibold text-gray-900 mb-2">暂无关注标的</div>
              <div className="text-sm text-gray-600">群组还没有添加任何关注标的</div>
            </div>
          )}
        </div>

        {/* 编辑模态框 */}
        {editingItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">编辑关注标的</h2>
                <p className="text-sm text-gray-600 mt-1">标的: {editingItem.symbol}</p>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    参考价格
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={editForm.reference_price}
                    onChange={(e) => setEditForm({ ...editForm, reference_price: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100"
                    placeholder="输入参考价格"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    价格阈值 (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={editForm.threshold}
                    onChange={(e) => setEditForm({ ...editForm, threshold: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100"
                    placeholder="输入阈值 (0-100)"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={handleEditCancel}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleEditSubmit}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg transition-colors"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}