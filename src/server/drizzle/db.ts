import { drizzle } from "drizzle-orm/node-postgres";
import ServerConfig from "@/config/server-config";

export const db = drizzle({
    connection: {
        connectionString: ServerConfig.databaseURL,
        ssl: true,
    },
});
