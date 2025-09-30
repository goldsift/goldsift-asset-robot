import { NextResponse } from 'next/server';
import { ConfigService } from '@/lib/config.service';

/**
 * GET /api/config
 * 获取所有配置或指定配置
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const keys = searchParams.get('keys');

    if (key) {
      // 获取单个配置
      const value = ConfigService.getConfig(key);
      if (value === null) {
        return NextResponse.json(
          { success: false, message: '配置不存在' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: { key, value } });
    } else if (keys) {
      // 获取多个配置
      const keyArray = keys.split(',').map(k => k.trim());
      const configs = ConfigService.getConfigs(keyArray);
      return NextResponse.json({ success: true, data: configs });
    } else {
      // 获取所有配置（包含原始配置信息）
      const allConfigs = ConfigService.getAllConfigs();
      const configMap: Record<string, string> = {};

      allConfigs.forEach(config => {
        configMap[config.key] = config.value;
      });

      return NextResponse.json({
        success: true,
        data: configMap,
        configs: allConfigs // 包含完整的配置信息（含description）
      });
    }
  } catch (error) {
    console.error('获取配置失败:', error);
    return NextResponse.json(
      { success: false, message: '获取配置失败' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/config
 * 设置配置
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { key, value, description } = body;

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: '缺少必需参数：key 和 value' },
        { status: 400 }
      );
    }

    ConfigService.setConfig(key, String(value), description);

    return NextResponse.json({
      success: true,
      message: '配置更新成功',
      data: { key, value },
    });
  } catch (error) {
    console.error('设置配置失败:', error);
    return NextResponse.json(
      { error: '设置配置失败' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/config
 * 批量更新配置
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: '无效的配置数据' },
        { status: 400 }
      );
    }

    ConfigService.setConfigs(body);

    return NextResponse.json({
      success: true,
      message: '配置批量更新成功',
      count: Object.keys(body).length,
    });
  } catch (error) {
    console.error('批量更新配置失败:', error);
    return NextResponse.json(
      { error: '批量更新配置失败' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/config
 * 删除配置
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { error: '缺少必需参数：key' },
        { status: 400 }
      );
    }

    ConfigService.deleteConfig(key);

    return NextResponse.json({
      success: true,
      message: '配置删除成功',
    });
  } catch (error) {
    console.error('删除配置失败:', error);
    return NextResponse.json(
      { error: '删除配置失败' },
      { status: 500 }
    );
  }
}