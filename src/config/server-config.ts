import { env } from "./env";

const ServerConfig = {
  databaseURL: env.DATABASE_URL,
  baseURL: env.NEXT_PUBLIC_BASE_URL,
};

export default ServerConfig;
