import type { APIRoute } from 'astro';
import { auth } from '../../auth';

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        console.log('Direct signup request:', body);
        
        // Try creating user directly with Better Auth API
        const result = await auth.api.signUpEmail({
            body: {
                email: body.email,
                password: body.password,
                name: body.name
            }
        });
        
        console.log('Direct signup result:', result);
        
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
            user: result.user
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Direct signup error:', error);
        return new Response(JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};