/**
 * 群组白名单管理API
 */

import { NextResponse } from 'next/server';
import { GroupService } from '@/services/group.service';
import { getDatabase } from '@/lib/database';

// GET - 获取所有白名单群组
export async function GET() {
  try {
    const groups = GroupService.getAllGroups();
    const db = getDatabase();

    // 为每个群组添加关注标的数量
    const groupsWithCount = groups.map(group => {
      const countStmt = db.prepare('SELECT COUNT(*) as count FROM watchlists WHERE group_id = ?');
      const result = countStmt.get(group.group_id) as { count: number };

      return {
        ...group,
        watchlist_count: result.count
      };
    });

    return NextResponse.json({
      success: true,
      data: groupsWithCount,
    });
  } catch (error) {
    console.error('获取群组列表失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取群组列表失败',
      },
      { status: 500 }
    );
  }
}

// POST - 添加群组到白名单
export async function POST(request: Request) {
  try {
    const { groupId, groupName } = await request.json();

    if (!groupId || !groupName) {
      return NextResponse.json(
        {
          success: false,
          error: '群组ID和名称不能为空',
        },
        { status: 400 }
      );
    }

    const success = GroupService.addGroup({
      group_id: groupId,
      group_name: groupName,
      description: '手动添加',
      is_active: 1, // 手动添加默认启用
    });

    if (success) {
      console.log(`群组已添加到白名单: ${groupName} (${groupId})`);
      return NextResponse.json({
        success: true,
        message: '群组已添加到白名单',
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: '添加群组失败，可能已存在',
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('添加群组失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '添加群组失败',
      },
      { status: 500 }
    );
  }
}

// PUT - 更新群组状态
export async function PUT(request: Request) {
  try {
    const { groupId, isActive } = await request.json();

    if (!groupId || isActive === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: '参数不完整',
        },
        { status: 400 }
      );
    }

    const success = GroupService.updateGroupStatus(groupId, isActive);

    if (success) {
      console.log(`群组状态已更新: ${groupId} -> ${isActive ? '启用' : '禁用'}`);
      return NextResponse.json({
        success: true,
        message: '群组状态已更新',
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: '更新失败',
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('更新群组状态失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '更新群组状态失败',
      },
      { status: 500 }
    );
  }
}

// DELETE - 从白名单移除群组
export async function DELETE(request: Request) {
  try {
    const { groupId } = await request.json();

    if (!groupId) {
      return NextResponse.json(
        {
          success: false,
          error: '群组ID不能为空',
        },
        { status: 400 }
      );
    }

    const success = GroupService.removeGroup(groupId);

    if (success) {
      console.log(`群组已从白名单移除: ${groupId}`);
      return NextResponse.json({
        success: true,
        message: '群组已从白名单移除',
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: '移除群组失败',
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('移除群组失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '移除群组失败',
      },
      { status: 500 }
    );
  }
}