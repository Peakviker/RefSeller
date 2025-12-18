# Инструкция по деплою на Timeweb

## Вариант 1: Через SSH (rsync) - рекомендуется

Используйте скрипт `deploy.sh`:

```bash
cd template/web
./deploy.sh user@your-server.com /home/user/public_html
```

Или через переменные окружения:

```bash
export DEPLOY_HOST="user@your-server.com"
export DEPLOY_PATH="/home/user/public_html"
./deploy.sh
```

## Вариант 2: Через архив (FTP/SFTP)

1. Архив уже создан: `build.tar.gz`
2. Загрузите архив на сервер через FTP/SFTP клиент или веб-интерфейс Timeweb
3. Распакуйте на сервере:
   ```bash
   cd /home/user/public_html
   tar -xzf build.tar.gz
   ```

## Вариант 3: Через scp

```bash
cd template/web
scp -r build/* user@your-server.com:/home/user/public_html/
```

## Вариант 4: Через веб-интерфейс Timeweb

1. Войдите в панель управления Timeweb
2. Откройте файловый менеджер
3. Загрузите все файлы из директории `build/` в `public_html/` вашего домена

## Важно

- Убедитесь, что файл `_redirects` скопирован (для SPA роутинга)
- Проверьте права доступа к файлам (обычно 644 для файлов, 755 для директорий)
- После деплоя очистите кеш браузера (Ctrl+Shift+Delete)
