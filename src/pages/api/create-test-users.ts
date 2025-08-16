import type { APIRoute } from 'astro';
import { auth } from '../../auth';

export const POST: APIRoute = async ({ request }) => {
    try {
        const { action } = await request.json();

        if (action === 'create-test-user') {
            // Enhanced error handling and logging
            try {
                const result = await auth.api.signUpEmail({
                    body: {
                        email: 'user@test.com',
                        password: 'test123',
                        name: 'Utilisateur Test'
                    }
                });

                if (!result || result.error) {
                    console.error('Error during user creation:', {
                        error: result?.error,
                        input: { email: 'user@test.com', name: 'Utilisateur Test' },
                        timestamp: new Date().toISOString()
                    });
                    return new Response(JSON.stringify({
                        success: false,
                        error: result?.error?.message || 'Unknown error during user creation'
                    }), {
                        status: 500,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                return new Response(JSON.stringify({
                    success: true,
                    message: 'Utilisateur test créé: user@test.com / test123'
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            } catch (error) {
                console.error('Unexpected error during user creation:', error);
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Unexpected error occurred'
                }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        if (action === 'create-admin-user') {
            try {
                // Créer admin avec Better Auth puis mettre à jour le rôle
                const result = await auth.api.signUpEmail({
                    body: {
                        email: 'admin@test.com',
                        password: 'admin123',
                        name: 'Admin Test'
                    }
                });

                if (!result || result.error) {
                    console.error('Error during admin creation:', result?.error);
                    return new Response(JSON.stringify({
                        success: false,
                        error: result?.error?.message || 'Unknown error during admin creation'
                    }), {
                        status: 500,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                return new Response(JSON.stringify({
                    success: true,
                    message: 'Admin test créé: admin@test.com / admin123'
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });

            } catch (error) {
                console.error('Unexpected error:', error);
                return new Response(JSON.stringify({
                    success: false,
                    error: error instanceof Error ? error.message : 'Unexpected error occurred'
                }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        return new Response(JSON.stringify({
            success: false,
            error: 'Action non reconnue'
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erreur:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Erreur inconnue'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
