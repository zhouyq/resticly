# Resticly 技术设计文档

## 1. 系统架构

Resticly 是一个基于 Web 的 Restic 备份管理工具，提供用户友好的界面来管理多个备份仓库、执行备份操作、查看快照以及设置自动备份计划。该系统采用前后端分离的架构，使用 Flask 作为后端框架，Bootstrap 5 作为前端 UI 框架。

### 1.1 架构概览

```
┌───────────────┐      ┌────────────────┐      ┌─────────────────┐
│  Web 浏览器    │ <--> │ Flask 应用服务  │ <--> │ PostgreSQL 数据库 │
└───────────────┘      └────────────────┘      └─────────────────┘
                             │
                             v
                      ┌────────────────┐
                      │ Restic CLI 工具 │
                      └────────────────┘
```

### 1.2 技术栈

**后端：**
- Flask 框架
- SQLAlchemy ORM
- PostgreSQL 数据库
- APScheduler 任务调度
- Restic 命令行工具

**前端：**
- Bootstrap 5 UI 框架
- JavaScript (原生)
- Chart.js 图表库
- Bootstrap Icons 图标库

## 2. 核心组件

### 2.1 数据模型

系统包含以下主要数据模型：

#### Repository（仓库）
- 存储和管理 Restic 备份仓库的信息
- 字段：id, name, location, password, created_at, last_check, status
- 关联：backups, snapshots, scheduled_tasks

#### Backup（备份）
- 存储备份操作的信息和结果
- 字段：id, repository_id, source_path, start_time, end_time, status, message, files_new, files_changed, bytes_added, snapshot_id
- 关联：repository

#### Snapshot（快照）
- 存储仓库中快照的元数据
- 字段：id, repository_id, snapshot_id, created_at, hostname, paths, tags, size
- 关联：repository

#### ScheduledTask（计划任务）
- 存储自动备份计划信息
- 字段：id, repository_id, name, source_path, schedule_type, cron_expression, interval_seconds, enabled, last_run, next_run, created_at, tags
- 关联：repository

#### Settings（设置）
- 存储应用程序全局设置
- 字段：id, key, value, updated_at

### 2.2 应用模块

系统分为以下主要模块：

#### app.py
- 应用程序入口点
- 配置 Flask 应用和数据库连接
- 初始化应用上下文

#### models.py
- 定义数据模型和关系
- 使用 SQLAlchemy ORM 实现数据访问层

#### routes.py
- 定义所有 Web 路由和 API 端点
- 处理 HTTP 请求并返回响应

#### restic_wrapper.py
- 封装 Restic 命令行工具的调用
- 提供统一的接口执行备份操作

#### scheduler.py
- 管理定时任务和自动备份
- 使用 APScheduler 实现可靠的任务调度

### 2.3 前端架构

前端采用模块化结构，主要组件包括：

#### 核心模块
- main.js：应用程序入口，初始化和公共功能
- i18n.js：国际化支持，管理语言翻译
- theme.js：主题管理，支持暗色/亮色模式切换

#### 功能模块
- dashboard.js：仪表盘页面逻辑和图表初始化
- repositories.js：仓库管理功能
- backups.js：备份操作功能
- snapshots.js：快照管理功能
- scheduler.js：计划任务管理功能

## 3. API 设计

系统提供 RESTful API 用于前后端交互。主要 API 端点包括：

### 3.1 仓库管理 API

| 端点 | 方法 | 描述 |
|------|------|------|
| /api/repositories | GET | 获取所有仓库列表 |
| /api/repositories | POST | 创建新仓库 |
| /api/repositories/{id} | GET | 获取单个仓库详情 |
| /api/repositories/{id} | DELETE | 删除仓库 |
| /api/repositories/{id}/check | POST | 检查仓库健康状况 |

### 3.2 备份管理 API

| 端点 | 方法 | 描述 |
|------|------|------|
| /api/backups | GET | 获取所有备份列表 |
| /api/backups | POST | 创建新备份 |
| /api/backups/{id} | GET | 获取单个备份详情 |

### 3.3 快照管理 API

| 端点 | 方法 | 描述 |
|------|------|------|
| /api/snapshots | GET | 获取所有快照列表 |
| /api/repositories/{id}/snapshots/sync | POST | 同步仓库中的快照 |

### 3.4 计划任务 API

| 端点 | 方法 | 描述 |
|------|------|------|
| /api/scheduled-tasks | GET | 获取所有计划任务列表 |
| /api/scheduled-tasks | POST | 创建新计划任务 |
| /api/scheduled-tasks/{id} | PUT | 更新计划任务 |
| /api/scheduled-tasks/{id} | DELETE | 删除计划任务 |

### 3.5 设置 API

| 端点 | 方法 | 描述 |
|------|------|------|
| /api/settings | GET | 获取所有设置 |
| /api/settings | POST | 更新设置 |

## 4. 前端界面设计

### 4.1 页面结构

系统包含以下主要页面：

- Dashboard：仪表盘，显示概览信息和统计数据
- Repositories：仓库管理页面
- Backups：备份操作页面
- Snapshots：快照管理页面
- Scheduler：计划任务管理页面
- Settings：应用设置页面

### 4.2 UI 组件

系统使用以下主要 UI 组件：

- 导航栏：顶部导航栏，提供主要功能入口
- 卡片：使用卡片组件展示分组信息
- 表格：使用表格展示列表数据
- 图表：使用 Chart.js 展示统计数据和趋势
- 模态框：用于创建和编辑对象
- 表单：用于数据输入和验证
- 状态徽章：用于显示状态信息
- 通知提示：用于操作反馈

### 4.3 国际化支持

系统支持多语言界面，包括：

- 英语 (en)
- 中文 (zh)

通过 i18n.js 模块实现，使用 JSON 文件存储翻译字符串。

### 4.4 主题支持

系统支持两种主题模式：

- 暗色主题（默认）
- 亮色主题

通过 theme.js 模块实现，支持手动切换和根据系统偏好自动设置。

## 5. 安全性设计

### 5.1 密码安全

仓库密码采用以下方式保护：

- 密码在数据库中以明文存储，但仅限于应用内部访问
- API 接口不会返回密码信息

### 5.2 错误处理

系统采用全面的错误处理策略：

- 服务器端错误日志记录
- 客户端友好的错误提示
- API 错误统一格式返回

## 6. 部署架构

### 6.1 生产环境部署

推荐的部署架构：

```
┌───────────────┐      ┌───────────────┐      ┌──────────────────┐
│ Nginx 反向代理 │ <--> │ Gunicorn 服务  │ <--> │ PostgreSQL 数据库 │
└───────────────┘      └───────────────┘      └──────────────────┘
```

### 6.2 配置管理

系统配置通过以下方式管理：

- 环境变量：DATABASE_URL, SESSION_SECRET 等
- 应用内设置：通过 Settings 表存储和管理

## 7. 扩展性考虑

为未来功能扩展预留的设计：

- 模块化架构便于添加新功能
- 数据模型设计考虑未来扩展字段
- 前端组件化设计便于重用和扩展
- API 版本控制为未来版本升级做准备

## 8. 测试策略

建议的测试方法：

- 单元测试：测试各模块独立功能
- 集成测试：测试模块间交互
- UI 测试：测试前端界面功能
- 负载测试：测试系统在高负载下的性能