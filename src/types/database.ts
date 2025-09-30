// 数据库表类型定义

export interface Config {
  id: number;
  key: string;
  value: string;
  description?: string;
  is_sensitive: number;  // 是否为敏感字段（0: 否, 1: 是）
  is_editable: number;   // 是否可在前端编辑（0: 否, 1: 是）
  created_at: string;
  updated_at: string;
}

export interface Group {
  id: number;
  group_id: string;
  group_name: string;
  description?: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  user_id: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
  updated_at: string;
}

export type AssetType = 'spot' | 'futures' | 'alpha';

export interface Watchlist {
  id: number;
  group_id: string;
  symbol: string;
  asset_type: AssetType;
  reference_price: number;
  price_threshold?: number;
  last_alert_price?: number;
  last_alert_at?: string;
  added_by: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface PriceHistory {
  id: number;
  symbol: string;
  asset_type: AssetType;
  price: number;
  timestamp: string;
  source: string;
}

export interface AlertHistory {
  id: number;
  watchlist_id: number;
  group_id: string;
  symbol: string;
  old_price: number;
  new_price: number;
  change_percent: number;
  message?: string;
  sent_at: string;
}