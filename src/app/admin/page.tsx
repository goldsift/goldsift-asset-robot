'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';

interface BotStatus {
  isRunning: boolean;
  message: string;
}

interface Statistics {
  groupCount: number;
  watchlistCount: number;
}

interface Alert {
  id: number;
  watchlist_id: number;
  group_id: string;
  group_name: string;
  symbol: string;
  old_price: number;
  new_price: number;
  change_percent: number;
  message?: string;
  sent_at: string;
}

export default function AdminPage() {
  const [botStatus, setBotStatus] = useState<BotStatus>({ isRunning: false, message: '检查中...' });
  const [stats, setStats] = useState<Statistics>({ groupCount: 0, watchlistCount: 0 });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // 获取机器人状态
      const statusRes = await fetch('/api/bot/status');
      const statusData = await statusRes.json();
      if (statusData.success) {
        setBotStatus({
          isRunning: statusData.data.botRunning,
          message: statusData.data.botRunning ? '机器人运行正常' : '机器人未启动'
        });
      }

      // 获取统计数据
      const groupsRes = await fetch('/api/groups');
      const groupsData = await groupsRes.json();

      if (groupsData.success) {
        setStats({
          groupCount: groupsData.data.length,
          watchlistCount: groupsData.data.reduce((sum: number, g: any) => sum + (g.watchlist_count || 0), 0)
        });
      }

      // 获取最新提醒
      const alertsRes = await fetch('/api/alerts?limit=10');
      const alertsData = await alertsRes.json();
      if (alertsData.success) {
        setAlerts(alertsData.data);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartBot = async () => {
    if (!confirm('确定要启动机器人吗?')) return;

    try {
      const res = await fetch('/api/bot/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' })
      });

      const data = await res.json();
      if (data.success) {
        alert('机器人启动成功');
        loadData();
      } else {
        alert('机器人启动失败: ' + (data.message || data.error || '未知错误'));
        console.error('启动失败详情:', data);
      }
    } catch (error) {
      console.error('启动失败:', error);
      alert('启动失败,请稍后重试');
    }
  };

  const handleStopBot = async () => {
    if (!confirm('确定要停止机器人吗?')) return;

    try {
      const res = await fetch('/api/bot/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' })
      });

      const data = await res.json();
      if (data.success) {
        alert('机器人已停止');
        loadData();
      } else {
        alert('机器人停止失败: ' + data.message);
      }
    } catch (error) {
      console.error('停止失败:', error);
      alert('停止失败,请稍后重试');
    }
  };

  return (
    <AdminLayout>
      <div className="flex-1">
        {/* 页面标题 */}
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">控制台</h1>
          <p className="text-gray-600">欢迎回来,这是您的系统概览</p>
        </div>

        {/* 机器人状态卡片 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-2xl flex items-center justify-center">
                <span className="text-2xl">🤖</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {loading ? '检查中...' : botStatus.isRunning ? '机器人正在运行' : '机器人已停止'}
                </h3>
                <p className="text-sm text-gray-600">{botStatus.message}</p>
                {botStatus.isRunning && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-xs text-green-600 font-medium">运行中</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {botStatus.isRunning ? (
                <button
                  onClick={handleStopBot}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-lg transition-colors"
                >
                  ⏹ 停止机器人
                </button>
              ) : (
                <button
                  onClick={handleStartBot}
                  className="px-4 py-2 bg-gradient-to-r from-green-400 to-green-500 text-white font-medium rounded-lg hover:shadow-lg transition-all"
                >
                  ▶️ 启动机器人
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          {/* 白名单群组 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-600 font-medium">白名单群组</span>
              <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center">
                <span className="text-xl">👥</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">{stats.groupCount}</div>
            <div className="text-xs text-gray-500">已添加的群组数量</div>
          </div>

          {/* 关注标的 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-600 font-medium">关注标的</span>
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <span className="text-xl">⭐</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">{stats.watchlistCount}</div>
            <div className="text-xs text-gray-500">全部群组关注的标的总数</div>
          </div>
        </div>

        {/* 最新提醒模块 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-gray-900">🔔 最新提醒</div>
                <div className="text-sm text-gray-600 mt-1">最近 10 条价格提醒记录</div>
              </div>
            </div>
          </div>

          {alerts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">标的</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">所属群组</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">原价格</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">新价格</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">变动</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">提醒时间</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((alert, index) => (
                    <tr
                      key={alert.id}
                      className={`hover:bg-gray-50 ${index !== alerts.length - 1 ? 'border-b border-gray-200' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{alert.symbol}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-3 py-1 bg-gray-100 border border-gray-200 rounded-lg text-xs text-gray-700">
                          {alert.group_name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-mono text-sm text-gray-900">
                          ${alert.old_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-mono text-sm text-gray-900">
                          ${alert.new_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 font-semibold ${
                          alert.change_percent >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {alert.change_percent >= 0 ? '↗' : '↘'}
                          {alert.change_percent >= 0 ? '+' : ''}{alert.change_percent.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(alert.sent_at).toLocaleString('zh-CN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔔</div>
              <div className="text-lg font-semibold text-gray-900 mb-2">暂无提醒记录</div>
              <div className="text-sm text-gray-600">当价格触发阈值时,这里会显示提醒记录</div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}