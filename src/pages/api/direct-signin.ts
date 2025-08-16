import type { APIRoute } from 'astro';
import { auth } from '../../auth';

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        console.log('Direct signin request:', body);
        
        const result = await auth.api.signInEmail({
            body: {
                email: body.email,
                password: body.password
            }
        });
        
        console.log('Direct signin result:', result);
        
        if (result.error) {
            return new Response(JSON.stringify({
                error: result.error.message
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        return new Response(JSON.stringify({
            success: true,
            user: result.user,
            token: result.token
        }), {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Set-Cookie': result.headers?.['Set-Cookie'] || ''
            }
        });
        
    } catch (error) {
        console.error('Direct signin error:', error);
        return new Response(JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};