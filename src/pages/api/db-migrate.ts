import type { APIRoute } from 'astro';
import { Pool } from 'pg';

export const POST: APIRoute = async ({ request }) => {
    try {
        const pool = new Pool({
            connectionString: `postgresql://${process.env.POSTGRES_USER || 'postgres'}:${process.env.POSTGRES_PASSWORD || 'pgsql+74'}@${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || '5432'}/${process.env.POSTGRES_DB || 'pgastro'}`,
        });

        // Ajouter la colonne role si elle n'existe pas
        await pool.query(`
            ALTER TABLE "user" 
            ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user'
        `);

        // Créer un utilisateur admin de test si il n'existe pas
        const adminCheck = await pool.query(`
            SELECT id FROM "user" WHERE email = 'admin@test.com'
        `);

        if (adminCheck.rows.length === 0) {
            // Le hash correspond à "admin123"
            await pool.query(`
                INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt", role) 
                VALUES (
                    gen_random_uuid()::text,
                    'Admin Test',
                    'admin@test.com',
                    true,
                    NOW(),
                    NOW(),
                    'admin'
                )
            `);
        }

        await pool.end();

        return new Response(JSON.stringify({
            success: true,
            message: 'Migration terminée - Colonne role ajoutée et admin créé'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erreur migration:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Erreur inconnue'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
