FROM python:3.11-slim

# 设置工作目录
WORKDIR /app

# 安装系统依赖和Restic
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    bzip2 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 下载并安装最新版的Restic
RUN curl -L https://github.com/restic/restic/releases/download/v0.16.0/restic_0.16.0_linux_amd64.bz2 | bunzip2 > /usr/local/bin/restic \
    && chmod +x /usr/local/bin/restic

# 安装Python依赖
RUN pip install --no-cache-dir \
    apscheduler==3.10.4 \
    email-validator==2.1.0 \
    flask==3.0.0 \
    flask-sqlalchemy==3.1.1 \
    gunicorn==21.2.0 \
    psycopg2-binary==2.9.9 \
    sqlalchemy==2.0.23

# 复制应用程序代码
COPY . .

# 设置环境变量
ENV FLASK_APP=main.py
ENV PYTHONUNBUFFERED=1

# 暴露端口
EXPOSE 5000

# 启动命令
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "main:app"]