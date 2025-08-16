import type { APIRoute } from 'astro';
import { Pool } from 'pg';

export const GET: APIRoute = async () => {
    try {
        const pool = new Pool({
            connectionString: `postgresql://${process.env.POSTGRES_USER || 'postgres'}:${process.env.POSTGRES_PASSWORD || 'pgsql+74'}@${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || '5432'}/${process.env.POSTGRES_DB || 'pgastro'}`,
        });

        const result = await pool.query(`
            SELECT id, email, name, role, "emailVerified", "createdAt"
            FROM "user"
            ORDER BY "createdAt" DESC
            LIMIT 20
        `);

        await pool.end();

        return new Response(JSON.stringify({
            success: true,
            users: result.rows,
            count: result.rows.length
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erreur liste users:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
