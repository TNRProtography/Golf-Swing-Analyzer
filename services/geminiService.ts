
import { GoogleGenAI, Type } from "@google/genai";
import type { SwingStats, TrajectoryPoint, Club } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    trajectory: {
      type: Type.ARRAY,
      description: "Array of normalized {x, y} coordinates of the ball's path. {x:0, y:0} is top-left.",
      items: {
        type: Type.OBJECT,
        properties: {
          x: { type: Type.NUMBER },
          y: { type: Type.NUMBER },
        },
        required: ["x", "y"],
      },
    },
    ballSpeed: { type: Type.NUMBER, description: "Estimated ball speed in mph." },
    clubHeadSpeed: { type: Type.NUMBER, description: "Estimated club head speed in mph." },
    launchAngle: { type: Type.NUMBER, description: "Estimated launch angle in degrees." },
    distance: { type: Type.NUMBER, description: "Estimated carry distance in yards." },
  },
  required: ["trajectory", "ballSpeed", "clubHeadSpeed", "launchAngle", "distance"],
};

const coachingSchema = {
  type: Type.OBJECT,
  properties: {
    tips: {
      type: Type.ARRAY,
      description: "Array of 3 concise, actionable tips for improvement.",
      items: { type: Type.STRING },
    },
  },
  required: ["tips"],
};


const dataUrlToPart = (dataUrl: string) => {
    const [meta, base64Data] = dataUrl.split(',');
    const mimeType = meta.split(';')[0].split(':')[1];
    return { inlineData: { mimeType, data: base64Data } };
}

export const analyzeSwing = async (frames: string[], club: Club): Promise<{ stats: SwingStats, trajectory: TrajectoryPoint[] }> => {
  const imageParts = frames.map(dataUrlToPart);

  const prompt = `You are an expert golf swing analyzer. Analyze these sequential frames of a golf swing. The user is using a ${club}. Identify the ball's trajectory from impact. Provide the ball's path as an array of normalized {x, y} coordinates, where {x: 0, y: 0} is the top-left and {x: 1, y: 1} is the bottom-right. Also, estimate the key swing metrics. Return your response as a single JSON object.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [{ text: prompt }, ...imageParts] },
    config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
    }
  });

  const jsonString = response.text;
  const result = JSON.parse(jsonString);

  return {
    stats: {
      ballSpeed: result.ballSpeed,
      clubHeadSpeed: result.clubHeadSpeed,
      launchAngle: result.launchAngle,
      distance: result.distance,
    },
    trajectory: result.trajectory,
  };
};

export const getCoachingTips = async (stats: SwingStats, club: Club, posterFrame: string): Promise<string[]> => {
    const imagePart = dataUrlToPart(posterFrame);
    const prompt = `You are an expert golf coach. Based on this image of the golfer's impact position and the following swing data, provide 3 concise, actionable tips for improvement. The golfer is using a ${club} and their stats are: Ball Speed: ${stats.ballSpeed} mph, Club Head Speed: ${stats.clubHeadSpeed} mph, Launch Angle: ${stats.launchAngle} degrees, Carry Distance: ${stats.distance} yards. Focus on common faults that lead to these numbers. Format the tips as a JSON object.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: prompt }, imagePart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: coachingSchema,
        }
    });

    const jsonString = response.text;
    const result = JSON.parse(jsonString);
    return result.tips;
};
