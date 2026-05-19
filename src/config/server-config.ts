import { env } from "./env";

const ServerConfig = {
    info: {
        name: "VELA",
        version: "1.0.0",
        description: "Financiamiento Web3 para Emprendedores",
    },
    databaseURL: env.DATABASE_URL,
    baseURL: env.NEXT_PUBLIC_BASE_URL,
    google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
} as const;

export default ServerConfig;
