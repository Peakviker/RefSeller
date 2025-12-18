import React, { useState, useEffect, useCallback } from 'react';
import { useTelegram } from '../../hooks/useTelegram';
import TelegramScreen from '../../components/kit/Screen/TelegramScreen';
import './NotificationSettings.css';

/**
 * Notification Settings Screen
 * Allows users to enable/disable different types of notifications
 */
export default function NotificationSettings() {
  const { user } = useTelegram();
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const isMountedRef = React.useRef(true);

  const fetchPreferences = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    try {
      if (isMountedRef.current) {
        setLoading(true);
        setError(null);
      }
      
      const response = await fetch(`/api/notifications/preferences?userId=${user.id}`);
      const data = await response.json();

      if (!isMountedRef.current) return;

      if (data.success) {
        setPreferences(data.preferences);
      } else {
        setError(data.error || 'Не удалось загрузить настройки');
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      console.error('Error fetching preferences:', err);
      setError('Ошибка загрузки настроек');
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [user]);

  useEffect(() => {
    isMountedRef.current = true;
    if (user?.id) {
      fetchPreferences();
    }
    return () => {
      isMountedRef.current = false;
    };
  }, [user, fetchPreferences]);

  const togglePreference = async (key) => {
    if (saving || !isMountedRef.current) return;

    const updatedPreferences = {
      ...preferences,
      [key]: !preferences[key]
    };

    // Optimistic update
    if (isMountedRef.current) {
      setPreferences(updatedPreferences);
      setSaving(true);
      setError(null);
    }

    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          ...updatedPreferences
        })
      });

      if (!isMountedRef.current) return;

      const data = await response.json();

      if (!data.success) {
        // Revert on error
        if (isMountedRef.current) {
          setPreferences(preferences);
          setError(data.error || 'Не удалось сохранить настройки');
        }
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      console.error('Error updating preferences:', err);
      // Revert on error
      if (isMountedRef.current) {
        setPreferences(preferences);
        setError('Ошибка сохранения настроек');
      }
    } finally {
      if (isMountedRef.current) {
        setSaving(false);
      }
    }
  };

  if (loading) {
    return (
      <TelegramScreen showbackbutton={true}>
        <div className="notification-settings">
          <div className="loading">Загрузка...</div>
        </div>
      </TelegramScreen>
    );
  }

  return (
    <TelegramScreen showbackbutton={true}>
      <div className="notification-settings">
        <h2 className="settings-title">Настройки уведомлений</h2>
        <p className="settings-description">
          Выберите, какие уведомления вы хотите получать в Telegram
        </p>

        {error && (
          <div className="error-message">
            ⚠️ {String(error)}
          </div>
        )}

        <div className="preferences-list">
          <div className="preference-item">
            <div className="preference-info">
              <div className="preference-icon">🎉</div>
              <div className="preference-text">
                <h3>Уведомления о покупках</h3>
                <p>Получать подтверждение после успешной оплаты</p>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={preferences?.purchaseEnabled ?? true}
                onChange={() => togglePreference('purchaseEnabled')}
                disabled={saving}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="preference-item">
            <div className="preference-info">
              <div className="preference-icon">👥</div>
              <div className="preference-text">
                <h3>Новые рефералы</h3>
                <p>Уведомление при регистрации нового реферала</p>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={preferences?.referralRegisteredEnabled ?? true}
                onChange={() => togglePreference('referralRegisteredEnabled')}
                disabled={saving}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="preference-item">
            <div className="preference-info">
              <div className="preference-icon">🛍</div>
              <div className="preference-text">
                <h3>Покупки рефералов</h3>
                <p>Уведомление когда ваш реферал совершает покупку</p>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={preferences?.referralPurchaseEnabled ?? true}
                onChange={() => togglePreference('referralPurchaseEnabled')}
                disabled={saving}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="preference-item">
            <div className="preference-info">
              <div className="preference-icon">💰</div>
              <div className="preference-text">
                <h3>Начисление дохода</h3>
                <p>Уведомление при зачислении реферального дохода</p>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={preferences?.incomeCreditedEnabled ?? true}
                onChange={() => togglePreference('incomeCreditedEnabled')}
                disabled={saving}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        {saving && (
          <div className="saving-indicator">
            Сохранение...
          </div>
        )}
      </div>
    </TelegramScreen>
  );
}

