// Каталог товаров
export const PRODUCTS = {
    'teddy_reelsmaker': {
        id: 'teddy_reelsmaker',
        name: 'Медвежонок Рилсмейкер',
        description: 'Милый медвежонок, который поможет создавать вирусные рилсы',
        price: 990, // в рублях
        currency: 'RUB',
        image: '🧸',
        type: 'digital' // или 'physical'
    }
}

// Получить товар по ID
export function getProduct(productId) {
    return PRODUCTS[productId] || null
}

// Получить все товары
export function getAllProducts() {
    return Object.values(PRODUCTS)
}

// Проверить существование товара
export function productExists(productId) {
    return productId in PRODUCTS
}









