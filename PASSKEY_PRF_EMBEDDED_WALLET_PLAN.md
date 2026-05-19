# Passkeys + PRF Embedded Wallet Plan

## Checklist

### Fase 1: Foundation

- [x] Separar schema de wallet de auth
- [x] Definir tablas `embedded_wallet`, `embedded_wallet_access` y `embedded_wallet_operation`
- [x] Crear migración Drizzle para tablas e índices
- [x] Crear servicio backend de wallet
- [x] Crear endpoint `GET /api/v1/wallet/me`
- [x] Agregar helper de capability detection PRF en frontend
- [x] Exponer estado de compatibilidad PRF en UI

### Fase 2: Provisioning

- [x] Crear `seed-envelope.ts`
- [x] Refactorizar derivación para usar `masterSeed` en vez de PRF directo
- [x] Crear endpoint `POST /api/v1/wallet/provision`
- [x] Crear flujo UI “Create embedded wallet”
- [x] Probar alta end-to-end

### Fase 3: Unlock + Signing

- [ ] Crear endpoint `POST /api/v1/wallet/unlock/init`
- [ ] Refactorizar `webauthn-prf.ts` para `credentialId` específica
- [ ] Extender protocolo iframe con `UNLOCK`, `LOCK`, `STATUS`
- [ ] Integrar approval UI con sign intents
- [ ] Definir TTL y auto-lock de wallet en memoria

### Fase 4: Multi-passkey Access

- [ ] Crear endpoint `POST /api/v1/wallet/access/add`
- [ ] Crear endpoint `POST /api/v1/wallet/access/remove`
- [ ] Crear flujo UI para agregar passkey a wallet existente
- [ ] Crear flujo UI para revocar passkey de wallet
- [ ] Impedir borrado del último método de acceso

### Fase 5: Hardening

- [ ] Añadir CSP y revisar sandbox del iframe
- [ ] Añadir `Permissions-Policy` si se mueve a cross-origin
- [ ] Revisar logs para evitar serializar PRF output o seed
- [ ] Añadir auditoría y `signIntent`
- [ ] Completar tests unitarios, integración y e2e

## Objetivo

Implementar una embedded wallet propia para Solana usando passkeys + WebAuthn PRF, manteniendo la firma en cliente y evitando custodiar la seed en claro en el servidor.

El objetivo funcional correcto no es derivar directamente `wallet = f(PRF, userId)`, sino usar el PRF como material para desbloquear una seed maestra cifrada. Eso permite:

- una sola wallet por usuario
- múltiples passkeys por wallet
- rotación y alta/baja de passkeys
- recuperación entre dispositivos sin cambiar la wallet

## Estado actual del repo

### Ya existe

- `better-auth` con `passkey()` en `src/server/auth/auth.ts`
- tabla `passkey` en `src/server/drizzle/schemas/auth-schema.ts`
- cliente `passkeyClient()` en `src/frontend/auth/auth.ts`
- PoC de PRF WebAuthn en `src/frontend/wallet/iframe/webauthn-prf.ts`
- derivación Solana desde PRF en `src/frontend/crypto/prf-solana.ts`
- iframe aislado para signing en `src/frontend/wallet/iframe/*`
- protocolo `postMessage` básico para connect/sign en `src/frontend/wallet/protocol.ts`

### Problemas del diseño actual

1. `authenticateAndGetPrf()` hace un `navigator.credentials.get()` local sin cerrar el challenge con backend.
2. El wallet binding depende de `userId` en query string del iframe.
3. La derivación actual produce una wallet por credencial, no una wallet por usuario.
4. No existe persistencia segura del secreto maestro de la wallet.
5. No existe flujo de agregar una segunda passkey a la misma wallet.

## Decisión de arquitectura

## Modelo recomendado

### No recomendado

`seed = HKDF(PRF, userId)` y luego `Keypair.fromSeed(seed)`.

Problema:

- el PRF está asociado a la credencial, no al usuario
- una passkey nueva probablemente da otro PRF
- el mismo usuario terminaría con otra wallet

### Recomendado

Usar una seed maestra aleatoria por wallet y cifrarla con una KEK derivada del PRF de cada passkey autorizada.

Flujo conceptual:

1. Crear `masterSeed` aleatoria de 32 bytes.
2. Derivar `kek = HKDF(PRF_output, appSalt, info)`.
3. Cifrar `masterSeed` con `AES-GCM(kek)`.
4. Guardar en servidor sólo:
   - `ciphertext`
   - `iv`
   - `aad` o metadata
   - referencia a la passkey/credential
5. Para unlock:
   - ejecutar WebAuthn assertion con PRF
   - derivar `kek`
   - descifrar `masterSeed`
   - construir `Keypair`
   - firmar en memoria

Resultado:

- el servidor nunca ve la seed en claro
- el usuario puede registrar varias passkeys para la misma wallet
- cambiar de dispositivo no implica cambiar de wallet si existe otro envelope o si la passkey sincronizada conserva la misma credencial utilizable

## Arquitectura objetivo

## Capas

### 1. Auth y Passkeys

Responsabilidad:

- login/session del usuario
- registro y gestión de passkeys
- descubrimiento de `credentialID` asociadas al usuario

Base existente:

- `better-auth`

### 2. Wallet Control Plane

Responsabilidad:

- metadata de wallet
- envelopes cifrados por passkey
- autorización de operaciones
- emisión de challenge de wallet unlock

Debe vivir en backend.

### 3. Wallet Runtime aislado

Responsabilidad:

- obtener PRF en navegador
- derivar KEK
- descifrar seed
- construir keypair
- firmar transacciones
- limpiar memoria

Debe seguir dentro del iframe.

### 4. App Parent

Responsabilidad:

- orquestar UX
- hablar con backend
- hablar con iframe vía `postMessage`
- pedir aprobación explícita del usuario antes de firmar

## Modelo de datos propuesto

## Tablas nuevas

### `embedded_wallet`

Campos sugeridos:

- `id` `text` PK
- `user_id` `text` FK -> `user.id`
- `public_key` `text` unique
- `chain` `text` default `"solana"`
- `status` `text` default `"active"`
- `created_at` `timestamp`
- `updated_at` `timestamp`

Índices:

- `embedded_wallet_user_id_idx`
- `embedded_wallet_public_key_idx`

### `embedded_wallet_access`

Un envelope por passkey autorizada.

Campos sugeridos:

- `id` `text` PK
- `wallet_id` `text` FK -> `embedded_wallet.id`
- `user_id` `text` FK -> `user.id`
- `passkey_id` `text` FK -> `passkey.id`
- `credential_id` `text`
- `kdf_version` `text`
- `cipher_version` `text`
- `wrapped_seed` `text`
- `iv` `text`
- `aad` `text` nullable
- `created_at` `timestamp`
- `last_used_at` `timestamp` nullable

Índices:

- `embedded_wallet_access_wallet_id_idx`
- `embedded_wallet_access_user_id_idx`
- `embedded_wallet_access_passkey_id_idx`
- `embedded_wallet_access_credential_id_idx`

Restricciones:

- unique `(wallet_id, passkey_id)`
- unique `(wallet_id, credential_id)`

### `embedded_wallet_operation`

Auditoría liviana.

Campos sugeridos:

- `id` `text` PK
- `wallet_id` `text` FK
- `user_id` `text` FK
- `type` `text`
- `status` `text`
- `origin` `text` nullable
- `metadata` `jsonb` nullable
- `created_at` `timestamp`

## Tablas existentes a reutilizar

### `passkey`

Ya existe y debe seguir siendo la fuente de verdad de:

- `credentialID`
- `userId`
- metadata del autenticador

## Diseño criptográfico

## Objetos

### `masterSeed`

- 32 bytes aleatorios
- genera la wallet final Solana con `Keypair.fromSeed(masterSeed)`
- nunca persistir en claro

### `prfOutput`

- 32 bytes o más, devueltos por WebAuthn PRF
- efímero
- limpiar inmediatamente después de derivar la KEK

### `kek`

- `HKDF-SHA256(prfOutput, appSalt, info, 32)`
- usada sólo para cifrar/descifrar `masterSeed`

### `appSalt`

- estable y versionada
- no secreta
- ejemplo: `vela:wallet-kek:v1`

### `info`

- incluir contexto de app/chain/version
- ejemplo: `solana-embedded-wallet-unlock:v1`

## Cifrado

Usar `AES-GCM` con Web Crypto.

Envelope sugerido:

```json
{
  "cipher": "AES-GCM-256",
  "kdf": "HKDF-SHA256",
  "version": "v1",
  "iv": "<base64url>",
  "wrappedSeed": "<base64url>",
  "aad": "<base64url-optional>"
}
```

### AAD sugerida

Autenticar al menos:

- `walletId`
- `userId`
- `credentialId`
- `chain`
- `version`

## Flujos de producto

## Flujo A: alta de wallet inicial

Precondiciones:

- usuario autenticado
- al menos una passkey registrada con soporte PRF

Pasos:

1. El usuario entra a wallet setup.
2. Frontend detecta soporte `PublicKeyCredential.getClientCapabilities()`.
3. Backend devuelve passkeys registradas del usuario.
4. Usuario elige una passkey o usa la primaria.
5. Frontend inicia assertion WebAuthn con PRF sobre esa credencial.
6. Iframe obtiene `prfOutput`.
7. Iframe genera `masterSeed` aleatoria.
8. Iframe deriva `kek`.
9. Iframe cifra `masterSeed`.
10. Iframe deriva `publicKey` Solana.
11. Frontend/envía a backend:
    - `publicKey`
    - envelope cifrado
    - `credentialId`
    - `passkeyId`
12. Backend crea `embedded_wallet` y `embedded_wallet_access`.

Resultado:

- wallet provisionada
- una passkey autorizada para abrirla

## Flujo B: unlock de wallet

Pasos:

1. Parent pide `POST /wallet/session/init`.
2. Backend valida sesión y devuelve:
   - `walletId`
   - `publicKey`
   - lista de access methods disponibles
3. Parent manda al iframe un comando `UNLOCK_WALLET`.
4. Iframe ejecuta WebAuthn assertion con PRF para la `credentialId` elegida.
5. Iframe deriva `kek`.
6. Iframe descifra `masterSeed`.
7. Iframe construye `Keypair`.
8. Iframe responde `WALLET_ADDRESS` y estado `READY`.

Resultado:

- keypair viva sólo en memoria del iframe

## Flujo C: firmar transacción

Pasos:

1. Parent serializa transacción.
2. Parent envía `WALLET_SIGN`.
3. Iframe muestra approval UI.
4. Usuario aprueba.
5. Iframe firma con `Keypair`.
6. Iframe responde `WALLET_SIGN_RESPONSE`.

Opcional:

- pedir re-verificación PRF o UV para operaciones sensibles
- definir TTL de unlock en memoria

## Flujo D: agregar segunda passkey a la misma wallet

Precondición:

- wallet ya desbloqueada con una passkey válida

Pasos:

1. Usuario registra o elige una segunda passkey.
2. Iframe obtiene `prfOutput` de esa nueva credencial.
3. Iframe usa la `masterSeed` ya descifrada en memoria.
4. Iframe deriva una nueva `kek`.
5. Iframe crea nuevo envelope.
6. Backend inserta nueva fila en `embedded_wallet_access`.

Resultado:

- misma wallet accesible con dos passkeys

## Flujo E: eliminar passkey

Pasos:

1. Backend verifica que no sea el último access method, o exige agregar otro antes.
2. Si no es la última, elimina:
   - relación de auth passkey si aplica
   - envelope de `embedded_wallet_access`

Regla:

- no permitir dejar la wallet sin access method recuperable

## Endpoints backend propuestos

Base sugerida:

- `src/app/api/v1/wallet/*`

## 1. `GET /api/v1/wallet/me`

Devuelve:

- si el usuario tiene wallet
- `walletId`
- `publicKey`
- passkeys autorizadas

## 2. `POST /api/v1/wallet/provision`

Body:

- `publicKey`
- `passkeyId`
- `credentialId`
- `wrappedSeed`
- `iv`
- `aad`
- `kdfVersion`
- `cipherVersion`

Valida:

- sesión activa
- passkey pertenece al usuario
- usuario aún no tiene wallet, o política de idempotencia

## 3. `POST /api/v1/wallet/unlock/init`

Devuelve:

- metadata de wallet
- access methods disponibles
- challenge o token de operación opcional

Nota:

No hace falta que el backend vea el resultado del PRF, pero sí conviene emitir contexto de operación firmado para evitar que el iframe opere sólo por query params.

## 4. `POST /api/v1/wallet/access/add`

Body:

- `walletId`
- `passkeyId`
- `credentialId`
- nuevo envelope

## 5. `POST /api/v1/wallet/access/remove`

Body:

- `walletAccessId` o `passkeyId`

## 6. `POST /api/v1/wallet/sign-intent`

Opcional pero recomendable.

Body:

- `walletId`
- `txSummary`
- `origin`

Devuelve:

- `signIntentId`

Uso:

- auditar antes de firmar
- bindear aprobación UI con una operación concreta

## Cambios por archivo

## Backend

### `src/server/drizzle/schemas/auth-schema.ts`

Agregar:

- `embeddedWallet`
- `embeddedWalletAccess`
- `embeddedWalletOperation`
- relaciones

Alternativa más limpia:

- mover wallet a un schema nuevo `wallet-schema.ts`

### `drizzle/*`

Agregar migración SQL para nuevas tablas e índices.

### `src/server/auth/auth.ts`

Ajustes:

- mantener `passkey()` pero preparar extensiones PRF para registro y sign-in
- revisar si conviene `returnWebAuthnResponse` del lado cliente en flows específicos

### Nuevo `src/server/wallet/service.ts`

Responsabilidad:

- crear wallet
- listar wallet del usuario
- crear/eliminar access envelopes
- registrar operaciones

### Nuevo `src/server/wallet/crypto-metadata.ts`

Responsabilidad:

- constantes de versión
- formatos de envelope
- validaciones de metadata

### Nuevos routes

- `src/app/api/v1/wallet/me/route.ts`
- `src/app/api/v1/wallet/provision/route.ts`
- `src/app/api/v1/wallet/unlock/init/route.ts`
- `src/app/api/v1/wallet/access/add/route.ts`
- `src/app/api/v1/wallet/access/remove/route.ts`

## Frontend auth/passkey

### `src/frontend/components/auth/passkey/*`

Agregar:

- indicador de compatibilidad PRF por passkey si el navegador lo expone
- CTA de “usar esta passkey para wallet”

### `src/frontend/auth/auth.ts`

Posible ajuste:

- helpers para invocar `signIn.passkey` o `addPasskey` con `extensions.prf`

## Frontend wallet runtime

### Reemplazar `src/frontend/wallet/iframe/webauthn-prf.ts`

Cambios:

- dejar de crear challenge local arbitrario para el flujo principal
- usar `credentialId` explícita
- soportar `evalByCredential`
- encapsular:
  - capability detection
  - assertion PRF
  - limpieza de buffers

API sugerida:

```ts
getPrfForCredential(params: {
  userId: string;
  credentialId: string;
  firstSalt: Uint8Array;
}): Promise<ArrayBuffer>
```

## Nuevo `src/frontend/wallet/iframe/seed-envelope.ts`

Responsabilidad:

- generar `masterSeed`
- derivar `kek`
- cifrar/descifrar envelope
- zeroization best-effort

Funciones sugeridas:

- `generateMasterSeed()`
- `deriveKekFromPrf()`
- `encryptMasterSeed()`
- `decryptMasterSeed()`

## `src/frontend/wallet/iframe/key-derivation.ts`

Refactor:

- dejar de derivar wallet directamente desde PRF
- derivar wallet desde `masterSeed`
- seguir guardando `Keypair` sólo en closure local del iframe

Funciones objetivo:

- `hydrateWalletFromSeed(masterSeed)`
- `clearWallet()`
- `signTransaction()`

## `src/frontend/wallet/iframe/WalletIframe.tsx`

Cambios:

- soportar estados:
  - `UNINITIALIZED`
  - `PROVISIONING`
  - `UNLOCKING`
  - `READY`
  - `ERROR`
- aceptar comandos del parent:
  - `INIT_WALLET`
  - `PROVISION_WALLET`
  - `UNLOCK_WALLET`
  - `LOCK_WALLET`
  - `SIGN_TX`

## `src/frontend/wallet/protocol.ts`

Extender protocolo:

- `WALLET_INIT`
- `WALLET_PROVISION`
- `WALLET_UNLOCK`
- `WALLET_LOCK`
- `WALLET_STATUS`
- `WALLET_SIGN`
- `WALLET_SIGN_RESPONSE`
- `WALLET_ERROR`

Agregar payloads tipados con:

- `walletId`
- `credentialId`
- `signIntentId`
- `expiresAt`

## `src/frontend/wallet/client.ts`

Evolucionar el cliente para:

- provisionar
- unlockear
- firmar
- bloquear
- manejar expiración de sesión en iframe

## `src/frontend/components/wallet/*`

Agregar UI para:

- crear wallet
- desbloquear wallet
- elegir passkey
- agregar segunda passkey
- revocar passkey de wallet

## Secuencia de implementación

## Fase 1: Foundation

Objetivo:

- sentar modelo correcto sin romper auth existente

Tareas:

1. Crear tablas `embedded_wallet` y `embedded_wallet_access`.
2. Crear servicio backend wallet.
3. Crear endpoint `GET /wallet/me`.
4. Agregar capability detection PRF en frontend.
5. Documentar fallback cuando PRF no exista.

Entrega:

- backend conoce wallets y access envelopes
- frontend sabe si puede ofrecer embedded wallet PRF

## Fase 2: Provisioning

Objetivo:

- crear wallet nueva con envelope PRF

Tareas:

1. Implementar `seed-envelope.ts`.
2. Refactor de `key-derivation.ts` a seed-based wallet.
3. Implementar `POST /wallet/provision`.
4. Crear pantalla/CTA “Create embedded wallet”.
5. Probar alta end-to-end.

Entrega:

- wallet creada y persistida sin seed en claro en servidor

## Fase 3: Unlock + Signing

Objetivo:

- desbloqueo real y firma usable

Tareas:

1. Implementar `unlock/init`.
2. Refactor de `webauthn-prf.ts` para `credentialId` específica.
3. Extender protocolo del iframe.
4. Integrar approval UI con sign intents.
5. Definir TTL de unlock en memoria.

Entrega:

- wallet desbloqueable con passkey concreta
- signing completo vía iframe

## Fase 4: Multi-passkey Access

Objetivo:

- misma wallet con varias passkeys

Tareas:

1. Implementar `wallet/access/add`.
2. Implementar `wallet/access/remove`.
3. Agregar UI de gestión.
4. Impedir borrado de último método de acceso.

Entrega:

- multi-device / multi-passkey usable

## Fase 5: Hardening

Objetivo:

- reducir riesgos operativos y de seguridad

Tareas:

1. Añadir CSP y revisar sandbox del iframe.
2. Revisar `Permissions-Policy` si luego hay cross-origin.
3. Revisar logs para no serializar PRF outputs.
4. Añadir timeouts, lock manual y auto-lock.
5. Añadir auditoría de operaciones.

## Consideraciones de seguridad

## Reglas duras

1. Nunca enviar `prfOutput` al backend.
2. Nunca persistir `masterSeed` en `localStorage`, `IndexedDB` o logs.
3. Nunca serializar `PublicKeyCredential.toJSON()` si `clientExtensionResults.prf.results` viene presente.
4. Limpiar buffers sensibles después de uso.
5. El iframe no debe desbloquear por `userId` suelto; necesita contexto autenticado o token firmado.

## Riesgos a vigilar

### 1. Compatibilidad PRF

No todos los navegadores/autenticadores soportan PRF.

Mitigación:

- feature detection
- UX con fallback
- no ofrecer embedded wallet PRF cuando no soporte

### 2. Passkeys adicionales cambian el secreto

Es esperado si el diseño es directo por PRF.

Mitigación:

- usar envelope encryption

### 3. Exposición accidental en debugging

Riesgo:

- `console.log(prfResult)`
- serialización de `clientExtensionResults`

Mitigación:

- lint rules o revisión manual en paths críticos

### 4. Memoria del iframe

Riesgo:

- wallet desbloqueada demasiado tiempo

Mitigación:

- auto-lock por inactividad
- lock al cerrar modal o cambiar ruta
- reset al recargar iframe

## Compatibilidad y fallback

## Cuando PRF no esté disponible

Opciones de producto:

1. no ofrecer embedded wallet todavía
2. ofrecer wallet custodial temporal
3. ofrecer export/import manual de seed cifrada por contraseña

Recomendación:

- en la primera versión, mostrar claramente que embedded wallet requiere browser/authenticator compatible con PRF

## Estrategia de testing

## Unit tests

Agregar tests para:

- HKDF derivation estable
- encrypt/decrypt envelope
- zeroization best-effort
- rechazo de envelope corrupto
- derivación de wallet desde `masterSeed`

Ubicación sugerida:

- `src/frontend/crypto/*.test.ts`
- `src/frontend/wallet/iframe/*.test.ts`

## Integration tests

Casos:

1. provision wallet con passkey compatible
2. unlock wallet con credential válida
3. sign tx después de unlock
4. rechazo con credential equivocada
5. agregar segunda passkey sin cambiar `publicKey`
6. remover una passkey y conservar acceso por otra

## E2E tests

Extender `tests/wallet-protocol.spec.ts` con:

- provisioning flow
- unlock flow
- sign approval flow
- auto-lock flow
- manejo de errores PRF no soportado

## Decisiones abiertas

## 1. Mismo origen o origen separado para iframe

### Opción inicial recomendada

Same-origin.

Ventajas:

- menos fricción con WebAuthn
- menos complejidad de `Permissions-Policy`
- más rápido de implementar

### Opción futura

Mover wallet runtime a subdominio dedicado.

Ventajas:

- mejor aislamiento operativo

Coste:

- permisos explícitos
- CSP más fina
- mayor complejidad de despliegue

## 2. ¿Unlock por operación o unlock por sesión corta?

### Recomendación

Sesión corta en iframe:

- unlock 1 vez
- TTL 5-10 min
- pedir aprobación por cada firma

Más adelante:

- reauth PRF/UV para operaciones de alto riesgo

## 3. ¿Una wallet por usuario o varias?

### Recomendación inicial

Una wallet por usuario.

Simplifica:

- UX
- data model
- recovery
- permisos

## Próximo corte de implementación recomendado

Orden concreto:

1. crear schema wallet y migraciones
2. crear `seed-envelope.ts`
3. refactorizar `key-derivation.ts` para usar `masterSeed`
4. crear endpoint `POST /wallet/provision`
5. crear UI “Create embedded wallet”
6. luego refactorizar iframe protocol para unlock/sign reales

## Resumen ejecutivo

La arquitectura correcta para tu caso es:

- passkey para autenticar al usuario
- PRF para derivar una KEK
- seed maestra aleatoria por wallet
- seed cifrada en servidor en uno o varios envelopes
- iframe como runtime temporal de firma

Eso te da una embedded wallet propia, no custodial en claro, y compatible con múltiples passkeys por usuario sin cambiar la dirección de la wallet.
