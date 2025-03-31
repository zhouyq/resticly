FROM python:3.11-slim

# 设置工作目录
WORKDIR /app
ARG MIRROR
ENV MIRROR=${MIRROR:-true}

# 设置镜像源
RUN if [ "${MIRROR}" == "true" ]; then \
        sed -i 's/deb.debian.org/mirrors.ustc.edu.cn/g' /etc/apt/sources.list.d/debian.sources; \
    fi

# 安装系统依赖和Restic
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    bzip2 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 下载并安装最新版的Restic
ENV RESTIC_VERSION=0.18.0
RUN curl -L https://github.com/restic/restic/releases/download/v${RESTIC_VERSION}/restic_${RESTIC_VERSION}_linux_amd64.bz2 | bunzip2 > /usr/local/bin/restic \
    && chmod +x /usr/local/bin/restic

# 安装Python依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用程序代码
COPY . .

# 设置环境变量
ENV FLASK_APP=main.py
ENV PYTHONUNBUFFERED=1

# 暴露端口
EXPOSE 5000

# 启动命令
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "main:app"]