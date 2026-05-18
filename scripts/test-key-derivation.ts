import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";

const MODULE_PATH = "../src/frontend/wallet/iframe/key-derivation.ts";

function assertEqual(actual: unknown, expected: unknown, message: string) {
    if (actual !== expected) {
        throw new Error(`${message}: expected ${expected}, got ${actual}`);
    }
}

function assertTrue(value: boolean, message: string) {
    if (!value) {
        throw new Error(`${message}: expected true, got ${value}`);
    }
}

async function runTests() {
    console.log("--- Running key-derivation tests ---\n");

    const kd = await import(MODULE_PATH);
    assertEqual(
        kd.getWalletAddress(),
        null,
        "Address should be null before derivation",
    );
    assertEqual(
        kd.isWalletReady(),
        false,
        "Wallet should not be ready before derivation",
    );
    try {
        kd.signTransaction("dummy");
        throw new Error("Should have thrown for missing wallet");
    } catch (e: any) {
        assertTrue(
            e.message.includes("not derived"),
            "Error should mention missing derivation",
        );
    }
    console.log("✅ Pre-derivation checks passed");

    const userId = "test-user-123";
    function makePrfBuffer(): ArrayBuffer {
        const arr = new Uint8Array(32);
        for (let i = 0; i < 32; i++) arr[i] = i + 1;
        return arr.buffer.slice(
            arr.byteOffset,
            arr.byteOffset + arr.byteLength,
        );
    }

    const mod1 = await import(MODULE_PATH + "?t=1");
    const mod2 = await import(MODULE_PATH + "?t=2");
    const address1 = mod1.deriveWallet(userId, makePrfBuffer());
    const address2 = mod2.deriveWallet(userId, makePrfBuffer());
    assertEqual(
        address1,
        address2,
        "Same userId + PRF should produce same address",
    );
    assertTrue(address1.length > 0, "Address should be non-empty");
    console.log("✅ Deterministic derivation passed:", address1);

    const prfBuf = makePrfBuffer();
    const kd3 = await import(MODULE_PATH + "?t=3");
    kd3.deriveWallet(userId, prfBuf);
    const view = new Uint8Array(prfBuf);
    const allZero = view.every((b) => b === 0);
    assertTrue(allZero, "PRF output buffer should be zeroed after derivation");
    console.log("✅ Buffer clearing passed");

    const kd4 = await import(MODULE_PATH + "?t=4");
    const addr = kd4.deriveWallet(userId, makePrfBuffer());
    const fromPubkey = new PublicKey(addr);
    const toPubkey = new PublicKey("11111111111111111111111111111111");
    const tx = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey,
            toPubkey,
            lamports: 100,
        }),
    );
    tx.recentBlockhash = "G7ZKG8dCjddqZcD6voRtrzMto1FGhTUZL1mxGHYNGqfA";
    tx.feePayer = fromPubkey;

    const serialized = tx
        .serialize({ requireAllSignatures: false })
        .toString("base64");
    const signedBase64 = kd4.signTransaction(serialized);

    assertTrue(
        signedBase64.length > 0,
        "Signed transaction should be non-empty",
    );
    assertTrue(
        signedBase64 !== serialized,
        "Signed transaction should differ from unsigned",
    );

    const signedTx = Transaction.from(Buffer.from(signedBase64, "base64"));
    const sigInfo = signedTx.signatures.find((s) =>
        s.publicKey.equals(fromPubkey),
    );
    if (!sigInfo || !sigInfo.signature) {
        throw new Error("Signature not found for wallet public key");
    }
    assertEqual(
        sigInfo.signature.length,
        64,
        "Ed25519 signature should be 64 bytes",
    );
    console.log("✅ Valid signature passed");

    const kd5a = await import(MODULE_PATH + "?t=5a");
    const kd5b = await import(MODULE_PATH + "?t=5b");
    const addrA = kd5a.deriveWallet("user-a", makePrfBuffer());
    const addrB = kd5b.deriveWallet("user-b", makePrfBuffer());
    assertTrue(
        addrA !== addrB,
        "Different userId should produce different address",
    );
    console.log("✅ Different userId produces different address");

    console.log("\n--- All tests passed ✅ ---");
}

runTests().catch((err) => {
    console.error("\n--- Tests failed ❌ ---");
    console.error(err.message);
    process.exit(1);
});
