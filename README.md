# VELA — Financiamiento Web3 para Emprendedores

**Plataforma de lending descentralizado que usa identidad on-chain (RUC) y agentes de IA para conectar emprendedores informales con crédito justo en Solana.**

[![Solana](https://img.shields.io/badge/Solana-Devnet-14F195?logo=solana)](https://solana.com)
[![Anchor](https://img.shields.io/badge/Anchor-v0.30-000?logo=rust)](https://www.anchor-lang.com)
[![ElevenLabs](https://img.shields.io/badge/ElevenLabs-Integrated-000?logo=elevenlabs)](https://elevenlabs.io)

**Live Demo:** [velaweb3.lovable.app](https://velaweb3.lovable.app)  
**Devnet Program IDs:** _Próximamente tras deploy_  
**Demo Video:** _Link de YouTube/Vimeo (máx. 3 min)_

---

## Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [El Problema](#el-problema)
3. [La Solución VELA](#la-solución-vela)
4. [User Flow](#user-flow)
5. [Arquitectura Técnica](#arquitectura-técnica)
6. [Smart Contracts](#smart-contracts)
7. [Integraciones](#integraciones)
8. [Stack Tecnológico](#stack-tecnológico)
9. [Roadmap](#roadmap)
10. [Hackathon Tracks](#hackathon-tracks)
11. [Setup Local](#setup-local)
12. [Deploy en Devnet](#deploy-en-devnet)
13. [Equipo](#equipo)

---

## Resumen Ejecutivo

VELA es una plataforma de **lending DeFi nativa en Solana** diseñada para emprendedores que operan fuera del sistema financiero tradicional. Usamos **identidad on-chain basada en RUC** (vía integración SUNAT) y un **agente de IA con voz** para crear perfiles financieros digitales, otorgar microcréditos con tasas transparentes y construir reputación crediticia descentralizada.

- **Red:** Solana (devnet para hackathon)
- **Framework:** Anchor + `@solana/kit`
- **Frontend:** Next.js + Tailwind CSS
- **Agente IA:** Gemini (backend) + ElevenLabs (voz)
- **Identidad:** RUC ↔ Wallet on-chain
- **Modelo:** Lending directo (MVP) → Marketplace DeFi (Fase 2)

---

## El Problema

Millones de emprendedores en Latinoamérica enfrentan barreras sistémicas:

| Barrera                      | Impacto                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------ |
| **Sin acceso a crédito**     | Los bancos tradicionales piden requisitos imposibles para negocios informales.       |
| **Financiamiento riesgoso**  | Prestamistas informales cobran tasas abusivas (hasta 20% mensual) sin transparencia. |
| **Tecnología compleja**      | DeFi y Web3 son inaccesibles para emprendedores sin background técnico.              |
| **Sin historial crediticio** | No hay mecanismo para construir reputación financiera fuera del sistema bancario.    |

En Perú, el 70% de las MYPES no acceden a financiamiento formal. VELA cambia esto.

---

## La Solución VELA

### Propuesta de Valor

1. **Perfil Financiero Digital On-Chain**
   - Registro vinculado al RUC del negocio (SUNAT).
   - Wallet Web3 gestionada por VELA (non-custodial: el usuario guarda su seed phrase, VELA abstrae la interfaz).

2. **VelaScore — Reputación Descentralizada**
   - Score crediticio basado en datos del RUC, historial de ventas (auto-declarado/evaluado) y comportamiento de pago on-chain.
   - Crece con el uso: límites de préstamo aumentan conforme el emprendedor demuestra solvencia.

3. **Crédito Directo Transparente**
   - Tasas: **2.5% - 4% mensual** (30-48% TEA), competitivas vs. prestamistas informales.
   - Sin intermediarios abusivos. Todo ejecutado en smart contracts.
   - Límites de monto escalonados por nivel de VelaScore.

4. **Agente IA con Voz**
   - Onboarding guiado por IA (Gemini).
   - Soporte continuo: alertas de pagos, recordatorios, consejos financieros.
   - Voz natural vía ElevenLabs en español peruano.

5. **Suscripción Wallet Web3**
   - $15 USD/año por la gestión de wallet y acceso a la plataforma.
   - Incluye soporte del agente IA y transacciones ilimitadas.

---

## User Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Registro      │────▶│  Agente IA       │────▶│  Vinculación    │
│   (nombre +     │     │  Onboarding      │     │  RUC/SUNAT      │
│   teléfono)     │     │  (voz/texto)     │     │  (identidad)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                         │
                         ┌──────────────────┐            ▼
                         │  Desembolso      │     ┌─────────────────┐
                         │  (USDC/SOL)      │◀────│  VelaScore      │
                         │  en Wallet       │     │  Generado       │
                         └──────────────────┘     └─────────────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │  Pago Cuotas     │
                         │  vía Smart       │
                         │  Contract        │
                         └──────────────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │  Score Mejora    │
                         │  → Más crédito   │
                         └──────────────────┘
```

### Flujo Detallado

1. **Registro:** El emprendedor ingresa nombre y teléfono. Se genera una wallet Solana (non-custodial). VELA muestra la seed phrase para backup.
2. **Onboarding IA:** El agente de IA (con voz ElevenLabs) guía al usuario a responder preguntas sobre su negocio, ingresos y objetivos.
3. **Vinculación RUC:** El sistema consulta la API pública de SUNAT para validar el RUC y extraer datos del negocio (razón social, fecha de inicio, actividad económica, estado).
4. **VelaScore:** Se genera un score inicial basado en: antigüedad del RUC, tipo de actividad, datos declarados de ventas, y comportamiento simulado.
5. **Solicitud de Préstamo:** El usuario solicita un monto dentro de su límite. El smart contract evalúa y aprueba/rechaza automáticamente.
6. **Desembolso:** Los fondos (USDC) se transfieren a la wallet del usuario.
7. **Pagos:** El usuario paga cuotas semanales/mensuales. Cada pago actualiza su historial on-chain.
8. **Reputación:** Pagos puntuales aumentan el VelaScore, desbloqueando mayores montos y mejores tasas.

---

## Arquitectura Técnica

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│                     Next.js + Tailwind                      │
│              @solana/kit (wallet + transacciones)           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND API                          │
│                      Next.js API Routes                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   SUNAT     │  │   Gemini    │  │    ElevenLabs       │  │
│  │   API       │  │   Agent     │  │    Voice API        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    SOLANA DEVNET                            │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐   │
│  │  vela_identity │  │  vela_lending  │  │  vela_score  │   │
│  │  (Anchor)      │  │  (Anchor)      │  │  (Anchor)    │   │
│  └────────────────┘  └────────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Componentes Clave

| Componente          | Tecnología                | Rol                                       |
| ------------------- | ------------------------- | ----------------------------------------- |
| **Frontend**        | Next.js 14 + Tailwind CSS | UI/UX responsive, wallet connection       |
| **Wallet**          | @solana/kit               | Conexión non-custodial (Phantom/Solflare) |
| **Agente IA**       | Gemini API + ElevenLabs   | Chat/voz para onboarding y soporte        |
| **Identidad**       | SUNAT API (Perú)          | Validación de RUC y datos fiscales        |
| **Blockchain**      | Solana Devnet             | Transacciones rápidas y baratas           |
| **Smart Contracts** | Anchor Framework          | Lógica de lending, identidad y scoring    |
| **Tokens**          | USDC (SPL)                | Moneda estable para préstamos             |

---

## Smart Contracts

> **Estado:** Documentado para hackathon. Implementación en progreso.

### 1. `vela_identity` — Registro de Identidad On-Chain

**Propósito:** Vincular un RUC (identidad fiscal peruana) con una wallet Solana, creando una identidad descentralizada verificable.

**Estructuras:**

```rust
#[account]
pub struct BusinessIdentity {
    pub owner: Pubkey,              // Wallet del emprendedor
    pub ruc: String,                // RUC peruano (11 dígitos)
    pub business_name: String,      // Razón social
    pub sunat_verified: bool,       // Validado vía API SUNAT
    pub registration_date: i64,     // Timestamp de registro
    pub bump: u8,
}
```

**Instrucciones:**

| Instrucción            | Parámetros                             | Descripción                                                                               |
| ---------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------- |
| `register_identity`    | `ruc: String`, `business_name: String` | Crea identidad vinculada a la wallet firmante. Requiere verificación off-chain con SUNAT. |
| `verify_sunat`         | `ruc: String`                          | Marca la identidad como verificada (ejecutado por autoridad VELA tras validación).        |
| `update_business_data` | `new_name: String`                     | Actualiza datos del negocio.                                                              |

**Seguridad:**

- Un RUC solo puede vincularse a una wallet.
- Solo la autoridad VELA puede marcar `sunat_verified = true`.
- PDA derivado de `[

#[account]
pub struct VelaScore {
pub owner: Pubkey, // Wallet del emprendedor
pub score: u8, // 0-100
pub loan_count: u32, // Número de préstamos completados
pub total_borrowed: u64, // Total histórico solicitado (lamports)
pub total_repaid: u64, // Total histórico pagado
pub streak_months: u8, // Meses consecutivos de pagos puntuales
pub last_updated: i64, // Timestamp
pub bump: u8,
}

```

**Instrucciones:**

| Instrucción | Parámetros | Descripción |
|-------------|-----------|-------------|
| `initialize_score` | — | Crea VelaScore inicial (40-60 pts basado en RUC). |
| `update_score` | `new_score: u8` | Actualiza score (autoridad VELA, basado en pagos). |
| `record_loan` | `amount: u64` | Registra nuevo préstamo en historial. |
| `record_repayment` | `amount: u64` | Registra pago y recalcula score. |

**Fórmula de Scoring (Off-chain → On-chain):**

```

score_base = 40

- (antigüedad_ruc_años \* 5) // Máx +20
- (streak_meses \* 3) // Máx +30
- (loan_count \* 2) // Máx +10

* (default_count \* 20) // Penalización
  = Score final (0-100)

````

**PDA:** `["vela_score", owner_pubkey]`

---

### 3. `vela_lending` — Core de Préstamos

**Propósito:** Gestionar el ciclo completo de préstamos: solicitud, aprobación, desembolso, pagos y cierre.

**Estructuras:**

```rust
#[account]
pub struct Loan {
    pub borrower: Pubkey,           // Solicitante
    pub amount: u64,                // Monto solicitado (lamports/USDC)
    pub interest_rate: u16,         // Tasa mensual * 100 (ej: 250 = 2.5%)
    pub term_months: u8,            // Plazo en meses
    pub status: LoanStatus,         // Pending / Active / Repaid / Defaulted
    pub created_at: i64,
    pub due_date: i64,
    pub repaid_amount: u64,
    pub bump: u8,
}

pub enum LoanStatus {
    Pending,      // Esperando aprobación
    Active,       // Desembolsado, en pago
    Repaid,       // Completamente pagado
    Defaulted,    // Incumplimiento
}
````

**Instrucciones:**

| Instrucción    | Parámetros                    | Descripción                                                |
| -------------- | ----------------------------- | ---------------------------------------------------------- |
| `request_loan` | `amount: u64`, `term: u8`     | Crea solicitud. Valida límite según VelaScore.             |
| `approve_loan` | `loan_id: u64`                | Aprueba y desembolsa (autoridad VELA o lógica automática). |
| `make_payment` | `loan_id: u64`, `amount: u64` | Registra pago parcial o total.                             |
| `liquidate`    | `loan_id: u64`                | Marca como defaulted si pasa X días de vencimiento.        |

**Límites por Score:**

| VelaScore      | Límite Máximo | Tasa Mensual |
| -------------- | ------------- | ------------ |
| 0-49 (Nuevo)   | $50 USDC      | 4.0%         |
| 50-69 (Bronce) | $200 USDC     | 3.5%         |
| 70-84 (Plata)  | $500 USDC     | 3.0%         |
| 85-100 (Oro)   | $1,500 USDC   | 2.5%         |

**Flujo de Fondos:**

1. VELA mantiene un **Liquidity Pool** (cuenta PDA) con capital semilla.
2. Al aprobarse un préstamo, el programa transfiere USDC del pool a la wallet del borrower.
3. Los pagos del borrower retornan al pool (menos fee de VELA: 1%).
4. El pool se reabastece con capital externo en Fase 2.

---

## Integraciones

### 1. ElevenLabs — Agente de Voz IA

**Track:** Best ElevenLabs Integration  
**Uso:** El agente IA de VELA usa ElevenLabs para generar voz natural en español durante el onboarding y soporte.

**Flujo:**

1. Usuario interactúa con el chatbot (Gemini).
2. Respuestas clave (bienvenida, explicaciones, alertas) se convierten a voz vía ElevenLabs API.
3. Se reproduce en el frontend usando Web Audio API.

**Endpoints:**

- `POST /api/elevenlabs/tts` — Text-to-Speech
- `POST /api/elevenlabs/voice-settings` — Configuración de voz (idioma, tono)

**Configuración:**

- Modelo: `eleven_multilingual_v2`
- Voz: Custom clone o voz predefinida en español latinoamericano
- Latencia: Streaming para respuestas en tiempo real

### 2. SUNAT API (Perú) — Identidad Fiscal

**Uso:** Validación de RUC y extracción de datos del negocio.

**Datos extraídos:**

- Razón social y nombre comercial
- Estado del contribuyente (activo/inactivo)
- Condición (habido/no habido)
- Actividad económica principal (CIIU)
- Fecha de inscripción

**Flujo:**

1. Usuario ingresa RUC (11 dígitos).
2. Backend consulta API pública de SUNAT.
3. Si es válido, se almacenan datos y se genera identidad on-chain.
4. Si es inválido, se rechaza el registro.

**Replicabilidad:** El diseño modular permite adaptar el conector a APIs fiscales de otros países (SAT México, DIAN Colombia, SII Chile).

### 3. Gemini API — Agente de IA Conversacional

**Uso:** Backend del agente IA para lógica conversacional, análisis financiero y generación de respuestas.

**Capacidades:**

- **Onboarding:** Preguntas dinámicas basadas en respuestas previas.
- **Soporte:** Responde dudas sobre pagos, tasas, wallets.
- **Alertas:** Genera recordatorios personalizados de fechas de pago.
- **Análisis:** Recomienda montos de préstamo óptimos según flujo de caja declarado.

**Prompt System:**

```
Eres VELA, un asistente financiero para emprendedores peruanos.
Hablas español claro, sin tecnicismos.
Tu trabajo es: (1) ayudar a crear perfiles, (2) recordar pagos,
(3) explicar cómo funciona la plataforma, (4) dar consejos financieros básicos.
Nunca des asesoría de inversión. Sé empático y alentador.
```

---

## Stack Tecnológico

| Capa                | Tecnología                                              |
| ------------------- | ------------------------------------------------------- |
| **Frontend**        | Next.js 14, React, Tailwind CSS, Framer Motion          |
| **Wallet**          | @solana/kit, Phantom/Solflare adapters                  |
| **Smart Contracts** | Rust, Anchor Framework v0.30                            |
| **Blockchain**      | Solana Devnet (mainnet post-hackathon)                  |
| **Token**           | USDC (SPL Token)                                        |
| **Agente IA**       | Gemini 1.5 Pro (texto), ElevenLabs (voz)                |
| **Identidad**       | SUNAT API (Perú)                                        |
| **Almacenamiento**  | PostgreSQL (datos off-chain), Arweave/IPFS (documentos) |
| **Hosting**         | Vercel                                                  |

---

## Roadmap

### Fase 1: MVP — Hackathon (Ahora)

- [x] Landing page y diseño de marca
- [ ] Smart contracts documentados (identity, lending, score)
- [ ] Deploy en Solana Devnet
- [ ] Wallet connection con @solana/kit
- [ ] Integración ElevenLabs (voz del agente)
- [ ] Integración Gemini (chatbot)
- [ ] Demo funcional (solicitud de préstamo simulado)

### Fase 2: Lanzamiento Beta (3 meses post-hackathon)

- [ ] Integración SUNAT API (validación RUC en producción)
- [ ] Sistema de scoring automático con datos reales
- [ ] Préstamos reales en Devnet con capital semilla
- [ ] App móvil (PWA / React Native)
- [ ] KYC ligero (documento de identidad)

### Fase 3: Crecimiento (6-12 meses)

- [ ] Lanzamiento en Solana Mainnet
- [ ] Token nativo $VELA (gobierno, staking, recompensas)
- [ ] Marketplace de prestamistas (liquidity pools externas)
- [ ] Expansión a México, Colombia, Chile
- [ ] Integración con pasarelas de pago fiat (Yape, Plin, PSE)

### Fase 4: DeFi Completo (12+ meses)

- [ ] VELA DAO: gobernanza descentralizada
- [ ] Liquidity pools abiertas para cualquier prestamista
- [ ] Integración cross-chain (Wormhole, deBridge)
- [ ] Seguros de préstamo (credit default swaps)

---

## Hackathon Tracks

### ✅ Best App Overall on Solana ($10,000 pool)

**Por qué aplicamos:**

- Programa único en Rust/Anchor con lógica de lending real.
- Deploy en devnet con addresses públicos.
- Uso intensivo de Solana SDK (`@solana/kit`, SPL Token, PDAs).
- Caso de uso real e impacto social: financiamiento para emprendedores informales en LATAM.

**Entregables:**

- Repo público con README completo
- Contratos deployados en devnet
- Demo video < 3 minutos
- Demo funcional en vivo

### ✅ Best ElevenLabs Integration (3 meses Scale tier)

**Por qué aplicamos:**

- El agente IA de VELA usa ElevenLabs como core de la experiencia de usuario.
- Voz natural en español para onboarding de emprendedores no técnicos.
- Reduce barreras de adopción: no necesitan leer textos complejos.

**Entregables:**

- README explicando integración exacta (Widget/SDK/API)
- Demo de flujo de voz en la app
- Configuración de voz personalizada

### ❌ Best Cross-Chain Solana UX powered by LI.FI

**Por qué NO aplicamos:**

- VELA es un lending platform local. El core no requiere swaps/bridging cross-chain.
- Forzar esta integración sería scope innecesario para el MVP.
- _Futuro:_ Podría agregarse para que prestamistas depositen liquidez desde Ethereum/Base.

### ❌ Best AI Agent into Physical World

**Por qué NO aplicamos:**

- VELA es 100% software. No hay componente robótico ni físico.

### ❌ Best Mobile App Built on Solana Mobile

**Por qué NO aplicamos:**

- Actualmente es web app (Next.js). No es APK nativo de Android ni usa Solana Mobile Stack.
- _Futuro:_ Planeamos app móvil nativa en Fase 2.

### ❓ Best x402 on Solana ($500 bonus)

**Por qué no enfocamos aquí:**

- El modelo de VELA es suscripción anual fija ($15), no streaming de pagos.
- x402 no encaja naturalmente en el flujo de lending.
- _Nota:_ Podría explorarse para cobro por minuto de consultoría IA, pero no es prioridad.

---

## Setup Local

### Requisitos

- Node.js 18+
- Rust + Anchor CLI 0.30+
- Solana CLI 1.18+
- PostgreSQL 15+ (opcional, para datos off-chain)

### 1. Clonar y instalar

```bash
git clone https://github.com/[tu-org]/vela.git
cd vela
npm install
```

### 2. Configurar variables de entorno

Crear `.env.local`:

```env
# Solana
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com

# Gemini
GEMINI_API_KEY=your_gemini_api_key

# ElevenLabs
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_ID=your_voice_id

# SUNAT (mock para dev)
SUNAT_API_URL=https://api.apis.net.pe/v2/sunat/ruc
SUNAT_API_TOKEN=your_token

# Database (opcional)
DATABASE_URL=postgresql://user:pass@localhost:5432/vela
```

### 3. Compilar smart contracts

```bash
cd programs/vela_identity
anchor build
cd ../vela_lending
anchor build
cd ../vela_score
anchor build
```

### 4. Deploy en devnet

```bash
solana config set --url devnet
solana airdrop 2  # Necesitas SOL para deploy

cd programs/vela_identity
anchor deploy
cd ../vela_lending
anchor deploy
cd ../vela_score
anchor deploy
```

Actualizar `lib.rs` y `.env` con las nuevas addresses.

### 5. Ejecutar frontend

```bash
npm run dev
# Abre http://localhost:3000
```

---

## Deploy en Devnet

### Program IDs (Actualizar tras deploy)

| Programa        | Devnet Address | Versión |
| --------------- | -------------- | ------- |
| `vela_identity` | `TBD`          | v0.1.0  |
| `vela_lending`  | `TBD`          | v0.1.0  |
| `vela_score`    | `TBD`          | v0.1.0  |

### Verificar deploy

```bash
solana program show <PROGRAM_ID> --url devnet
```

---

## Equipo

**VELA** — _Empoderando emprendedores, un paso a la vez._

| Rol                   | Responsabilidad                                |
| --------------------- | ---------------------------------------------- |
| **Producto & Diseño** | UX/UI, estrategia, modelo de negocio           |
| **Smart Contracts**   | Rust/Anchor, seguridad, arquitectura on-chain  |
| **Frontend**          | Next.js, wallet integration, diseño responsive |
| **Backend & IA**      | Gemini, ElevenLabs, SUNAT API, base de datos   |
| **Growth**            | Alianzas, comunidad, expansión LATAM           |

---

## Licencia

MIT — Open source para la comunidad.

---

## Contacto

- **Web:** [velaweb3.lovable.app](https://velaweb3.lovable.app)
- **Demo:** [Enlace a demo funcional]
- **Video:** [Enlace a demo video (máx. 3 min)]
- **Twitter/X:** @velaweb3
- **Email:** hola@velaweb3.com

**Built with ❤️ on Solana for LATAM.**
