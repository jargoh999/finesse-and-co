'use client';

import { useEffect, useState } from 'react';
import { getCurrentUserFromSession } from '@/lib/auth-helper';

export function AutoSaveUserData() {
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const user = getCurrentUserFromSession();
    setCurrentUser(user);
  }, []);

  useEffect(() => {
    if (currentUser?.email) {
      const hasPermission = localStorage.getItem('autoSavePermission') === 'granted';

      if (hasPermission) {
        const saveUserData = async () => {
          try {
            await fetch('/api/user/settings', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                autoSave: true,
                lastSync: new Date().toISOString()
              }),
            });
          } catch (error) {
            console.error('Failed to save user data:', error);
          }
        };

        saveUserData();
      }
    }
  }, [currentUser?.email]);

  return null;
}
