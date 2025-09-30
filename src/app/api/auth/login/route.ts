import { NextRequest, NextResponse } from 'next/server';
import { verifyCredentials, createToken } from '@/lib/auth.service';
import { AUTH_COOKIE_NAME, COOKIE_MAX_AGE } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: '请提供用户名和密码' },
        { status: 400 }
      );
    }

    // 验证凭据
    const isValid = await verifyCredentials(username, password);

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: '用户名或密码错误' },
        { status: 401 }
      );
    }

    // 创建 Token
    const token = await createToken(username);

    // 设置 Cookie
    const response = NextResponse.json({
      success: true,
      message: '登录成功',
      data: { username }
    });

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('登录失败:', error);
    return NextResponse.json(
      { success: false, message: '登录失败,请稍后重试' },
      { status: 500 }
    );
  }
}