#!/bin/bash

# Скрипт финального деплоя бэкенда и фронтенда на сервер
# Использует SSH данные из .env файла

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/template/backend"
WEB_DIR="$SCRIPT_DIR/template/web"
BUILD_DIR="$WEB_DIR/build"

# Загружаем SSH данные из .env файла
ENV_FILE="$BACKEND_DIR/.env"
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Файл .env не найден: $ENV_FILE"
    exit 1
fi

SSH_HOST=$(grep "^SSH=" "$ENV_FILE" | cut -d'=' -f2)
SSH_PASS=$(grep "^ROOT=" "$ENV_FILE" | cut -d'=' -f2)

if [ -z "$SSH_HOST" ]; then
    echo "❌ SSH хост не найден в .env файле (ожидается SSH=...)"
    exit 1
fi

# Пути на сервере
REMOTE_BASE="/root/telegram-mini-app/telegram-mini-app/template"
REMOTE_BACKEND="$REMOTE_BASE/backend"
REMOTE_WEB="$REMOTE_BASE/web"

echo "🚀 Начинаю финальный деплой"
echo "================================"
echo "SSH хост: $SSH_HOST"
echo "Backend: $REMOTE_BACKEND"
echo "Web: $REMOTE_WEB"
echo ""

# Проверка наличия build
if [ ! -d "$BUILD_DIR" ]; then
    echo "❌ Директория build не найдена. Запускаю сборку..."
    cd "$WEB_DIR"
    npm run build
    cd "$SCRIPT_DIR"
fi

if [ ! -d "$BUILD_DIR" ]; then
    echo "❌ Не удалось собрать фронтенд"
    exit 1
fi

echo "✅ Фронтенд собран"

# Функция для выполнения команд через SSH
ssh_exec() {
    if [ -n "$SSH_PASS" ] && command -v sshpass &> /dev/null; then
        sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$SSH_HOST" "$@"
    else
        ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$SSH_HOST" "$@"
    fi
}

# Функция для rsync
rsync_exec() {
    if [ -n "$SSH_PASS" ] && command -v sshpass &> /dev/null; then
        sshpass -p "$SSH_PASS" rsync -avz --delete -e "ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10" "$@"
    else
        rsync -avz --delete -e "ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10" "$@"
    fi
}

# Проверка подключения
echo "🔍 Проверка подключения к серверу..."
if ! ssh_exec "echo 'Connection OK'" &>/dev/null; then
    echo "❌ Не удалось подключиться к серверу"
    exit 1
fi
echo "✅ Подключение установлено"

# 1. Деплой фронтенда (build)
echo ""
echo "📦 Деплой фронтенда..."
ssh_exec "mkdir -p $REMOTE_WEB"
rsync_exec "$BUILD_DIR/" "$SSH_HOST:$REMOTE_WEB/build/"
echo "✅ Фронтенд задеплоен"

# 2. Деплой backend файлов
echo ""
echo "📦 Деплой backend..."
ssh_exec "mkdir -p $REMOTE_BACKEND/src"

# Копируем все исходники backend
rsync_exec \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='*.log' \
    --exclude='logs' \
    --exclude='coverage' \
    --exclude='.env' \
    "$BACKEND_DIR/src/" "$SSH_HOST:$REMOTE_BACKEND/src/"

# Копируем конфигурационные файлы
if [ -f "$BACKEND_DIR/package.json" ]; then
    if [ -n "$SSH_PASS" ] && command -v sshpass &> /dev/null; then
        sshpass -p "$SSH_PASS" scp -o StrictHostKeyChecking=no "$BACKEND_DIR/package.json" "$SSH_HOST:$REMOTE_BACKEND/"
    else
        scp -o StrictHostKeyChecking=no "$BACKEND_DIR/package.json" "$SSH_HOST:$REMOTE_BACKEND/"
    fi
fi
if [ -f "$BACKEND_DIR/ecosystem.config.cjs" ]; then
    if [ -n "$SSH_PASS" ] && command -v sshpass &> /dev/null; then
        sshpass -p "$SSH_PASS" scp -o StrictHostKeyChecking=no "$BACKEND_DIR/ecosystem.config.cjs" "$SSH_HOST:$REMOTE_BACKEND/"
    else
        scp -o StrictHostKeyChecking=no "$BACKEND_DIR/ecosystem.config.cjs" "$SSH_HOST:$REMOTE_BACKEND/"
    fi
fi

echo "✅ Backend файлы задеплоены"

# 3. Установка зависимостей на сервере (если нужно)
echo ""
echo "📦 Проверка зависимостей backend..."
ssh_exec "cd $REMOTE_BACKEND && if [ ! -d node_modules ] || [ package.json -nt node_modules/.npm-install-timestamp 2>/dev/null ]; then npm install && touch node_modules/.npm-install-timestamp || true; fi"

# 4. Перезапуск backend через PM2
echo ""
echo "🔄 Перезапуск backend..."
if ssh_exec "pm2 list | grep -q telegram-bot"; then
    ssh_exec "pm2 restart telegram-bot"
    echo "✅ Backend перезапущен через PM2"
else
    echo "⚠️  Процесс telegram-bot не найден в PM2"
    echo "📝 Попытка запуска через ecosystem.config.cjs..."
    ssh_exec "cd $REMOTE_BACKEND && pm2 start ecosystem.config.cjs || pm2 start src/index.js --name telegram-bot -i 1 --node-args='-r dotenv/config'"
    echo "✅ Backend запущен"
fi

# 5. Проверка статуса
echo ""
echo "📊 Статус процессов PM2:"
ssh_exec "pm2 list | grep telegram-bot"

echo ""
echo "✅ Деплой завершен успешно!"
echo ""
echo "🌐 Проверьте работу приложения:"
echo "   https://telegramwebapp.webtm.ru/"
echo ""


