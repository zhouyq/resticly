# Resticly

<p align="center">
  <img src="static/img/logo.svg" alt="Resticly Logo" width="200" height="200" />
</p>

<p align="center">
  <b>Manage Restic, Effortlessly</b><br/>
  <i>轻松管理 Restic</i>
</p>

<p align="center">
  <a href="#english">English</a> | <a href="#中文">中文</a>
</p>

---

<a id="english"></a>

## Introduction

Resticly is a web-based management tool for [Restic](https://restic.net/), a fast, secure, and efficient backup program. It provides a user-friendly interface to manage multiple backup repositories, execute backup operations, view snapshots, and schedule automated backup tasks.

## Features

- **Dashboard**: Get an overview of your backup system with statistics and recent activities
- **Repository Management**: Create, check, and manage multiple Restic repositories
- **Backup Operations**: Run backups with a simple interface and track their progress
- **Snapshot Management**: Browse and manage snapshots across repositories
- **Scheduled Backups**: Set up automated backup tasks with flexible scheduling options
- **Dark/Light Theme**: Choose between dark and light interface themes
- **Multilingual Support**: Use the application in English or Chinese

<!-- Screenshots will be added in the future -->

## Technologies

- **Backend**: Flask, SQLAlchemy, PostgreSQL, APScheduler
- **Frontend**: Bootstrap 5, JavaScript, Chart.js
- **Dependencies**: Restic CLI tool

## Installation

### Prerequisites

- Python 3.8 or higher
- PostgreSQL database
- Restic command-line tool installed on the server

### Installation Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/resticly/resticly.git
   cd resticly
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   ```bash
   # Database connection
   export DATABASE_URL="postgresql://user:password@localhost/resticly"
   # Session secret (change this to a secure random string)
   export SESSION_SECRET="your-secret-key"
   ```

5. Initialize the database:
   ```bash
   flask db upgrade
   ```

6. Run the application:
   ```bash
   python main.py
   ```

7. Access the application in your browser at `http://localhost:5000`

### Docker Installation

You can quickly deploy Resticly using Docker and docker-compose:

```bash
# Start with docker-compose (includes PostgreSQL database)
docker-compose up -d

# Access at http://localhost:5000
```

You can also run Resticly using Docker alone (need to provide your own database):

```bash
# Build the Docker image
docker build -t resticly .

# Run the container
docker run -p 5000:5000 \
  -e DATABASE_URL="postgresql://user:password@host/resticly" \
  -e SESSION_SECRET="your-secret-key" \
  resticly
```

Notes:
- When using docker-compose, modify the `SESSION_SECRET` in `docker-compose.yml` to a secure random string
- Volume mounts can be adjusted in `docker-compose.yml` according to your needs

## Deployment

For production deployment, it's recommended to use Gunicorn with a reverse proxy (like Nginx):

```bash
# Install Gunicorn
pip install gunicorn

# Run with Gunicorn
gunicorn --bind 0.0.0.0:5000 --workers 4 main:app
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

<a id="中文"></a>

## 项目介绍

Resticly 是一个基于 Web 的 [Restic](https://restic.net/) 管理工具，Restic 是一款快速、安全、高效的备份程序。Resticly 提供了用户友好的界面，用于管理多个备份仓库、执行备份操作、查看快照以及设置自动备份任务。

## 功能特性

- **仪表盘**：通过统计数据和最近活动获取备份系统概览
- **仓库管理**：创建、检查和管理多个 Restic 仓库
- **备份操作**：通过简单的界面运行备份并跟踪进度
- **快照管理**：浏览和管理跨仓库的快照
- **计划备份**：使用灵活的调度选项设置自动备份任务
- **暗色/亮色主题**：选择暗色或亮色界面主题
- **多语言支持**：使用英语或中文界面

<!-- 未来将添加截图 -->

## 技术栈

- **后端**：Flask, SQLAlchemy, PostgreSQL, APScheduler
- **前端**：Bootstrap 5, JavaScript, Chart.js
- **依赖**：Restic 命令行工具

## 安装部署

### 前提条件

- Python 3.8 或更高版本
- PostgreSQL 数据库
- 服务器上安装了 Restic 命令行工具

### 安装步骤

1. 克隆仓库：
   ```bash
   git clone https://github.com/resticly/resticly.git
   cd resticly
   ```

2. 创建虚拟环境：
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows 系统上使用：venv\Scripts\activate
   ```

3. 安装依赖：
   ```bash
   pip install -r requirements.txt
   ```

4. 设置环境变量：
   ```bash
   # 数据库连接
   export DATABASE_URL="postgresql://user:password@localhost/resticly"
   # 会话密钥（将其更改为安全的随机字符串）
   export SESSION_SECRET="your-secret-key"
   ```

5. 初始化数据库：
   ```bash
   flask db upgrade
   ```

6. 运行应用程序：
   ```bash
   python main.py
   ```

7. 在浏览器中访问 `http://localhost:5000` 打开应用程序

### Docker 安装

您可以使用 Docker 和 docker-compose 快速部署 Resticly：

```bash
# 使用 docker-compose 启动（包含 PostgreSQL 数据库）
docker-compose up -d

# 访问 http://localhost:5000
```

也可以单独使用 Docker 运行 Resticly（需要自行提供数据库）：

```bash
# 构建 Docker 镜像
docker build -t resticly .

# 运行容器
docker run -p 5000:5000 \
  -e DATABASE_URL="postgresql://user:password@host/resticly" \
  -e SESSION_SECRET="your-secret-key" \
  resticly
```

注意：
- 使用 docker-compose 时，请修改 `docker-compose.yml` 中的 `SESSION_SECRET` 为安全的随机字符串
- 配置卷挂载可以根据您的需求在 `docker-compose.yml` 中调整

## 生产环境部署

对于生产环境部署，推荐使用 Gunicorn 配合反向代理（如 Nginx）：

```bash
# 安装 Gunicorn
pip install gunicorn

# 使用 Gunicorn 运行
gunicorn --bind 0.0.0.0:5000 --workers 4 main:app
```

## 贡献

欢迎贡献！请随时提交 Pull Request。

## 许可证

本项目采用 MIT 许可证 - 详情请参阅 LICENSE 文件。