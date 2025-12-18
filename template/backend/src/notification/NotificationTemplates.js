/**
 * Notification message templates with Markdown formatting
 * @module NotificationTemplates
 */

export const TEMPLATES = {
  /**
   * Purchase completion notification
   * @param {Object} data - Purchase data
   * @param {number} data.amount - Purchase amount
   * @param {string} data.currency - Currency code
   * @param {string} data.productName - Product name
   * @param {string} data.purchaseDate - ISO date string
   */
  purchase: (data) => `
🎉 *Покупка успешно завершена!*

💰 Сумма: ${data.amount} ${data.currency}
📦 Товар: ${data.productName}
📅 ${new Date(data.purchaseDate).toLocaleString('ru-RU')}

Спасибо за покупку! 🙏
  `.trim(),

  /**
   * New referral registration notification
   * @param {Object} data - Referral data
   * @param {string} data.referralUsername - Referral's username
   * @param {string} data.referralFirstName - Referral's first name
   * @param {string} data.registrationDate - ISO date string
   * @param {number} data.totalReferrals - Total number of referrals
   */
  referralRegistered: (data) => `
👥 *Новый реферал зарегистрировался!*

${data.referralUsername ? `@${data.referralUsername}` : data.referralFirstName}
📅 ${new Date(data.registrationDate).toLocaleString('ru-RU')}

Ваших рефералов: *${data.totalReferrals}* 🎯
  `.trim(),

  /**
   * Referral purchase notification
   * @param {Object} data - Purchase data
   * @param {string} data.referralUsername - Referral's username
   * @param {number} data.purchaseAmount - Purchase amount
   * @param {string} data.currency - Currency code
   * @param {number} data.expectedReward - Expected reward amount
   * @param {number} data.rewardPercentage - Reward percentage
   */
  referralPurchase: (data) => `
🛍 *Ваш реферал совершил покупку!*

Реферал: ${data.referralUsername ? `@${data.referralUsername}` : 'Пользователь'}
💰 Сумма покупки: ${data.purchaseAmount} ${data.currency}

💎 Ваше вознаграждение: *${data.expectedReward} ${data.currency}* (${data.rewardPercentage}%)
  `.trim(),

  /**
   * Income credited notification
   * @param {Object} data - Income data
   * @param {number} data.amount - Credited amount
   * @param {string} data.currency - Currency code
   * @param {string} data.fromReferralUsername - Source referral username
   * @param {number} data.referralLevel - Referral level (1 or 2)
   * @param {number} data.newBalance - New total balance
   */
  incomeCredited: (data) => `
💰 *Доход начислен!*

➕ Начислено: *${data.amount} ${data.currency}*
От реферала: ${data.fromReferralUsername ? `@${data.fromReferralUsername}` : 'Пользователь'}
Уровень: ${data.referralLevel}

💵 Ваш баланс: *${data.newBalance} ${data.currency}*
  `.trim()
};

/**
 * Get template by type
 * @param {string} type - Notification type
 * @returns {Function|null} Template function or null if not found
 */
export function getTemplate(type) {
  return TEMPLATES[type] || null;
}

/**
 * Render notification message
 * @param {string} type - Notification type
 * @param {Object} data - Template data
 * @returns {string} Rendered message
 * @throws {Error} If template not found
 */
export function renderNotification(type, data) {
  const template = getTemplate(type);
  if (!template) {
    throw new Error(`Template not found for type: ${type}`);
  }
  return template(data);
}





