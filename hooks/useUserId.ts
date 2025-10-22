
import { useState, useEffect } from 'react';

const USER_ID_KEY = 'golf-swing-user-id';

export const useUserId = (): string | null => {
    const [userId, setUserId] = useState<string | null>(() => {
        try {
            return window.localStorage.getItem(USER_ID_KEY);
        } catch {
            return null;
        }
    });

    useEffect(() => {
        if (!userId) {
            const newUserId = crypto.randomUUID();
            try {
                window.localStorage.setItem(USER_ID_KEY, newUserId);
                setUserId(newUserId);
            } catch (error) {
                console.error("Failed to save user ID:", error);
            }
        }
    }, [userId]);

    return userId;
};
