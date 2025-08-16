/**
 * Routes API Better Auth - Catch-all pour toutes les routes auth
 */

import type { APIRoute } from "astro"
import { auth } from "../../../auth"

// Better Auth gère automatiquement toutes les routes :
// GET/POST /api/auth/sign-in
// GET/POST /api/auth/sign-up  
// GET/POST /api/auth/sign-out
// GET /api/auth/session
// etc.

export const ALL: APIRoute = async (context) => {
  return auth.handler(context.request)
}
