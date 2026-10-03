FROM python:3.12-slim
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg ca-certificates wget && wget -q https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/local/bin/yt-dlp && chmod +x /usr/local/bin/yt-dlp && rm -rf /var/lib/apt/lists/*
COPY server.py /app/server.py
WORKDIR /app
CMD ["python3","server.py"]
