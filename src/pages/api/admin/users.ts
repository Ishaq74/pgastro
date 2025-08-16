import type { APIRoute } from 'astro';
import { Pool } from 'pg';

export const GET: APIRoute = async ({ locals }) => {
    // Vérification de l'authentification et du rôle admin
    if (!locals.user) {
        return new Response(JSON.stringify({ success: false, error: 'Non authentifié' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const userRole = (locals.user as any).role || 'user';
    if (userRole !== 'admin') {
        return new Response(JSON.stringify({ success: false, error: 'Accès admin requis' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const pool = new Pool({
            connectionString: `postgresql://${process.env.POSTGRES_USER || 'postgres'}:${process.env.POSTGRES_PASSWORD || 'pgsql+74'}@${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || '5432'}/${process.env.POSTGRES_DB || 'pgastro'}`,
        });

        const result = await pool.query(`
            SELECT id, name, email, role, "emailVerified", "createdAt"
            FROM "user"
            ORDER BY "createdAt" DESC
        `);

        await pool.end();

        return new Response(JSON.stringify({
            success: true,
            users: result.rows
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Erreur inconnue'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
