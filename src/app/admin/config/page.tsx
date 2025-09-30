'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';

interface ConfigItem {
  key: string;
  value: string;
  description: string;
  is_sensitive: number;
  is_editable: number;
}

export default function ConfigPage() {
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();

      if (data.success) {
        // 只显示可编辑的配置项
        const editableConfigs = (data.configs || []).filter((c: ConfigItem) => c.is_editable === 1);
        setConfigs(editableConfigs);
      }
    } catch (error) {
      console.error('加载配置失败:', error);
      alert('加载配置失败，请刷新页面重试');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (config: ConfigItem) => {
    setEditingKey(config.key);
    // 对于敏感字段，编辑时显示原始值
    setEditValue(config.value);
  };

  const handleSave = async (key: string) => {
    if (!editValue.trim()) {
      alert('配置值不能为空');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: editValue })
      });

      const data = await res.json();

      if (data.success) {
        alert('配置更新成功');
        setEditingKey(null);
        loadConfigs();
      } else {
        alert('更新失败: ' + data.message);
      }
    } catch (error) {
      console.error('更新配置失败:', error);
      alert('更新失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingKey(null);
    setEditValue('');
  };

  const getConfigLabel = (key: string): string => {
    const labels: Record<string, string> = {
      'bot_token': '🔑 Bot Token',
      'price_threshold': '📈 默认价格阈值',
      'check_interval': '⏱️ 检查间隔',
      'alert_cooldown': '⏰ 提醒冷却时间',
      'binance_api_url': '🌐 Binance API地址'
    };
    return labels[key] || key;
  };

  const getInputType = (key: string): string => {
    // 所有输入框都用 text 类型，不用 password 类型
    if (key === 'price_threshold' || key === 'check_interval' || key === 'alert_cooldown') return 'number';
    return 'text';
  };

  const formatValue = (config: ConfigItem): string => {
    // 如果是敏感字段且不在编辑状态，显示遮罩
    if (config.is_sensitive === 1 && editingKey !== config.key) {
      return '••••••••••••';
    }

    const { key, value } = config;
    if (key === 'price_threshold') return `${value}%`;
    if (key === 'check_interval') return `${value} 秒`;
    if (key === 'alert_cooldown') return `${value} 秒`;
    return value;
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
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">基础配置</h1>
          <p className="text-gray-600">管理系统的所有配置项</p>
        </div>

        {/* 提示信息 */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex gap-3">
          <div className="text-xl">💡</div>
          <div>
            <div className="font-semibold text-blue-900 text-sm mb-1">配置说明</div>
            <div className="text-sm text-blue-800">
              修改配置后，部分配置项（如 Bot Token）会自动重启机器人以应用新配置。请确保配置正确后再保存。
            </div>
          </div>
        </div>

        {/* 配置列表 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">⚙️ 系统配置</h2>
            <p className="text-sm text-gray-600 mt-1">共 {configs.length} 项配置</p>
          </div>

          <div>
            {configs.map((config, index) => (
              <div
                key={config.key}
                className={`p-6 hover:bg-gray-50 transition-colors ${
                  index !== configs.length - 1 ? 'border-b border-gray-200' : ''
                }`}
              >
                <div className="grid grid-cols-12 gap-4 items-center">
                  {/* 标题和描述 - 5列 */}
                  <div className="col-span-3">
                    <div className="font-semibold text-gray-900 mb-1">{getConfigLabel(config.key)}</div>
                    <div className="text-sm text-gray-600">{config.description}</div>
                  </div>

                  {/* 配置内容 - 7列 */}
                  <div className="col-span-7">
                    {editingKey === config.key ? (
                      <div className="flex gap-2 items-center">
                        <input
                          type={getInputType(config.key)}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100"
                          placeholder={`输入${getConfigLabel(config.key)}`}
                          disabled={saving}
                        />
                        {config.is_sensitive === 1 && (
                          <span className="text-xs text-gray-500 whitespace-nowrap">🔒 敏感</span>
                        )}
                      </div>
                    ) : (
                      <div className="px-4 py-2 bg-gray-50 rounded-lg text-sm font-mono text-gray-900 text-center">
                        {formatValue(config)}
                      </div>
                    )}
                  </div>

                  {/* 按钮 - 2列 */}
                  <div className="col-span-2 flex items-center gap-2 justify-end">
                    {editingKey === config.key ? (
                      <>
                        <button
                          onClick={handleCancel}
                          disabled={saving}
                          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                          取消
                        </button>
                        <button
                          onClick={() => handleSave(config.key)}
                          disabled={saving}
                          className="px-3 py-2 bg-gradient-to-r from-yellow-300 to-yellow-500 text-gray-900 text-sm font-medium rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                        >
                          {saving ? '保存中...' : '保存'}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleEdit(config)}
                        className="px-4 py-2 bg-gradient-to-r from-yellow-300 to-yellow-500 text-gray-900 font-medium rounded-lg hover:shadow-lg transition-all"
                      >
                        编辑
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}