import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Telegram Mini App API',
      version: '1.0.0',
      description: 'REST API для Telegram Mini App с магазином, реферальной системой и уведомлениями',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: process.env.APP_URL || 'http://localhost:8000',
        description: 'Production server'
      },
      {
        url: 'http://localhost:8000',
        description: 'Development server'
      }
    ],
    tags: [
      {
        name: 'Shop',
        description: 'Магазин товаров'
      },
      {
        name: 'Payment',
        description: 'Платежная система (YooKassa)'
      },
      {
        name: 'Referral',
        description: 'Реферальная система'
      },
      {
        name: 'Notifications',
        description: 'Система уведомлений'
      },
      {
        name: 'Bot',
        description: 'Telegram Bot интеграция'
      }
    ],
    components: {
      schemas: {
        Product: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Уникальный идентификатор товара'
            },
            name: {
              type: 'string',
              description: 'Название товара'
            },
            description: {
              type: 'string',
              description: 'Описание товара'
            },
            price: {
              type: 'number',
              description: 'Цена товара'
            },
            currency: {
              type: 'string',
              description: 'Валюта (RUB, USD, EUR)'
            },
            image: {
              type: 'string',
              description: 'URL изображения товара'
            }
          }
        },
        Payment: {
          type: 'object',
          properties: {
            paymentId: {
              type: 'string',
              description: 'ID платежа в YooKassa'
            },
            confirmationUrl: {
              type: 'string',
              description: 'URL для оплаты'
            },
            status: {
              type: 'string',
              enum: ['pending', 'waiting_for_capture', 'succeeded', 'canceled'],
              description: 'Статус платежа'
            },
            amount: {
              type: 'object',
              properties: {
                value: {
                  type: 'string',
                  description: 'Сумма платежа'
                },
                currency: {
                  type: 'string',
                  description: 'Валюта'
                }
              }
            }
          }
        },
        ReferralStats: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              description: 'ID пользователя'
            },
            username: {
              type: 'string',
              description: 'Username пользователя'
            },
            referralsCount: {
              type: 'integer',
              description: 'Количество рефералов'
            },
            earningsLevel1: {
              type: 'number',
              description: 'Заработок с 1 уровня (30%)'
            },
            earningsLevel2: {
              type: 'number',
              description: 'Заработок со 2 уровня (10%)'
            },
            totalEarnings: {
              type: 'number',
              description: 'Общий заработок'
            },
            referrals: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  userId: { type: 'string' },
                  username: { type: 'string' },
                  joinedAt: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  description: 'Сообщение об ошибке'
                },
                statusCode: {
                  type: 'integer',
                  description: 'HTTP статус код'
                },
                details: {
                  type: 'object',
                  description: 'Дополнительные детали ошибки'
                }
              }
            }
          }
        }
      },
      responses: {
        BadRequest: {
          description: 'Неверные параметры запроса',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        NotFound: {
          description: 'Ресурс не найден',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        ServerError: {
          description: 'Внутренняя ошибка сервера',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        }
      }
    }
  },
  apis: ['./src/http/*.js', './src/swagger/paths/*.yaml']
};

export const swaggerSpec = swaggerJsdoc(options);





