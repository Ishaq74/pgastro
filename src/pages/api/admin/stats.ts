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

        // Statistiques générales
        const totalUsersResult = await pool.query('SELECT COUNT(*) as count FROM "user"');
        const adminsResult = await pool.query('SELECT COUNT(*) as count FROM "user" WHERE role = \'admin\'');
        const regularUsersResult = await pool.query('SELECT COUNT(*) as count FROM "user" WHERE role = \'user\' OR role IS NULL');

        await pool.end();

        return new Response(JSON.stringify({
            success: true,
            totalUsers: parseInt(totalUsersResult.rows[0].count),
            admins: parseInt(adminsResult.rows[0].count),
            regularUsers: parseInt(regularUsersResult.rows[0].count)
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Erreur inconnue'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
