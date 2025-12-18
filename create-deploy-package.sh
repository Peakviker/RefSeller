#!/bin/bash

# Создание готового пакета для деплоя
# Включает все необходимое для ручного деплоя

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="$SCRIPT_DIR/template/web/build"
BACKEND_DIR="$SCRIPT_DIR/template/backend"

echo "📦 Создание пакета для деплоя"
echo "=============================="
echo ""

# Создаем директорию для пакета
PACKAGE_DIR="$SCRIPT_DIR/deploy-package"
rm -rf "$PACKAGE_DIR"
mkdir -p "$PACKAGE_DIR"

# Копируем фронтенд
echo "📦 Упаковка фронтенда..."
if [ -d "$BUILD_DIR" ]; then
    cp -r "$BUILD_DIR" "$PACKAGE_DIR/frontend"
    echo "✅ Фронтенд упакован ($(du -sh $PACKAGE_DIR/frontend | cut -f1))"
else
    echo "❌ Build не найден, запускаю сборку..."
    cd "$SCRIPT_DIR/template/web"
    CI=false npm run build
    cp -r build "$PACKAGE_DIR/frontend"
    echo "✅ Фронтенд собран и упакован"
fi

# Копируем backend файлы
echo "📦 Упаковка backend..."
mkdir -p "$PACKAGE_DIR/backend/src/http"
cp "$BACKEND_DIR/src/http/Api.js" "$PACKAGE_DIR/backend/src/http/Api.js"
echo "✅ Backend файлы упакованы"

# Создаем инструкцию
cat > "$PACKAGE_DIR/DEPLOY-README.txt" << 'EOF'
ИНСТРУКЦИЯ ПО ДЕПЛОЮ
====================

1. ФРОНТЕНД:
   - Загрузите все файлы из папки frontend/ в public_html/ на сервере
   - Или через rsync: rsync -avz frontend/ user@host:/path/to/public_html/

2. BACKEND:
   - Скопируйте backend/src/http/Api.js на сервер
   - Замените существующий файл: /path/to/backend/src/http/Api.js
   - Перезапустите backend: pm2 restart telegram-bot

3. ПРОВЕРКА:
   - Откройте https://telegramwebapp.webtm.ru/
   - Проверьте работу приложения

АВТОМАТИЧЕСКИЙ ДЕПЛОЙ:
---------------------
Если у вас есть SSH доступ, используйте скрипты из корня проекта:
  - deploy-to-server.sh
  - FIX-SERVER-NOW.sh
EOF

echo "✅ Инструкция создана"

# Создаем архив
echo "📦 Создание архива..."
cd "$SCRIPT_DIR"
tar -czf deploy-package.tar.gz -C deploy-package .
echo "✅ Архив создан: deploy-package.tar.gz ($(du -sh deploy-package.tar.gz | cut -f1))"

echo ""
echo "✅ Пакет готов!"
echo ""
echo "📁 Расположение:"
echo "   Директория: $PACKAGE_DIR"
echo "   Архив: $SCRIPT_DIR/deploy-package.tar.gz"
echo ""
echo "📝 Следующие шаги:"
echo "   1. Загрузите deploy-package.tar.gz на сервер"
echo "   2. Распакуйте: tar -xzf deploy-package.tar.gz"
echo "   3. Следуйте инструкциям в DEPLOY-README.txt"
echo ""



