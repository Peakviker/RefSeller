#!/bin/bash

# Скрипт деплоя на Timeweb сервер
# Использование: ./deploy.sh [user@host] [remote_path]

set -e

# Параметры подключения (можно задать через переменные окружения или аргументы)
SSH_HOST="${1:-${DEPLOY_HOST}}"
REMOTE_PATH="${2:-${DEPLOY_PATH}}"

if [ -z "$SSH_HOST" ] || [ -z "$REMOTE_PATH" ]; then
    echo "Использование: $0 [user@host] [remote_path]"
    echo "Или задайте переменные окружения: DEPLOY_HOST и DEPLOY_PATH"
    echo ""
    echo "Пример:"
    echo "  $0 user@example.com /home/user/public_html"
    echo "  или"
    echo "  DEPLOY_HOST=user@example.com DEPLOY_PATH=/home/user/public_html $0"
    exit 1
fi

echo "🚀 Начинаю деплой на Timeweb..."
echo "Хост: $SSH_HOST"
echo "Путь: $REMOTE_PATH"
echo ""

# Проверяем, что build директория существует
if [ ! -d "build" ]; then
    echo "❌ Директория build не найдена. Запустите 'npm run build' сначала."
    exit 1
fi

echo "📦 Загружаю файлы на сервер..."

# Создаем директорию на сервере, если её нет
ssh "$SSH_HOST" "mkdir -p $REMOTE_PATH"

# Копируем файлы через rsync (более эффективно, чем scp)
rsync -avz --delete \
    --exclude='.git' \
    --exclude='node_modules' \
    build/ "$SSH_HOST:$REMOTE_PATH/"

echo ""
echo "✅ Деплой завершен успешно!"
echo "🌐 Приложение доступно по адресу вашего домена"
