import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { email, password } = body;

        console.log('Connexion via Better Auth:', { email });

        // Rediriger vers l'endpoint Better Auth
        const betterAuthUrl = '/api/auth/sign-in/email';
        const betterAuthBody = new URLSearchParams({
            email,
            password
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
            // Récupérer les cookies de session
            const cookies = response.headers.get('set-cookie');
            
            return new Response(JSON.stringify({
                success: true,
                message: 'Connexion réussie'
            }), {
                status: 200,
                headers: { 
                    'Content-Type': 'application/json',
                    ...(cookies && { 'Set-Cookie': cookies })
                }
            });
        } else {
            const errorText = await response.text();
            console.error('Erreur Better Auth:', response.status, errorText);
            return new Response(JSON.stringify({
                success: false,
                error: `Connexion échouée: ${response.status}`
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

    } catch (error) {
        console.error('Erreur connexion:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Erreur inconnue'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
