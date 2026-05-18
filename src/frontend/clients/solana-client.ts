import { autoDiscover, createClient } from "@solana/client";

export const solanaClient = createClient({
  endpoint: "https://api.devnet.solana.com",
  walletConnectors: autoDiscover(),
});
