export type AssetType = 'spot' | 'futures' | 'alpha';

export interface BotCommand {
  command: string;
  description: string;
  handler: (msg: any, args: string[]) => Promise<void>;
}