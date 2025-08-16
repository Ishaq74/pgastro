import type { APIRoute } from 'astro';
import { auth } from '../../auth';

export const POST: APIRoute = async ({ request }) => {
    try {
        console.log('Initializing Better Auth database...');
        
        // Better Auth should automatically create its tables when needed
        // Let's try to call a simple method to trigger table creation
        try {
            await auth.api.listUsers();
        } catch (error) {
            console.log('Expected error during first initialization:', error);
        }
        
        // Try creating a user to trigger table creation
        const result = await auth.api.signUpEmail({
            body: {
                email: 'init@test.com',
                password: 'Init123456!',
                name: 'Init User'
            }
        });
        
        if (result.user) {
            return new Response(JSON.stringify({
                success: true,
                message: 'Better Auth initialized successfully',
                user: result.user
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            return new Response(JSON.stringify({
                success: false,
                error: result.error?.message || 'Unknown initialization error'
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
    } catch (error) {
        console.error('Better Auth initialization error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};