import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ redirect, request }) => {
    try {
        const body = await request.json();
        const { email, password, name } = body;

        console.log('Inscription via Better Auth:', { email, name });

        // Rediriger vers l'endpoint Better Auth
        const betterAuthUrl = '/api/auth/sign-up/email';
        const betterAuthBody = new URLSearchParams({
            email,
            password,
            name: name || ''
        });

        const response = await fetch(`http://localhost:4321${betterAuthUrl}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'AuthTest/1.0'
            },
            body: betterAuthBody
        });

        if (response.ok) {
            return new Response(JSON.stringify({
                success: true,
                message: 'Utilisateur créé avec succès'
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            const errorText = await response.text();
            console.error('Erreur Better Auth:', response.status, errorText);
            return new Response(JSON.stringify({
                success: false,
                error: `Better Auth error: ${response.status}`
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

    } catch (error) {
        console.error('Erreur inscription:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Erreur inconnue'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
