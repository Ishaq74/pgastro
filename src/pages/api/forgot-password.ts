import type { APIRoute } from 'astro';
import { auth } from '../../auth';

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        console.log('Password reset request:', body);
        
        const result = await auth.api.forgetPassword({
            body: {
                email: body.email,
                redirectTo: "http://localhost:4321/reset-password"
            }
        });
        
        console.log('Password reset result:', result);
        
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
            message: "Si cette adresse email existe, vous recevrez un lien de réinitialisation."
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Password reset error:', error);
        return new Response(JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};