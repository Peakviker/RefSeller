# RefSeller - Telegram Mini App

Telegram Mini App для продажи товаров с системой рефералов и push-уведомлений.

## Описание

RefSeller - это полнофункциональное Telegram Mini App, которое позволяет:
- Продавать товары через Telegram
- Управлять реферальной программой
- Отправлять push-уведомления пользователям
- Обрабатывать платежи через YooKassa
- Управлять партнерской программой

## Структура проекта

```
template/
├── backend/          # Backend сервер (Node.js/Express)
│   ├── src/
│   │   ├── http/     # REST API endpoints
│   │   ├── notification/  # Система уведомлений
│   │   ├── referral/      # Реферальная система
│   │   ├── payment/       # Интеграция с YooKassa
│   │   ├── shop/          # Управление товарами
│   │   └── telegram/      # Telegram Bot
│   └── migrations/   # SQL миграции
└── web/              # Frontend приложение (React)
    ├── src/
    │   ├── components/    # React компоненты
    │   ├── screens/      # Экраны приложения
    │   ├── stores/       # State management
    │   └── hooks/        # React hooks
    └── public/        # Статические файлы
```

## Технологический стек

### Backend
- **Node.js** с **Express** - REST API сервер
- **Telegraf** - Telegram Bot API
- **PostgreSQL** - база данных
- **Redis + BullMQ** - очереди и rate limiting
- **Swagger** - API документация
- **Jest** - тестирование

### Frontend
- **React** - UI фреймворк
- **Telegram Mini App API** - интеграция с Telegram
- **React Router** - навигация
- **State Management** - локальные stores

## Быстрый старт

### Требования
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Telegram Bot Token
- YooKassa API ключи (опционально)

### Backend

1. Перейдите в `template/backend/`
2. Скопируйте `.env.example` в `.env` и заполните:
```env
BOT_TOKEN=your_telegram_bot_token
APP_URL=https://your-domain.com
DATABASE_URL=postgresql://user:password@localhost:5432/refseller
REDIS_URL=redis://localhost:6379
YOOKASSA_SHOP_ID=your_shop_id
YOOKASSA_SECRET_KEY=your_secret_key
```

3. Установите зависимости:
```bash
npm install
```

4. Запустите миграции:
```bash
# Примените миграции из папки migrations/
psql -d refseller -f migrations/001_add_notifications.sql
```

5. Запустите сервер:
```bash
npm start
# или для разработки
npm run dev
```

API будет доступен на `http://localhost:3000`
Swagger документация: `http://localhost:3000/api-docs`

### Frontend

1. Перейдите в `template/web/`
2. Установите зависимости:
```bash
npm install
```

3. Настройте `API_URL` в `src/logic/server/Variables.js`:
```javascript
export const API_URL = 'http://localhost:3000';
```

4. Запустите dev сервер:
```bash
npm start
```

5. Для production сборки:
```bash
npm run build
```

## Основные функции

### Система товаров
- Просмотр каталога товаров
- Детальная информация о товаре
- Обработка покупок

### Реферальная система
- Генерация реферальных ссылок
- Отслеживание рефералов
- Начисление бонусов
- Партнерская программа

### Push-уведомления
- Настройка уведомлений
- Отправка уведомлений через Telegram Bot API
- Rate limiting для предотвращения спама
- Шаблоны уведомлений

### Платежи
- Интеграция с YooKassa
- Обработка платежей
- Webhook для уведомлений о платежах

## API Endpoints

Основные endpoints (полный список в Swagger):

- `GET /api/products` - список товаров
- `GET /api/user` - информация о пользователе
- `POST /api/referral/generate` - генерация реферальной ссылки
- `POST /api/notifications/send` - отправка уведомления
- `POST /api/payment/create` - создание платежа

## Деплой

### Backend

См. `template/backend/` для инструкций по деплою. Поддерживается деплой на:
- Render.com
- Heroku
- VPS с PM2 (см. `ecosystem.config.cjs`)

### Frontend

См. `template/web/DEPLOY.md` для инструкций. Поддерживается деплой на:
- Netlify
- Vercel
- Любой статический хостинг

## Разработка

### Запуск тестов
```bash
cd template/backend
npm test
```

### Линтинг
```bash
cd template/backend
npm run lint
```

## Лицензия

Apache License 2.0

## Поддержка

Для вопросов и предложений создавайте Issues в репозитории.
