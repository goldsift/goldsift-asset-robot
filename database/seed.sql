-- 初始化配置表数据
INSERT OR IGNORE INTO config (key, value, description, is_sensitive, is_editable) VALUES
  ('bot_token', '', 'Telegram机器人Token', 1, 1),
  ('price_threshold', '5', '默认价格变动阈值（百分比）', 0, 1),
  ('check_interval', '60', '价格检查间隔（秒）', 0, 1),
  ('alert_interval', '1800', '价格提醒间隔（秒，默认30分钟）', 0, 1),
  ('binance_api_url', 'https://api.binance.com', 'Binance API地址', 0, 1),
  ('openai_api_url', 'https://api.openai.com/v1', 'OpenAI API地址 (/ 结尾忽略 v1, # 结尾强制使用输入地址)', 0, 1),
  ('openai_api_key', '', 'OpenAI API Key', 1, 1),
  ('openai_model', 'gpt-4o-mini', 'OpenAI 模型名称', 0, 1),
  ('system_initialized', 'true', '系统是否已初始化', 0, 0);

-- 初始化管理员数据（默认密码: admin123）
INSERT OR IGNORE INTO admins (username, password) VALUES
  ('admin', '$2b$10$29fx68vvOwMTZrggLZ/3C.vWGKreXJTmYLWlQCIBDJxoxjKQFjvSq');