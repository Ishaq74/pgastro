import type { APIRoute } from 'astro';
import { Pool } from 'pg';
import { auth } from '../../auth';

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { action } = body;

        if (action === 'create-admin') {
            // Créer un admin avec Better Auth puis mettre à jour le rôle
            try {
                // Enhanced error handling and logging
                const result = await auth.api.signUpEmail({
                    body: {
                        email: 'admin@test.com',
                        password: 'admin123456',
                        name: 'Admin Test'
                    }
                });

                if (!result || result.error) {
                    console.error('Error during admin creation:', {
                        error: result?.error,
                        input: { email: 'admin@test.com', name: 'Admin Test' },
                        timestamp: new Date().toISOString()
                    });
                    return new Response(JSON.stringify({
                        success: false,
                        error: result?.error?.message || 'Unknown error during admin creation'
                    }), {
                        status: 500,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                // Update role in the database
                const pool = new Pool({
                    connectionString: `postgresql://${process.env.POSTGRES_USER || 'postgres'}:${process.env.POSTGRES_PASSWORD || 'pgsql+74'}@${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || '5432'}/${process.env.POSTGRES_DB || 'pgastro'}`,
                });

                await pool.query(`
                    UPDATE "user" 
                    SET role = 'admin' 
                    WHERE id = $1
                `, [result.user.id]);

                await pool.end();

                return new Response(JSON.stringify({
                    success: true,
                    message: 'Admin créé: admin@test.com / admin123456',
                    user: { ...result.user, role: 'admin' }
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });

            } catch (error) {
                console.error('Unexpected error during admin creation:', {
                    error,
                    input: { email: 'admin@test.com', name: 'Admin Test' },
                    timestamp: new Date().toISOString()
                });
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Unexpected error occurred'
                }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        if (action === 'create-user') {
            // Créer un utilisateur normal
            try {
                const result = await auth.api.signUpEmail({
                    body: {
                        email: 'user@test.com',
                        password: 'user123456',
                        name: 'User Test'
                    }
                });

                return new Response(JSON.stringify({
                    success: true,
                    message: 'Utilisateur créé: user@test.com / user123456',
                    user: { ...result.user, role: 'user' }
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });

            } catch (error) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Utilisateur existe peut-être déjà'
                }), {
                    status: 400,
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
