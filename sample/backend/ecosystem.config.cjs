module.exports = {
  apps: [{
    name: 'telegram-bot',
    script: 'src/index.js',
    interpreter: 'node',
    node_args: '-r dotenv/config',
    cwd: '/root/telegram-mini-app/telegram-mini-app/sample/backend',
    env: {
      NODE_ENV: 'production',
      DOTENV_CONFIG_PATH: '/root/telegram-mini-app/telegram-mini-app/sample/backend/.env'
    },
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: '/root/.pm2/logs/telegram-bot-error.log',
    out_file: '/root/.pm2/logs/telegram-bot-out.log',
    log_file: '/root/.pm2/logs/telegram-bot-combined.log',
    time: true
  }]
}


