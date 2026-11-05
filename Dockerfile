
FROM python:3.12-slim

# Рабочая папка внутри контейнера
WORKDIR /app

# Отключаем создание pyc-файлов
ENV PYTHONDONTWRITEBYTECODE=1

# Вывод логов сразу в терминал
ENV PYTHONUNBUFFERED=1

# Устанавливаем зависимости
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --default-timeout=300 --retries=10 -r requirements.txt

# Копируем проект
COPY backend/ /app/backend/
COPY frontend/ /app/frontend/

# Переходим в папку Django
WORKDIR /app/backend

# Открываем порт Django
EXPOSE 8000

# Запускаем сервер
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
