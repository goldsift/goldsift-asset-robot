export type AssetType = 'spot' | 'futures' | 'alpha';

export interface Watchlist {
  id: number;
  group_id: string;
  symbol: string;
  asset_type: AssetType;
  reference_price: number;
  price_threshold: number;
  created_at: string;
}

export interface Group {
  id: number;
  group_id: string;
  group_name: string;
  created_at: string;
}

export interface BotCommand {
  command: string;
  description: string;
  handler: (msg: any, args: string[]) => Promise<void>;
}