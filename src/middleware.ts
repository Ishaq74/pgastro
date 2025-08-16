import { auth } from "./auth";
import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
    const session = await auth.api.getSession({
        headers: context.request.headers,
    });

    if (session) {
        context.locals.user = session.user;
        context.locals.session = session.session;
    } else {
        context.locals.user = null;
        context.locals.session = null;
    }

    // Protection des routes d'administration
    if (context.url.pathname.startsWith('/admin')) {
        if (!session?.user) {
            return context.redirect('/login');
        }
        // Vérifier le rôle admin (assumons que Better Auth stocke le rôle dans user.role)
        const userRole = session.user.role || 'user';
        if (userRole !== 'admin') {
            return new Response('Accès refusé - Admin requis', { status: 403 });
        }
    }

    // Protection des routes de profil
    if (context.url.pathname.startsWith('/profile') || context.url.pathname.startsWith('/dashboard')) {
        if (!session?.user) {
            return context.redirect('/login');
        }
    }

    return next();
});
