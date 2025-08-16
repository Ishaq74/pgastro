import type { APIRoute } from 'astro';
import { auth } from '../../auth';

export const POST: APIRoute = async ({ request }) => {
    try {
        const { email, password, name } = await request.json();

        if (!email || !password) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Email et mot de passe requis'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Utiliser l'API Better Auth pour créer un utilisateur
        try {
            const result = await auth.api.signUpEmail({
                body: {
                    email,
                    password,
                    name: name || email.split('@')[0] // Utiliser la partie avant @ comme nom par défaut
                }
            });

            if (!result || result.error) {
                console.error('Error during signup:', {
                    error: result?.error,
                    input: { email, name },
                    timestamp: new Date().toISOString()
                });
                return new Response(JSON.stringify({
                    success: false,
                    error: result?.error?.message || 'Unknown error during signup'
                }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            return new Response(JSON.stringify({
                success: true,
                message: 'Utilisateur créé avec succès',
                user: result
            }), {
                status: 201,
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            console.error('Unexpected error during signup:', {
                error,
                input: { email, name },
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
    } catch (error) {
        console.error('Erreur inscription:', error);
        
        let errorMessage = 'Erreur lors de la création du compte';
        if (error instanceof Error) {
            if (error.message.includes('duplicate') || error.message.includes('unique')) {
                errorMessage = 'Un compte avec cet email existe déjà';
            } else {
                errorMessage = error.message;
            }
        }

        return new Response(JSON.stringify({
            success: false,
            error: errorMessage
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
