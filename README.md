# RefSeller - Telegram Mini App

Telegram Mini App для продажи товаров с системой рефералов и push-уведомлений.

## Структура проекта

Проект состоит из двух основных частей:

### Backend (`template/backend/`)
- Node.js с Express
- Telegram Bot API (telegraf)
- Система уведомлений
- Реферальная система
- Интеграция с YooKassa для платежей
- Swagger документация

### Web App (`template/web/`)
- React приложение
- Telegram Mini App API
- Управление товарами
- Реферальная система
- Настройки уведомлений

## Быстрый старт

### Backend

1. Перейдите в `template/backend/`
2. Создайте `.env` файл на основе `.env.example`
3. Установите зависимости: `npm install`
4. Запустите: `npm start`

### Web App

1. Перейдите в `template/web/`
2. Установите зависимости: `npm install`
3. Настройте `API_URL` в `src/logic/server/Variables.js`
4. Запустите: `npm start`

## Деплой

См. инструкции в:
- `template/backend/` - для backend
- `template/web/DEPLOY.md` - для web app

## Лицензия

Apache License 2.0
