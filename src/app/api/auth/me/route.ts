import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth.service';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: '未登录' },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Token 无效或已过期' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        username: payload.username
      }
    });
  } catch (error) {
    console.error('验证用户失败:', error);
    return NextResponse.json(
      { success: false, message: '验证失败' },
      { status: 500 }
    );
  }
}