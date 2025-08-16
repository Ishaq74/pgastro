import type { APIRoute } from 'astro';
import Database from 'better-sqlite3';

export const GET: APIRoute = async ({ request }) => {
    try {
        // Access the SQLite database directly to list users
        const db = new Database('/tmp/pgastro-auth.db');
        
        const users = db.prepare('SELECT id, email, name, role, emailVerified, createdAt FROM user ORDER BY createdAt DESC').all();
        
        db.close();
        
        return new Response(JSON.stringify({
            success: true,
            users: users,
            count: users.length
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('List users error:', error);
        return new Response(JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};