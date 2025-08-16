/// <reference path="../.astro/types.d.ts" />

// Types personnalisés pour Better Auth avec rôles
interface CustomUser extends import("better-auth").User {
    role?: string;
}

declare namespace App {
    interface Locals {
        user: CustomUser | null;
        session: import("better-auth").Session | null;
    }
}
