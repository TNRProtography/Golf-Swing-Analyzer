// This file handles requests to /api/swings.
// To deploy, place this file in the `functions/api` directory of your Cloudflare Pages project.
// Ensure you have a KV Namespace binding named `SWING_STORAGE` in your project settings.

// FIX: Import types from @cloudflare/workers-types to resolve type errors for KVNamespace and PagesFunction.
// This also correctly types the `request` object, fixing the error with `request.json<any>()`.
import type { KVNamespace, PagesFunction } from '@cloudflare/workers-types';

interface Env {
  SWING_STORAGE: KVNamespace;
}

const handler: PagesFunction<Env> = async (context) => {
    const { request, env } = context;
    const userId = request.headers.get('X-User-Id');

    if (!userId) {
        return new Response(JSON.stringify({ error: 'User ID is required in X-User-Id header' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        if (request.method === 'GET') {
            const swings = await env.SWING_STORAGE.get(userId, 'json');
            return new Response(JSON.stringify(swings || []), {
                headers: { 'Content-Type': 'application/json' },
            });
        }

        if (request.method === 'POST') {
            // FIX: The `request.json()` method from the standard Request type does not accept type arguments. The generic version is specific to environments like Cloudflare Workers, but the type might not be correctly inferred. Removing the type argument resolves the error, and the result is implicitly `any`.
            const newSwing = await request.json();
            if (!newSwing || !newSwing.id) {
                return new Response(JSON.stringify({ error: 'Invalid swing data' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            
            const existingSwings: any[] = (await env.SWING_STORAGE.get(userId, 'json')) || [];
            
            // Add new swing to the front, preventing duplicates
            const updatedSwings = [newSwing, ...existingSwings.filter(s => s.id !== newSwing.id)];

            await env.SWING_STORAGE.put(userId, JSON.stringify(updatedSwings));
            
            return new Response(JSON.stringify(newSwing), {
                status: 201,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        return new Response('Method Not Allowed', { 
            status: 405,
            headers: { 'Allow': 'GET, POST' }
        });

    } catch (e: any) {
        console.error(`Failed to handle request for user ${userId}:`, e.message);
        return new Response(JSON.stringify({ error: 'An internal server error occurred' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

export const onRequest = handler;