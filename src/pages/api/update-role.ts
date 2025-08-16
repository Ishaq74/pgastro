import type { APIRoute } from 'astro';
import Database from 'better-sqlite3';

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { email, role } = body;
        
        console.log(`Updating role for ${email} to ${role}`);
        
        // Access the SQLite database directly to update role
        const db = new Database('/tmp/pgastro-auth.db');
        
        const result = db.prepare('UPDATE user SET role = ? WHERE email = ?').run(role, email);
        
        if (result.changes === 0) {
            return new Response(JSON.stringify({
                success: false,
                error: 'User not found'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Get updated user
        const updatedUser = db.prepare('SELECT * FROM user WHERE email = ?').get(email);
        
        db.close();
        
        return new Response(JSON.stringify({
            success: true,
            message: `Role updated to ${role}`,
            user: updatedUser
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Update role error:', error);
        return new Response(JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};