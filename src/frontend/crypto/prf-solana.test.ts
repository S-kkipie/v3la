import { describe, it, expect } from "vitest";
import {
  makePrfSalt,
  deriveSolanaSeedFromPrf,
  deriveWalletFromPrf,
} from "./prf-solana";

describe("PRF Solana Wallet Derivation", () => {
  describe("makePrfSalt", () => {
    it("should generate a 32-byte salt for a given userId", () => {
      const salt = makePrfSalt("user-123");
      expect(salt).toBeInstanceOf(Uint8Array);
      expect(salt.length).toBe(32);
    });

    it("should generate consistent salts for the same userId", () => {
      const salt1 = makePrfSalt("user-123");
      const salt2 = makePrfSalt("user-123");
      expect(salt1).toEqual(salt2);
    });

    it("should generate different salts for different userIds", () => {
      const salt1 = makePrfSalt("user-123");
      const salt2 = makePrfSalt("user-456");
      expect(salt1).not.toEqual(salt2);
    });

    it("should throw for empty userId", () => {
      expect(() => makePrfSalt("")).toThrow(
        "userId must be a non-empty string",
      );
    });
  });

  describe("deriveSolanaSeedFromPrf", () => {
    it("should derive a 32-byte seed from PRF output", () => {
      const prfOutput = new Uint8Array(32).fill(1);
      const seed = deriveSolanaSeedFromPrf(prfOutput);
      expect(seed).toBeInstanceOf(Uint8Array);
      expect(seed.length).toBe(32);
    });

    it("should derive consistent seeds for the same PRF output", () => {
      const prfOutput = new Uint8Array(32).fill(1);
      const seed1 = deriveSolanaSeedFromPrf(prfOutput);
      const seed2 = deriveSolanaSeedFromPrf(prfOutput);
      expect(seed1).toEqual(seed2);
    });

    it("should derive different seeds for different PRF outputs", () => {
      const prfOutput1 = new Uint8Array(32).fill(1);
      const prfOutput2 = new Uint8Array(32).fill(2);
      const seed1 = deriveSolanaSeedFromPrf(prfOutput1);
      const seed2 = deriveSolanaSeedFromPrf(prfOutput2);
      expect(seed1).not.toEqual(seed2);
    });

    it("should throw for PRF output less than 32 bytes", () => {
      const shortOutput = new Uint8Array(16);
      expect(() => deriveSolanaSeedFromPrf(shortOutput)).toThrow(
        "PRF output must be at least 32 bytes",
      );
    });
  });

  describe("deriveWalletFromPrf", () => {
    it("should derive a valid Solana Keypair", () => {
      const prfOutput = new Uint8Array(32).fill(1);
      const keypair = deriveWalletFromPrf(prfOutput, "user-123");
      expect(keypair).toBeDefined();
      expect(keypair.publicKey).toBeDefined();
      expect(keypair.publicKey.toBytes().length).toBe(32);
    });

    it("should derive consistent keypairs for the same inputs", () => {
      const prfOutput = new Uint8Array(32).fill(1);
      const keypair1 = deriveWalletFromPrf(prfOutput, "user-123");
      const prfOutput2 = new Uint8Array(32).fill(1);
      const keypair2 = deriveWalletFromPrf(prfOutput2, "user-123");
      expect(keypair1.publicKey.toBytes()).toEqual(
        keypair2.publicKey.toBytes(),
      );
    });

    it("should throw for empty userId", () => {
      const prfOutput = new Uint8Array(32).fill(1);
      expect(() => deriveWalletFromPrf(prfOutput, "")).toThrow(
        "userId must be a non-empty string",
      );
    });
  });
});
