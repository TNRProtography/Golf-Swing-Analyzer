import { GoogleGenAI, Type } from "@google/genai";
import type { PagesFunction } from '@cloudflare/workers-types';

// Types needed for the function, duplicated from the main app
type Club = string;
interface SwingStats {
  ballSpeed: number;
  clubHeadSpeed: number;
  launchAngle: number;
  distance: number;
}
interface TrajectoryPoint {
  x: number;
  y: number;
};

// Gemini Schemas
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
      impactFrameIndex: { type: Type.NUMBER, description: "The 0-based index of the frame from the input sequence that best shows the moment of ball impact." },
    },
    required: ["trajectory", "ballSpeed", "clubHeadSpeed", "launchAngle", "distance", "impactFrameIndex"],
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
    if (!meta || !base64Data) {
        throw new Error('Invalid data URL format');
    }
    const mimeTypePart = meta.split(';')[0];
    const mimeType = mimeTypePart ? mimeTypePart.split(':')[1] : 'application/octet-stream';
    return { inlineData: { mimeType, data: base64Data } };
}

interface Env {
    API_KEY: string;
}

const handler: PagesFunction<Env> = async (context) => {
    const { request, env } = context;

    if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { 
            status: 405,
            headers: { 'Allow': 'POST' }
        });
    }

    let body;
    try {
        // FIX: The `request.json()` method from the standard Request type does not accept type arguments. The generic version is specific to environments like Cloudflare Workers, but the type might not be correctly inferred. Removing the type argument resolves the error, and the result is implicitly `any`.
        body = await request.json();
    } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const { frames, club } = body as { frames: string[], club: Club };

    if (!frames || !club || !Array.isArray(frames) || frames.length === 0) {
        return new Response(JSON.stringify({ error: 'Missing or invalid frames/club in request body' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        const ai = new GoogleGenAI({ apiKey: env.API_KEY });

        // 1. Analyze swing for stats and trajectory
        const analysisImageParts = frames.map(dataUrlToPart);
        const analysisPrompt = `You are an expert golf swing analyzer. Analyze these sequential frames of a golf swing. The user is using a ${club}. Identify the ball's trajectory from impact. Provide the ball's path as an array of normalized {x, y} coordinates, where {x: 0, y: 0} is the top-left and {x: 1, y: 1} is the bottom-right. Also, estimate the key swing metrics. Return your response as a single JSON object, including the 0-based index of the frame showing ball impact.`;
        
        const analysisResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: { parts: [{ text: analysisPrompt }, ...analysisImageParts] },
          config: {
              responseMimeType: "application/json",
              responseSchema: analysisSchema,
          }
        });

        const analysisResult = JSON.parse(analysisResponse.text);
        
        const stats: SwingStats = {
            ballSpeed: analysisResult.ballSpeed,
            clubHeadSpeed: analysisResult.clubHeadSpeed,
            launchAngle: analysisResult.launchAngle,
            distance: analysisResult.distance,
        };
        const trajectory: TrajectoryPoint[] = analysisResult.trajectory;
        const impactFrameUrl = frames[analysisResult.impactFrameIndex];

        // 2. Get coaching tips
        const coachingImagePart = dataUrlToPart(impactFrameUrl);
        const coachingPrompt = `You are an expert golf coach. Based on this image of the golfer's impact position and the following swing data, provide 3 concise, actionable tips for improvement. The golfer is using a ${club} and their stats are: Ball Speed: ${stats.ballSpeed} mph, Club Head Speed: ${stats.clubHeadSpeed} mph, Launch Angle: ${stats.launchAngle} degrees, Carry Distance: ${stats.distance} yards. Focus on common faults that lead to these numbers. Format the tips as a JSON object.`;
    
        const coachingResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: coachingPrompt }, coachingImagePart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: coachingSchema,
            }
        });
        const coachingResult = JSON.parse(coachingResponse.text);
        const tips: string[] = coachingResult.tips;

        const finalResult = {
            stats,
            trajectory,
            tips,
            impactFrameUrl,
        };
        
        return new Response(JSON.stringify(finalResult), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch(e: any) {
        console.error("Gemini API call failed:", e);
        return new Response(JSON.stringify({ error: 'Failed to analyze swing with AI service.', details: e.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

export const onRequest = handler;