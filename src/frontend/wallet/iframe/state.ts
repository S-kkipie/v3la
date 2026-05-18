import { useState, useEffect } from "react";

export type WalletStatus =
  | "IDLE"
  | "AUTHENTICATING"
  | "DERIVING"
  | "READY"
  | "SIGNING"
  | "ERROR";

export interface WalletState {
  status: WalletStatus;
  address: string | null;
  error: string | null;
}

let state: WalletState = {
  status: "IDLE",
  address: null,
  error: null,
};

type Listener = () => void;
const listeners = new Set<Listener>();

function notifyListeners(): void {
  listeners.forEach((listener) => listener());
}

export function getState(): WalletState {
  return { ...state };
}

export function setStatus(status: WalletStatus): void {
  state = { ...state, status };
  notifyListeners();
}

export function setAddress(address: string): void {
  state = { ...state, address, error: null };
  notifyListeners();
}

export function setError(error: string): void {
  state = { ...state, error, status: "ERROR" };
  notifyListeners();
}

export function isReady(): boolean {
  return state.status === "READY";
}

export function reset(): void {
  state = { status: "IDLE", address: null, error: null };
  notifyListeners();
}

export function useWalletState(): WalletState {
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick((t) => t + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return getState();
}
