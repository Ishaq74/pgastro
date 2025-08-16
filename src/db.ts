import pg from 'pg';
import { auth } from "./auth";

// Make sure we DO NOT "prerender" this function to allow the ENV variables to update on the fly
export const prerender = false;

// Configuration de connexion
const config = {
  host: import.meta.env.POSTGRES_HOST,
  port: import.meta.env.POSTGRES_PORT,
  database: import.meta.env.POSTGRES_DB,
  user: import.meta.env.POSTGRES_USER,
  password: import.meta.env.POSTGRES_PASSWORD,
};

// Fonction pour créer une nouvelle connexion
export async function createConnection() {
  const client = new pg.Client(config);
  await client.connect();
  return client;
}

// Fonction pour tester la connexion sans crash
export async function testConnection(): Promise<{ success: boolean; client?: pg.Client; error?: any }> {
  try {
    const client = new pg.Client(config);
    await client.connect();
    return { success: true, client };
  } catch (error) {
    return { success: false, error };
  }
}

// Export d'une connexion par défaut (sera connectée à la demande)
let defaultClient: pg.Client | null = null;

export const db = {
  async query(text: string, params?: any[]) {
    if (!defaultClient) {
      defaultClient = await createConnection();
    }
    return defaultClient.query(text, params);
  },
  
  async connect() {
    if (!defaultClient) {
      defaultClient = await createConnection();
    }
    return defaultClient;
  },
  
  async end() {
    if (defaultClient) {
      await defaultClient.end();
      defaultClient = null;
    }
  }
};

export async function createDemoAccounts() {
  try {
    // Create admin account
    await auth.api.createUser({
      email: "admin@example.com",
      password: "Admin@1234",
      name: "Admin User",
      role: "admin",
    });

    // Create user account
    const userResult = await auth.api.createUser({
      email: "user@example.com",
      password: "User@1234",
      name: "Regular User",
      role: "user",
    });

    if (userResult.error) {
        console.error("Error creating user account:", userResult.error);
        throw new Error(userResult.error.message || "Unknown error during user account creation");
    }

    console.log("Demo accounts created successfully.");
  } catch (error) {
    console.error("Error creating demo accounts:", error);
    throw error; // Re-throw the error for higher-level handling
  }
}