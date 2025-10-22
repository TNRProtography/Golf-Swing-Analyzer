
import type { SwingData } from '../types';

const API_BASE = '/api';

export const fetchSwingsFromCloud = async (userId: string): Promise<SwingData[]> => {
    const response = await fetch(`${API_BASE}/swings`, {
        headers: {
            'X-User-Id': userId,
        },
    });
    if (!response.ok) {
        throw new Error('Failed to fetch swings from cloud');
    }
    return response.json();
};

export const saveSwingToCloud = async (userId: string, swing: SwingData): Promise<SwingData> => {
    const response = await fetch(`${API_BASE}/swings`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-User-Id': userId,
        },
        body: JSON.stringify(swing),
    });
    if (!response.ok) {
        throw new Error('Failed to save swing to cloud');
    }
    return response.json();
};
