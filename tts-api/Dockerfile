FROM python:3.12-slim
RUN pip install --no-cache-dir pypinyin==0.53.0
COPY server.py /app/server.py
WORKDIR /app
CMD ["python3","-u","server.py"]
