import type { APIRoute } from 'astro';
import { Pool } from 'pg';

export const PATCH: APIRoute = async ({ request, locals }) => {
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
        const { userId, role } = await request.json();

        if (!userId || !role) {
            return new Response(JSON.stringify({
                success: false,
                error: 'userId et role sont requis'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Validation du rôle
        if (!['user', 'admin'].includes(role)) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Rôle invalide. Utilisez "user" ou "admin"'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const pool = new Pool({
            connectionString: `postgresql://${process.env.POSTGRES_USER || 'postgres'}:${process.env.POSTGRES_PASSWORD || 'pgsql+74'}@${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || '5432'}/${process.env.POSTGRES_DB || 'pgastro'}`,
        });

        // Vérifier que l'utilisateur existe
        const userCheck = await pool.query('SELECT id FROM "user" WHERE id = $1', [userId]);
        if (userCheck.rows.length === 0) {
            await pool.end();
            return new Response(JSON.stringify({
                success: false,
                error: 'Utilisateur non trouvé'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Mettre à jour le rôle
        const result = await pool.query(
            'UPDATE "user" SET role = $1, "updatedAt" = NOW() WHERE id = $2 RETURNING id, email, name, role',
            [role, userId]
        );

        await pool.end();

        return new Response(JSON.stringify({
            success: true,
            message: 'Rôle mis à jour avec succès',
            user: result.rows[0]
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erreur mise à jour utilisateur:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Erreur lors de la mise à jour',
            details: error instanceof Error ? error.message : 'Erreur inconnue'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

export const DELETE: APIRoute = async ({ request, locals }) => {
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
        const { userId } = await request.json();

        if (!userId) {
            return new Response(JSON.stringify({
                success: false,
                error: 'userId est requis'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Empêcher la suppression de son propre compte
        const currentUserId = (locals.user as any).id;
        if (userId === currentUserId) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Vous ne pouvez pas supprimer votre propre compte'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const pool = new Pool({
            connectionString: `postgresql://${process.env.POSTGRES_USER || 'postgres'}:${process.env.POSTGRES_PASSWORD || 'pgsql+74'}@${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || '5432'}/${process.env.POSTGRES_DB || 'pgastro'}`,
        });

        // Vérifier que l'utilisateur existe
        const userCheck = await pool.query('SELECT id, email FROM "user" WHERE id = $1', [userId]);
        if (userCheck.rows.length === 0) {
            await pool.end();
            return new Response(JSON.stringify({
                success: false,
                error: 'Utilisateur non trouvé'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Supprimer l'utilisateur
        await pool.query('DELETE FROM "user" WHERE id = $1', [userId]);

        await pool.end();

        return new Response(JSON.stringify({
            success: true,
            message: 'Utilisateur supprimé avec succès',
            deletedUser: userCheck.rows[0]
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erreur suppression utilisateur:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Erreur lors de la suppression',
            details: error instanceof Error ? error.message : 'Erreur inconnue'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
