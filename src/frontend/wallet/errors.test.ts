import { describe, expect, it } from "vitest";

import {
  InsufficientBalanceError,
  InvalidAddressError,
  NetworkError,
  PrfNotSupportedError,
  TimeoutError,
  UserRejectedError,
  WalletError,
  WalletNotReadyError,
} from "./errors";

describe("WalletError hierarchy", () => {
  it("WalletError is instance of Error", () => {
    const err = new WalletError("base");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(WalletError);
    expect(err.name).toBe("WalletError");
    expect(err.message).toBe("base");
  });

  it("PrfNotSupportedError extends WalletError with default message", () => {
    const err = new PrfNotSupportedError();
    expect(err).toBeInstanceOf(WalletError);
    expect(err.name).toBe("PrfNotSupportedError");
    expect(err.message).toContain("does not support passkey PRF");
  });

  it("PrfNotSupportedError accepts custom message", () => {
    const err = new PrfNotSupportedError("Custom PRF message");
    expect(err.message).toBe("Custom PRF message");
  });

  it("TimeoutError extends WalletError with default message", () => {
    const err = new TimeoutError();
    expect(err).toBeInstanceOf(WalletError);
    expect(err.name).toBe("TimeoutError");
    expect(err.message).toContain("too long");
  });

  it("TimeoutError includes requestId when provided", () => {
    const err = new TimeoutError("req-123");
    expect(err.message).toContain("timed out");
  });

  it("UserRejectedError extends WalletError with default message", () => {
    const err = new UserRejectedError();
    expect(err).toBeInstanceOf(WalletError);
    expect(err.name).toBe("UserRejectedError");
    expect(err.message).toContain("cancelled");
  });

  it("UserRejectedError includes requestId when provided", () => {
    const err = new UserRejectedError("req-456");
    expect(err.message).toContain("cancelled");
  });

  it("WalletNotReadyError extends WalletError with default message", () => {
    const err = new WalletNotReadyError();
    expect(err).toBeInstanceOf(WalletError);
    expect(err.name).toBe("WalletNotReadyError");
    expect(err.message).toContain("not ready");
  });

  it("WalletNotReadyError accepts custom message", () => {
    const err = new WalletNotReadyError("Iframe missing");
    expect(err.message).toBe("Iframe missing");
  });

  it("InvalidAddressError extends WalletError with default message", () => {
    const err = new InvalidAddressError();
    expect(err).toBeInstanceOf(WalletError);
    expect(err.name).toBe("InvalidAddressError");
    expect(err.message).toContain("not valid");
  });

  it("InvalidAddressError includes address when provided", () => {
    const err = new InvalidAddressError("bad-address");
    expect(err.message).toContain("bad-address");
  });

  it("InsufficientBalanceError extends WalletError with default message", () => {
    const err = new InsufficientBalanceError();
    expect(err).toBeInstanceOf(WalletError);
    expect(err.name).toBe("InsufficientBalanceError");
    expect(err.message).toContain("not have enough SOL");
  });

  it("InsufficientBalanceError accepts custom message", () => {
    const err = new InsufficientBalanceError("Custom balance message");
    expect(err.message).toBe("Custom balance message");
  });

  it("NetworkError extends WalletError with default message", () => {
    const err = new NetworkError();
    expect(err).toBeInstanceOf(WalletError);
    expect(err.name).toBe("NetworkError");
    expect(err.message).toContain("Network error");
  });

  it("NetworkError accepts custom message", () => {
    const err = new NetworkError("RPC unreachable");
    expect(err.message).toBe("RPC unreachable");
  });
});
