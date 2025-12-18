#!/bin/bash

# Автоматический деплой на сервер
# Пытается определить параметры и выполнить деплой

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="$SCRIPT_DIR/template/web/build"
BACKEND_DIR="$SCRIPT_DIR/template/backend"
PACKAGE_FILE="$SCRIPT_DIR/deploy-package.tar.gz"

echo "🚀 Автоматический деплой на сервер"
echo "==================================="
echo ""

# Проверка пакета
if [ ! -f "$PACKAGE_FILE" ]; then
    echo "📦 Создание пакета..."
    "$SCRIPT_DIR/create-deploy-package.sh"
fi

# Попытка определить параметры из различных источников
DEPLOY_HOST=""
DEPLOY_PATH=""
BACKEND_PATH=""

# 1. Проверка переменных окружения
if [ -n "${DEPLOY_HOST}" ] && [ -n "${DEPLOY_PATH}" ]; then
    echo "✅ Параметры из переменных окружения"
fi

# 2. Проверка файла конфигурации
if [ -f "$SCRIPT_DIR/.deploy-config" ]; then
    source "$SCRIPT_DIR/.deploy-config"
    echo "✅ Параметры из .deploy-config"
fi

# 3. Попытка определить по домену (если сервер локальный)
DOMAIN="telegramwebapp.webtm.ru"

# Если параметры не заданы, пробуем стандартные варианты
if [ -z "$DEPLOY_HOST" ]; then
    # Пробуем определить пользователя из текущей системы
    CURRENT_USER=$(whoami)
    
    # Варианты для Timeweb
    POSSIBLE_HOSTS=(
        "${CURRENT_USER}@${DOMAIN}"
        "root@${DOMAIN}"
        "admin@${DOMAIN}"
    )
    
    echo "🔍 Попытка определить параметры подключения..."
    
    for HOST in "${POSSIBLE_HOSTS[@]}"; do
        echo "   Проверка: $HOST"
        if ssh -o ConnectTimeout=3 -o BatchMode=yes "$HOST" "echo 'OK'" 2>/dev/null; then
            DEPLOY_HOST="$HOST"
            echo "✅ Найден доступный хост: $DEPLOY_HOST"
            break
        fi
    done
fi

# Если хост найден, пробуем определить пути
if [ -n "$DEPLOY_HOST" ]; then
    echo "🔍 Определение путей на сервере..."
    
    # Стандартные пути для Timeweb
    POSSIBLE_PATHS=(
        "/home/$(echo $DEPLOY_HOST | cut -d@ -f1)/public_html"
        "/var/www/html"
        "/var/www/public_html"
        "$(ssh "$DEPLOY_HOST" 'echo $HOME')/public_html"
    )
    
    for TEST_PATH in "${POSSIBLE_PATHS[@]}"; do
        if ssh "$DEPLOY_HOST" "test -d $(dirname $TEST_PATH) 2>/dev/null" 2>/dev/null; then
            DEPLOY_PATH="$TEST_PATH"
            echo "✅ Найден путь: $DEPLOY_PATH"
            break
        fi
    done
    
    # Поиск backend
    POSSIBLE_BACKEND=(
        "$(dirname $DEPLOY_PATH)/backend"
        "/home/$(echo $DEPLOY_HOST | cut -d@ -f1)/backend"
        "$(ssh "$DEPLOY_HOST" 'pm2 list | grep telegram-bot | awk "{print \$NF}" | xargs dirname 2>/dev/null' | head -1)"
    )
    
    for TEST_BACKEND in "${POSSIBLE_BACKEND[@]}"; do
        if [ -n "$TEST_BACKEND" ] && ssh "$DEPLOY_HOST" "test -f $TEST_BACKEND/src/http/Api.js 2>/dev/null" 2>/dev/null; then
            BACKEND_PATH="$TEST_BACKEND"
            echo "✅ Найден backend: $BACKEND_PATH"
            break
        fi
    done
fi

# Если параметры не определены, создаем инструкцию
if [ -z "$DEPLOY_HOST" ] || [ -z "$DEPLOY_PATH" ]; then
    echo ""
    echo "⚠️  Не удалось автоматически определить параметры"
    echo ""
    echo "📝 Создайте файл .deploy-config:"
    echo "   DEPLOY_HOST=user@telegramwebapp.webtm.ru"
    echo "   DEPLOY_PATH=/home/user/public_html"
    echo "   BACKEND_PATH=/home/user/backend"
    echo ""
    echo "Или задайте переменные окружения и запустите снова:"
    echo "   export DEPLOY_HOST=user@host"
    echo "   export DEPLOY_PATH=/path/to/public_html"
    echo "   ./do-deploy.sh"
    echo ""
    exit 1
fi

echo ""
echo "📋 Параметры деплоя:"
echo "   Хост: $DEPLOY_HOST"
echo "   Фронтенд: $DEPLOY_PATH"
[ -n "$BACKEND_PATH" ] && echo "   Backend: $BACKEND_PATH"
echo ""

# Деплой
echo "📤 Начало деплоя..."
echo ""

# 1. Загрузка пакета на сервер
echo "📦 Загрузка пакета на сервер..."
TEMP_DIR="/tmp/deploy-$$"
ssh "$DEPLOY_HOST" "mkdir -p $TEMP_DIR"
scp "$PACKAGE_FILE" "$DEPLOY_HOST:$TEMP_DIR/"

# 2. Распаковка на сервере
echo "📦 Распаковка на сервере..."
ssh "$DEPLOY_HOST" "cd $TEMP_DIR && tar -xzf deploy-package.tar.gz"

# 3. Деплой фронтенда
echo "📤 Деплой фронтенда..."
ssh "$DEPLOY_HOST" "mkdir -p $DEPLOY_PATH"

# Проверяем структуру архива
if ssh "$DEPLOY_HOST" "test -d $TEMP_DIR/deploy-package/frontend" 2>/dev/null; then
    ssh "$DEPLOY_HOST" "rsync -avz --delete $TEMP_DIR/deploy-package/frontend/ $DEPLOY_PATH/"
elif ssh "$DEPLOY_HOST" "test -d $TEMP_DIR/frontend" 2>/dev/null; then
    ssh "$DEPLOY_HOST" "rsync -avz --delete $TEMP_DIR/frontend/ $DEPLOY_PATH/"
else
    # Прямое копирование из build если архив не распаковался правильно
    echo "⚠️  Используем прямой деплой из build..."
    rsync -avz --delete "$BUILD_DIR/" "$DEPLOY_HOST:$DEPLOY_PATH/"
fi

# 4. Обновление backend
if [ -n "$BACKEND_PATH" ]; then
    echo "📤 Обновление backend..."
    ssh "$DEPLOY_HOST" "mkdir -p $BACKEND_PATH/src/http"
    
    # Пробуем разные пути к Api.js в архиве
    if ssh "$DEPLOY_HOST" "test -f $TEMP_DIR/deploy-package/backend/src/http/Api.js" 2>/dev/null; then
        ssh "$DEPLOY_HOST" "cp $TEMP_DIR/deploy-package/backend/src/http/Api.js $BACKEND_PATH/src/http/Api.js"
    elif ssh "$DEPLOY_HOST" "test -f $TEMP_DIR/backend/src/http/Api.js" 2>/dev/null; then
        ssh "$DEPLOY_HOST" "cp $TEMP_DIR/backend/src/http/Api.js $BACKEND_PATH/src/http/Api.js"
    else
        # Прямое копирование
        echo "📤 Прямое копирование Api.js..."
        scp "$BACKEND_DIR/src/http/Api.js" "$DEPLOY_HOST:$BACKEND_PATH/src/http/Api.js"
    fi
    
    echo "🔄 Перезапуск backend..."
    ssh "$DEPLOY_HOST" "cd $BACKEND_PATH && pm2 restart telegram-bot 2>/dev/null || systemctl restart telegram-bot 2>/dev/null || echo '⚠️  Перезапустите backend вручную'"
fi

# 5. Очистка
echo "🧹 Очистка временных файлов..."
ssh "$DEPLOY_HOST" "rm -rf $TEMP_DIR"

echo ""
echo "✅ Деплой завершен успешно!"
echo ""
echo "🌐 Проверьте работу:"
echo "   https://telegramwebapp.webtm.ru/"
echo ""
echo "📝 Проверка:"
echo "   curl -I https://telegramwebapp.webtm.ru/"
echo ""



