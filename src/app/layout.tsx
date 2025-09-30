import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "智能标的电报机器人",
  description: "加密货币标的关注和价格提醒系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}