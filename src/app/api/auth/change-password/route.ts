import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { AdminService } from '@/lib/admin.service';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth.service';
import { AUTH_COOKIE_NAME, MIN_PASSWORD_LENGTH, BCRYPT_SALT_ROUNDS } from '@/lib/constants';

/**
 * POST /api/auth/change-password
 * 修改管理员密码
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { oldPassword, newPassword } = body;

    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: '请提供旧密码和新密码' },
        { status: 400 }
      );
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { success: false, message: `新密码长度至少为 ${MIN_PASSWORD_LENGTH} 位` },
        { status: 400 }
      );
    }

    // 验证当前用户的登录状态
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: '未登录' },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, message: '登录已过期' },
        { status: 401 }
      );
    }

    // 获取管理员信息
    const admin = AdminService.getAdminByUsername(payload.username);
    if (!admin) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      );
    }

    // 验证旧密码
    const isValidOldPassword = await bcrypt.compare(oldPassword, admin.password);
    if (!isValidOldPassword) {
      return NextResponse.json(
        { success: false, message: '当前密码不正确' },
        { status: 400 }
      );
    }

    // 生成新密码哈希
    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

    // 更新密码
    AdminService.updatePassword(admin.username, hashedPassword);

    // 清除登录状态（需要重新登录）
    cookieStore.delete(AUTH_COOKIE_NAME);

    return NextResponse.json({
      success: true,
      message: '密码修改成功，请重新登录'
    });
  } catch (error) {
    console.error('修改密码失败:', error);
    return NextResponse.json(
      { success: false, message: '修改密码失败，请稍后重试' },
      { status: 500 }
    );
  }
}