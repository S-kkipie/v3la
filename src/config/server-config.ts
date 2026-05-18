import { env } from "./env";

const ServerConfig = {
    info: {
        name: "SGPU",
        version: "1.0.0",
        description: "Sistema de Gestion de Posgrado",
    },
    databaseURL: env.DATABASE_URL,
    baseURL: env.NEXT_PUBLIC_BASE_URL,
} as const;

export default ServerConfig;
