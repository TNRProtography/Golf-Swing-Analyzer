import type { Club, SwingData } from '../types';

export type AnalysisPayload = Omit<SwingData, 'id' | 'timestamp' | 'club'>;

export const performSwingAnalysis = async (frames: string[], club: Club): Promise<AnalysisPayload> => {
  const response = await fetch('/api/analyze-swing', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ frames, club }),
  });

  if (!response.ok) {
    let errorMsg = 'Failed to analyze swing.';
    try {
        const errorData = await response.json();
        errorMsg = errorData.error || errorData.details || errorMsg;
    } catch (e) {
        // Ignore if body is not JSON
    }
    throw new Error(errorMsg);
  }

  return response.json();
};
