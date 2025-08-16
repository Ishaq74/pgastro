import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
    try {
        const { email } = await request.json();

        if (!email) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Email requis'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Better Auth gère automatiquement la génération et l'envoi du token
        // Ici on simulera l'envoi d'email pour l'instant
        console.log(`Demande de réinitialisation pour: ${email}`);

        // Pour l'instant, on simule le succès
        // Dans une vraie implémentation, Better Auth s'occuperait de tout
        return new Response(JSON.stringify({
            success: true,
            message: 'Un email de réinitialisation a été envoyé si ce compte existe.'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erreur réinitialisation mot de passe:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Erreur lors de la demande de réinitialisation'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
