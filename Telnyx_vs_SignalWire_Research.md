# Telnyx vs SignalWire — In-Depth Research & Comparison

> **Prepared for**: OneRx / RX-Connect  
> **Date**: May 29, 2026  
> **Purpose**: Evaluate Telnyx and SignalWire as CPaaS providers for voice, messaging, video, and AI capabilities.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Platform Overview](#platform-overview)
3. [Architecture & Infrastructure](#architecture--infrastructure)
4. [Pricing Comparison](#pricing-comparison)
5. [Feature Comparison Matrix](#feature-comparison-matrix)
6. [Pros & Cons — Telnyx](#pros--cons--telnyx)
7. [Pros & Cons — SignalWire](#pros--cons--signalwire)
8. [SDK & Developer Experience](#sdk--developer-experience)
9. [AI Voice Agent Capabilities](#ai-voice-agent-capabilities)
10. [Video API Capabilities](#video-api-capabilities)
11. [Compliance & Security](#compliance--security)
12. [Implementation Videos & Tutorials](#implementation-videos--tutorials)
13. [Use Cases & Best Fit](#use-cases--best-fit)
14. [Final Recommendation](#final-recommendation)

---

## Executive Summary

| Criteria            | Telnyx                                                  | SignalWire                                             |
| ------------------- | ------------------------------------------------------- | ------------------------------------------------------ |
| **Founded By**      | David Casem (2009)                                      | Anthony Minessale — Creator of FreeSWITCH              |
| **Core Strength**   | Private global IP network, carrier-owned infrastructure | Unified control plane built on FreeSWITCH              |
| **Pricing Model**   | Pay-as-you-go, automatic volume discounts               | Pay-as-you-go, flat AI runtime                         |
| **Gartner MQ 2026** | Niche Player (first appearance)                         | Not listed                                             |
| **Best For**        | Cost-sensitive, high-volume production voice/SMS        | Programmable multi-agent AI workflows, contact centers |
| **AI Agent Cost**   | ~$0.06/min STT+TTS + $0.025/min LLM                     | $0.16/min all-in (STT + LLM + TTS + orchestration)     |
| **HIPAA**           | Conduit exception; BAA available on request             | Full BAA coverage at $1,000/month                      |

---

## Platform Overview

### Telnyx

Telnyx is a developer-first CPaaS that operates its **own private, global Tier 1 carrier network** spanning 60+ countries with 17 Points of Presence. Unlike most CPaaS providers that resell capacity from third-party carriers, Telnyx owns and operates the entire stack — from the physical network to the API layer. This gives them direct control over routing, latency, and call quality.

Key differentiators:

- Licensed carrier in 25+ countries
- Private global IP backbone (not public internet)
- Sub-200ms round-trip latency for voice AI
- GPU-collocated inference alongside telecom PoPs
- 99.999% uptime SLA

### SignalWire

SignalWire is a programmable unified communications platform built by the **creators of FreeSWITCH** (the world's most widely deployed open-source telephony engine). Rather than just exposing transport APIs, SignalWire provides a **communications control plane** that manages the full lifecycle of real-time interactions — state, routing, media processing, and AI — in a single infrastructure layer.

Key differentiators:

- Built on FreeSWITCH with carrier-scale cloud orchestration
- Unified control plane (media engine + orchestration in one layer)
- System-Directed AI (deterministic constraints the AI model cannot bypass)
- SWML (SignalWire Markup Language) for declarative agent definitions
- Native multi-agent workflows with the Agents SDK

---

## Architecture & Infrastructure

### Telnyx Architecture

```
┌──────────────────────────────────────────────────┐
│                 Telnyx Stack                      │
├──────────────────────────────────────────────────┤
│  API Layer (RESTful)                             │
│  ├── Voice API  ├── Messaging API                │
│  ├── Video API  ├── AI Assistants API            │
│  └── SIP Trunking  └── Wireless/IoT             │
├──────────────────────────────────────────────────┤
│  AI Inference Layer (GPU-Collocated)             │
│  ├── STT  ├── TTS  ├── LLM (Open-weight models) │
├──────────────────────────────────────────────────┤
│  Private Global IP Network                       │
│  ├── 17 PoPs  ├── 60+ Countries                 │
│  └── Tier 1 Carrier Peering                     │
└──────────────────────────────────────────────────┘
```

- **Owned infrastructure end-to-end**: network, GPUs, carrier licenses
- **Co-located GPU + telecom** means audio never leaves the private backbone for AI processing
- Lower latency achieved through fewer network hops and direct carrier peering

### SignalWire Architecture

```
┌──────────────────────────────────────────────────┐
│              SignalWire Stack                     │
├──────────────────────────────────────────────────┤
│  Control Plane (Orchestration Layer)             │
│  ├── State Management  ├── Routing               │
│  ├── Compliance/Governance  ├── Billing          │
│  └── System-Directed AI Constraints              │
├──────────────────────────────────────────────────┤
│  Media Engine (FreeSWITCH-based)                 │
│  ├── AI Kernel (STT + LLM + TTS inline)         │
│  ├── Call Control  ├── Conferencing              │
│  ├── Recording  ├── IVR  ├── Queuing            │
│  ├── Messaging  ├── Fax  ├── Payments            │
│  └── Video (WebRTC)                              │
├──────────────────────────────────────────────────┤
│  Interfaces                                      │
│  ├── SWML (Markup)  ├── Agents SDK (Python)      │
│  ├── Browser SDK (JS)  ├── REST APIs             │
│  └── Compatibility API (Twilio migration)        │
└──────────────────────────────────────────────────┘
```

- **Two-layer architecture**: Control Plane (governance) + Media Engine (processing)
- AI runs _inside_ the media engine, not as an external service
- One set of logs, one state model, one failure domain
- The control plane enforces constraints the AI model cannot see or circumvent

---

## Pricing Comparison

### Voice Pricing

| Service                | Telnyx                                           | SignalWire  |
| ---------------------- | ------------------------------------------------ | ----------- |
| **Local Inbound**      | $0.0035/min (SIP Trunk) / $0.002/min (Voice API) | $0.0066/min |
| **Local Outbound**     | $0.005/min (SIP Trunk) / $0.007/min (Voice API)  | $0.0080/min |
| **Toll-Free Inbound**  | $0.015/min                                       | $0.0147/min |
| **Toll-Free Outbound** | —                                                | $0.0069/min |
| **SIP/WebRTC**         | Included in Voice API rates                      | $0.003/min  |
| **Call Recording**     | Usage-based                                      | $0.002/min  |

### Messaging Pricing

| Service                  | Telnyx     | SignalWire        |
| ------------------------ | ---------- | ----------------- |
| **Local SMS (Outbound)** | $0.004/msg | $0.00415/msg      |
| **Toll-Free SMS**        | $0.004/msg | $0.00680/msg      |
| **Short Code SMS**       | $0.004/msg | $0.00650/msg      |
| **MMS**                  | $0.01/msg  | Per-carrier rates |

### Video Pricing

| Service             | Telnyx                      | SignalWire              |
| ------------------- | --------------------------- | ----------------------- |
| **Standard (720p)** | Usage-based (contact sales) | $0.0045/min/participant |
| **Full HD (1080p)** | Usage-based (contact sales) | $0.0050/min/participant |

### AI Agent Pricing

| Component            | Telnyx                                  | SignalWire                                              |
| -------------------- | --------------------------------------- | ------------------------------------------------------- |
| **STT + TTS**        | $0.06/min combined                      | Included in runtime                                     |
| **LLM Inference**    | $0.025/min (open-weight on Telnyx GPUs) | Included in runtime                                     |
| **AI Agent Runtime** | ~$0.085–0.11/min total                  | $0.16/min all-in                                        |
| **Orchestration**    | Free (self-managed)                     | Included in runtime                                     |
| **What's Included**  | STT, TTS, LLM (pay separately)          | STT, LLM, orchestration, standard TTS, agent memory/RAG |

### Phone Numbers

| Type           | Telnyx           | SignalWire    |
| -------------- | ---------------- | ------------- |
| **Local DID**  | From $1/month    | From $1/month |
| **Toll-Free**  | From $1.50/month | From $2/month |
| **Short Code** | ~$1,000/month    | Contact sales |

### Additional Costs

| Feature                               | Telnyx                                     | SignalWire                     |
| ------------------------------------- | ------------------------------------------ | ------------------------------ |
| **HIPAA BAA**                         | Free (conduit exception) or BAA on request | $1,000/month (12-month commit) |
| **E911**                              | $0.75/month                                | $0.75/month                    |
| **CNAM Lookup**                       | $0.008                                     | $0.008                         |
| **Number Lookup**                     | $0.005                                     | $0.005                         |
| **AMD (Answering Machine Detection)** | Available                                  | $0.006/call                    |

---

## Feature Comparison Matrix

| Feature                      | Telnyx                                  | SignalWire                           |
| ---------------------------- | --------------------------------------- | ------------------------------------ |
| **Voice (PSTN)**             | ✅                                      | ✅                                   |
| **SIP Trunking**             | ✅ (Elastic)                            | ✅                                   |
| **WebRTC**                   | ✅                                      | ✅                                   |
| **SMS (A2P/P2P)**            | ✅                                      | ✅                                   |
| **MMS**                      | ✅                                      | ✅                                   |
| **Video API**                | ✅ (Rooms-based)                        | ✅ (Rooms-based)                     |
| **Fax**                      | ✅                                      | ✅                                   |
| **AI Voice Agents**          | ✅ (No-code + API)                      | ✅ (SWML + Agents SDK)               |
| **STT (Speech-to-Text)**     | ✅ (Native, on-network)                 | ✅ (Native, inline)                  |
| **TTS (Text-to-Speech)**     | ✅ (Native, on-network)                 | ✅ (Standard + Premium + ElevenLabs) |
| **LLM Inference**            | ✅ (On Telnyx GPUs, open-weight models) | ✅ (Platform-managed)                |
| **RAG / Knowledge Base**     | ✅ (via AI Assistants)                  | ✅ (Datasphere API)                  |
| **No-Code Agent Builder**    | ✅ (Mission Control Portal)             | ✅ (Dashboard AI Agents)             |
| **Multi-Agent Workflows**    | Limited                                 | ✅ (Native, multi-agent SDK)         |
| **SWML / Markup Language**   | TeXML (TwiML-compatible)                | ✅ SWML (native)                     |
| **Twilio Migration Path**    | ✅ (TeXML compatibility)                | ✅ (Compatibility API)               |
| **Wireless / IoT / eSIM**    | ✅                                      | ❌                                   |
| **WhatsApp Business**        | ❌                                      | ❌                                   |
| **Contact Center (CCaaS)**   | ❌                                      | ✅ (Programmable)                    |
| **Drag-and-Drop Call Flows** | ❌                                      | ✅ (Call Flow Builder)               |
| **FreeSWITCH Integration**   | ❌                                      | ✅ (Native, mod_signalwire)          |

---

## Pros & Cons — Telnyx

### Pros

1. **Owned Private Network**: Operates its own global Tier 1 carrier network across 60+ countries, resulting in lower latency (~sub-200ms RTT) and higher reliability vs. public internet-based competitors.

2. **Significantly Lower Voice/SMS Costs**: Voice API starts at $0.002/min — typically 40–70% cheaper than Twilio. SMS at $0.004/msg. Automatic volume discounts as usage scales.

3. **Full-Stack AI Infrastructure**: The only CPaaS that runs LLM inference, STT, and TTS on the same private network as the call. No vendor-stitching required for AI agents.

4. **Transparent Pricing**: No hidden fees, no per-seat licenses. Pay only for what you use with clear published rates.

5. **Extensive SDK Support**: SDKs available in Python, Node.js, Ruby, C#, PHP, Go. Comprehensive REST API documentation rated 4.8/5 by Gartner for developer tooling.

6. **No-Code AI Assistant Builder**: Build, test, and deploy voice AI agents directly in the Mission Control Portal without writing code. In-browser testing simulator included.

7. **Strong Compliance Posture**: SOC 2 Type I & II, SOC 3, ISO 27001. HIPAA conduit exception (no mandatory BAA). PCI DSS compliant. GDPR compliant with EU-deployed infrastructure.

8. **Video API with Mobile SDKs**: WebRTC-based Video Rooms with JavaScript, iOS, and Android SDKs. Bandwidth control per stream.

9. **Elastic SIP Trunking**: Scale unlimited concurrent calls without capacity planning. Channel-based pricing available.

10. **Wireless & IoT**: Unique offering — eSIM and IoT connectivity from $0.70/eSIM, which competitors do not offer.

### Cons

1. **Steep Learning Curve**: Initial setup can be complex for non-technical users. Advanced use cases require significant developer expertise.

2. **Limited Multi-Agent AI Workflows**: AI agent capabilities are primarily single-agent. No native multi-agent orchestration framework comparable to SignalWire's Agents SDK.

3. **No Native Contact Center**: Does not offer a built-in CCaaS solution. Must build custom or integrate third-party.

4. **Limited Vertical Features**: No CDP integrations, no native payment processing, no drag-and-drop call flow builder.

5. **Geographic Support Gaps**: Local support and billing infrastructure limited outside North America and Europe.

6. **Newer AI Features Not Battle-Tested**: AI voice agent platform is relatively new (launched 2024/2025). May not be as mature for complex production AI workflows.

7. **Mixed Support Reviews**: While 24/7 support is available, some users report delays and inconsistent response quality at scale.

8. **Video API Maturity**: Video product is less feature-rich compared to dedicated video platforms. No screen sharing or advanced layout controls documented publicly.

9. **No WhatsApp Business API**: Messaging limited to SMS/MMS. No omnichannel messaging support for WhatsApp, Viber, etc.

10. **No FreeSWITCH Integration**: Cannot natively integrate with existing FreeSWITCH deployments.

---

## Pros & Cons — SignalWire

### Pros

1. **Built by FreeSWITCH Creators**: Deep telephony expertise from the team that built the world's most deployed open-source telecom engine. Production-proven media processing.

2. **Unified Control Plane Architecture**: Single platform handles state, routing, media, and AI — no stitching together separate services. One set of logs, one failure domain.

3. **Powerful AI Agents SDK**: Python-based framework for building sophisticated multi-agent voice AI systems. Prompt Object Model, SWAIG function integration, and CLI testing tools.

4. **SWML (SignalWire Markup Language)**: Declarative JSON/YAML for defining agent behavior. Can be static or dynamically generated from your own server.

5. **System-Directed AI**: Deterministic constraints enforced at the control plane level — the AI model cannot see or circumvent governance rules. Critical for compliance-heavy use cases.

6. **All-In AI Pricing**: $0.16/min covers STT, LLM, orchestration, and standard TTS. Predictable costs with no token-burn surprises.

7. **Native Multi-Agent Support**: Built-in support for multi-agent workflows, context switching, step navigation, and agent hand-offs.

8. **Twilio Migration Path**: Drop-in Compatibility API for TwiML-based applications. Easier migration for teams moving off Twilio.

9. **Comprehensive Compliance**: SOC 2 Type II, ISO 27001:2022, PCI-DSS, HIPAA with full BAA coverage across voice, messaging, AI, video, and fax.

10. **Contact Center Capabilities**: Programmable contact center toolkit with AI-powered routing, analytics, and escalation — no third-party CCaaS needed.

11. **FreeSWITCH Integration**: Native `mod_signalwire` module allows existing FreeSWITCH deployments to extend to SignalWire cloud seamlessly.

12. **Drag-and-Drop Call Flows**: Visual call flow builder in the Dashboard for non-technical users.

### Cons

1. **Higher AI Agent Cost**: At $0.16/min all-in, AI agents are roughly 1.5–2x more expensive than Telnyx's unbundled pricing (~$0.085–0.11/min).

2. **Smaller Developer Community**: Significantly smaller ecosystem compared to Twilio or even Telnyx. Fewer third-party integrations, tutorials, and Stack Overflow answers.

3. **Steeper Architecture Learning Curve**: The control plane / media engine / SWML / SWAIG paradigm requires understanding SignalWire's unique architectural concepts.

4. **HIPAA BAA Cost**: $1,000/month for HIPAA BAA coverage (12-month commitment). Telnyx offers conduit exception at no extra cost.

5. **Hidden Billing Concerns**: Some users report 1-minute billing increments and charges for 2 legs on the same call, making inbound calls more expensive than expected (~$0.007 minimum per inbound call).

6. **No Wireless / IoT**: No eSIM, IoT connectivity, or wireless data offerings.

7. **Python-Centric SDK**: The Agents SDK is Python-only. Teams using Node.js, Ruby, or other languages have fewer options for AI agent development.

8. **Limited Global Carrier Coverage**: Less transparent about direct carrier relationships compared to Telnyx's 25+ country licensed carrier status.

9. **Mixed Customer Service Reviews**: Some users report poor customer service experiences, particularly around billing disputes and account verification requirements.

10. **Video API Less Documented**: While functional, the Video API has less public documentation and fewer example applications compared to Telnyx or dedicated video platforms.

---

## SDK & Developer Experience

### Telnyx SDKs

| SDK        | Language     | Package                            |
| ---------- | ------------ | ---------------------------------- |
| Server SDK | Node.js      | `telnyx` (npm)                     |
| Server SDK | Python       | `telnyx` (pip)                     |
| Server SDK | Ruby         | `telnyx` (gem)                     |
| Server SDK | C#           | `Telnyx.net` (NuGet)               |
| Server SDK | PHP          | `telnyx/telnyx-php` (Composer)     |
| Server SDK | Go           | `github.com/team-telnyx/telnyx-go` |
| Video SDK  | JavaScript   | `@telnyx/video` (npm)              |
| Video SDK  | iOS          | CocoaPods / SPM                    |
| Video SDK  | Android      | Jitpack                            |
| Voice SDK  | React Native | `@telnyx/react-native`             |

**Developer Resources**:

- Developer Center: https://developers.telnyx.com
- API Reference: Full OpenAPI spec available
- Mission Control Portal: Self-service GUI
- GitHub: https://github.com/team-telnyx (sample apps, SDKs)
- Community Slack channel

### SignalWire SDKs

| SDK               | Language       | Package                          |
| ----------------- | -------------- | -------------------------------- |
| Agents SDK        | Python         | `signalwire-agents` (pip)        |
| Server SDK        | Python         | `signalwire` (pip)               |
| Server SDK        | Node.js        | `@signalwire/realtime-api` (npm) |
| Browser SDK       | JavaScript     | `@signalwire/js` (npm)           |
| Compatibility SDK | Python/Node.js | Drop-in Twilio replacement       |
| CLI Tool          | Python         | `swaig-test` (agent testing)     |

**Developer Resources**:

- Developer Portal: https://developer.signalwire.com
- New Docs Site: https://signalwire.com/docs
- API Reference: REST APIs for voice, video, messaging, AI
- GitHub: https://github.com/signalwire (SDKs, examples, guides)
- Discord Community: 8,000+ developers
- "SignalWire in Seconds" video series

---

## AI Voice Agent Capabilities

### Telnyx AI Agents

**Approach**: Full-stack, no-code + API. AI inference runs on Telnyx-owned GPUs co-located with telecom PoPs.

- **No-Code Builder**: Create agents in Mission Control Portal with natural language instructions
- **Templates**: Customer Support Specialist, Lead Qualification, Appointment Scheduler
- **Voice Configuration**: Multiple TTS voices, speed/pitch control
- **Knowledge Base**: Upload documents for RAG-style grounding
- **Tools**: Call transfer, SMS sending, hangup, custom webhooks
- **Testing**: In-browser simulator for real-time agent testing
- **Outbound Calls**: API-driven outbound via `/v2/texml/ai_calls/`
- **MMS Integration**: Send images/media during voice calls
- **Latency**: Sub-200ms RTT (industry-leading due to co-located GPU + network)

**Pricing Breakdown**:

- STT + TTS: $0.06/min combined
- LLM (open-weight models on Telnyx GPUs): $0.025/min
- SIP transport: separate (from $0.002/min)
- **Estimated total**: ~$0.085–0.11/min

### SignalWire AI Agents

**Approach**: Programmable multi-agent framework. AI kernel runs inside the media engine.

- **SWML (Markup)**: Define agent behavior as JSON/YAML — static or dynamic from your server
- **Agents SDK (Python)**: Full programmatic control with class-based agent definitions
- **Prompt Object Model (POM)**: Structured, composable prompting system
- **SWAIG Functions**: Real-time API integration via `@SWAIGFunction` decorator
- **Multi-Agent**: Native support for context switching, step navigation, agent hand-offs
- **Datasphere**: Built-in RAG with controlled knowledge base
- **System-Directed AI**: Deterministic constraints at the control plane level
- **Testing**: `swaig-test` CLI tool for local simulation
- **Pre-Built Examples**: Restaurant booking (Bobby's Table), Bartender (Kevin), Personal Assistant (Ethan)
- **Latency**: 800–1200ms typical (orchestration overhead eliminated by inline AI kernel)

**Pricing**:

- All-in runtime: $0.16/min (includes STT, LLM, orchestration, standard TTS)
- Voice transport: separate (from $0.003/min SIP)
- Premium TTS / ElevenLabs: additional per-character cost
- **Estimated total**: ~$0.163–0.168/min

---

## Video API Capabilities

### Telnyx Video

- **Model**: Room-based (create rooms, generate JWT tokens, participants join)
- **Protocol**: WebRTC
- **SDKs**: JavaScript (`@telnyx/video`), iOS, Android
- **Features**:
  - Room creation via REST API (`POST /v2/rooms`)
  - Client Join Tokens (JWT, short-lived with refresh)
  - Audio/video track sharing between participants
  - Bandwidth control per stream (mobile SDKs)
  - Recording support
  - Max participants configurable per room
- **Sample Apps**:
  - `telnyx-meet` (NextJS — Zoom-like app)
  - `frontend-video-js` (Vanilla JS example)
- **Network Advantage**: Video runs on Telnyx's private IP backbone

### SignalWire Video

- **Model**: Room-based (create rooms, generate tokens, participants join)
- **Protocol**: WebRTC
- **SDKs**: JavaScript (`@signalwire/js` Browser SDK)
- **Features**:
  - Room creation via REST API (`/api/video/rooms`)
  - Room Tokens with granular permissions (moderator vs. participant)
  - Room Session management (list active sessions, participant tracking)
  - Audio-only mode (Clubhouse-like apps)
  - SIP/PSTN integration (dial out to phone numbers from video rooms)
  - Recording support
- **Sample Apps**:
  - Zoom-like clone (React + Node.js)
  - Clubhouse-like audio app (React + Node.js)
  - Simple video demo (Vanilla JS + Node.js)
- **Pricing Advantage**: Published transparent rates ($0.0045/min/participant at 720p)

---

## Compliance & Security

| Certification / Standard  | Telnyx                                 | SignalWire                   |
| ------------------------- | -------------------------------------- | ---------------------------- |
| **SOC 2 Type I**          | ✅                                     | —                            |
| **SOC 2 Type II**         | ✅                                     | ✅                           |
| **SOC 3**                 | ✅                                     | —                            |
| **ISO 27001**             | ✅ (2013)                              | ✅ (2022)                    |
| **HIPAA**                 | ✅ (Conduit exception; BAA on request) | ✅ (Full BAA — $1,000/month) |
| **PCI DSS**               | ✅ Compliant                           | ✅ Aligned                   |
| **GDPR**                  | ✅ (EU-deployed infra)                 | ✅                           |
| **CCPA**                  | ✅                                     | ✅                           |
| **STIR/SHAKEN**           | ✅ (A-attestation)                     | ✅                           |
| **Encryption (TLS/SRTP)** | ✅ (TLS 1.2+, SRTP)                    | ✅                           |
| **Fraud Detection**       | ✅ (Built-in)                          | ✅                           |

### Healthcare (HIPAA) Considerations

**Telnyx**:

- Falls under the HIPAA _conduit exception_ — similar to postal service or private courier
- No mandatory BAA required for most telecom services
- BAA available upon request for customers who need it
- TLS encryption for signaling, SRTP for voice media
- Streamlined compliance process

**SignalWire**:

- Full HIPAA compliance with dedicated BAA
- BAA covers voice, messaging, AI, video, and fax
- Cost: $1,000/month (12-month commitment)
- Encryption, access controls, audit logging built into platform
- More comprehensive for use cases where PHI is stored/processed (not just transmitted)

---

## Implementation Videos & Tutorials

### Telnyx Videos

| Title                                                             | Type                       | Link                                                                               |
| ----------------------------------------------------------------- | -------------------------- | ---------------------------------------------------------------------------------- |
| **How to Build a No-Code AI Assistant**                           | YouTube (2:48)             | https://www.youtube.com/watch?v=6ygdGTxkRpI                                        |
| **Building A Voice AI Agent and WebApp From Scratch With Telnyx** | YouTube (full walkthrough) | https://www.youtube.com/watch?v=l01FFvCe5Js                                        |
| **Voice Assistant Quickstart (embedded video)**                   | Developer Docs             | https://developers.telnyx.com/docs/inference/ai-assistants/no-code-voice-assistant |
| **Video Rooms Quickstart**                                        | Developer Docs             | https://developers.telnyx.com/docs/video/get-started                               |
| **Getting Started with Video JavaScript SDK**                     | Developer Docs             | https://telnyx.com/products/video-api                                              |
| **Telnyx Meet (NextJS Sample App)**                               | GitHub                     | https://github.com/team-telnyx/telnyx-meet                                         |
| **Frontend Video JS (Vanilla JS Sample)**                         | GitHub                     | https://github.com/team-telnyx/frontend-video-js                                   |

### SignalWire Videos

| Title                                                               | Type                     | Link                                                                                |
| ------------------------------------------------------------------- | ------------------------ | ----------------------------------------------------------------------------------- |
| **SignalWire in Seconds: Building an AI Agent from SWML + Node.js** | Blog + Video             | https://signalwire.com/signalwire-in-seconds/building-an-ai-agent-from-swml-node-js |
| **LiveWIRE Webinar: Deploying AI Voice Agents**                     | Webinar Recording        | https://signalwire.com/blogs/product/deploying-ai-voice-agents                      |
| **Voice AI in 50 Lines of Python**                                  | Landing Page + Demo      | https://signalwire.com/c/50-lines-of-python                                         |
| **Make a Zoom-like Application**                                    | Tutorial Guide           | https://signalwire.com/docs/browser-sdk/js/guides/zoom-like-application             |
| **Build a Video Calling App (Browser SDK)**                         | Tutorial Guide           | https://signalwire.com/docs/browser-sdk/js/guides/build-a-video-app                 |
| **Make a Clubhouse-like Application**                               | Tutorial Guide + YouTube | https://signalwire.com/docs/browser-sdk/js/guides/clubhouse-like-application        |
| **Simple Video Demo**                                               | Tutorial Guide           | https://developer.signalwire.com/video/getting-started/simple-video-demo.md         |
| **AI Agents SDK Introduction**                                      | Blog                     | https://signalwire.com/blogs/developers/introducing-signalwire-ai-agents-sdk        |
| **SWAIG 101: Voice AI Function Integration**                        | Blog                     | https://signalwire.com/blogs/developers/swaig-101-ai-function-integration           |
| **Build an AI Personal Assistant (Ethan)**                          | Blog + GitHub            | https://signalwire.com/blogs/developers/ai-personal-assistant                       |
| **Fred Bot Tutorial (Multi-Agent)**                                 | GitHub SDK               | https://github.com/signalwire/signalwire-python                                     |

### Quick-Start Code Samples

#### Telnyx — Create a Video Room (Node.js)

```javascript
import Telnyx from 'telnyx';

const client = new Telnyx({
  apiKey: process.env['TELNYX_API_KEY'],
});

const room = await client.rooms.create({
  enable_recording: true,
  max_participants: 10,
});

console.log(room.data);
```

#### SignalWire — AI Voice Agent (Python, 50 lines)

```python
from signalwire_agents import AgentBase

class MyAgent(AgentBase):
    def __init__(self):
        super().__init__(name="my-agent")
        self.prompt_add_section("Role", body="You are a helpful assistant for OneRx pharmacy.")
        self.prompt_add_section("Rules", body="Always verify patient identity before sharing info.")

agent = MyAgent()
agent.run()
```

#### SignalWire — SWML AI Agent Definition (YAML)

```yaml
version: 1.0.0
sections:
  main:
    - ai:
        post_prompt_url: https://your-server.com/post-prompt
        params:
          save_conversation: true
        prompt:
          text: |
            You are a pharmacy assistant for OneRx.
            Help callers with prescription status, refill requests, and store hours.
            Always verify the caller's date of birth before discussing any prescription details.
        SWAIG:
          functions:
            - function: check_prescription
              description: Look up a prescription by RX number
              parameters:
                type: object
                properties:
                  rx_number:
                    type: string
                    description: The prescription number to look up
```

---

## Use Cases & Best Fit

### When to Choose Telnyx

| Use Case                      | Why Telnyx                                                          |
| ----------------------------- | ------------------------------------------------------------------- |
| **High-volume voice/SMS**     | 40–70% cheaper than Twilio. Automatic volume discounts.             |
| **Low-latency voice AI**      | Sub-200ms RTT on co-located GPU + carrier network.                  |
| **Global telephony**          | Licensed carrier in 25+ countries. 60+ country number coverage.     |
| **Cost-sensitive AI agents**  | ~$0.085–0.11/min vs $0.16/min on SignalWire.                        |
| **Simple single-agent AI**    | No-code builder with templates. Deploy in minutes.                  |
| **SIP Trunking**              | Elastic SIP with unlimited concurrent calls, channel-based pricing. |
| **IoT / Wireless**            | Only CPaaS offering eSIM and wireless data.                         |
| **Twilio replacement (cost)** | TeXML compatibility + major cost savings.                           |
| **Healthcare (basic)**        | HIPAA conduit exception — no BAA cost required.                     |

### When to Choose SignalWire

| Use Case                          | Why SignalWire                                                   |
| --------------------------------- | ---------------------------------------------------------------- |
| **Complex AI agent workflows**    | Multi-agent SDK, context switching, SWAIG functions.             |
| **Contact center (programmable)** | Built-in CCaaS capabilities with AI routing.                     |
| **FreeSWITCH migration**          | Native integration via mod_signalwire. Same team.                |
| **Compliance-heavy AI**           | System-Directed AI with deterministic control plane constraints. |
| **Full-stack HIPAA**              | Comprehensive BAA covering voice, messaging, AI, video, fax.     |
| **Predictable AI costs**          | $0.16/min all-in — no token-burn surprises.                      |
| **Twilio migration (code)**       | Drop-in Compatibility API for TwiML apps.                        |
| **Video conferencing**            | Transparent pricing, Zoom-clone tutorials, SIP/PSTN dial-out.    |
| **Rapid prototyping**             | SWML + Dashboard AI agents for no-code deployment.               |
| **Audio-only apps**               | Proven patterns (Clubhouse clone) with Browser SDK.              |

---

## Final Recommendation

### For OneRx / RX-Connect

Given that this is a **healthcare/pharmacy application**, here are the key considerations:

| Factor             | Telnyx Advantage                | SignalWire Advantage                 |
| ------------------ | ------------------------------- | ------------------------------------ |
| **Cost**           | ✅ Lower per-minute rates       | —                                    |
| **AI Agent Cost**  | ✅ ~$0.09/min vs $0.16/min      | —                                    |
| **HIPAA**          | ✅ Free conduit exception       | ✅ Comprehensive BAA (if needed)     |
| **Voice Quality**  | ✅ Sub-200ms on private network | ✅ FreeSWITCH-powered media engine   |
| **Multi-Agent AI** | —                               | ✅ Native multi-agent workflows      |
| **No-Code Setup**  | ✅ Faster initial deployment    | —                                    |
| **SDK Breadth**    | ✅ 6+ languages                 | — (Python-centric for AI)            |
| **Contact Center** | —                               | ✅ Built-in CCaaS                    |
| **Video**          | ✅ Mobile SDKs (iOS/Android)    | ✅ Published pricing, more tutorials |

**Bottom Line**:

- **Choose Telnyx** if your primary needs are cost-effective voice/SMS, simple AI agents, and you want the lowest per-minute rates with a private network advantage. Best for straightforward pharmacy notification systems, appointment reminders, and single-agent customer service bots.

- **Choose SignalWire** if you need complex multi-agent AI workflows, programmable contact center capabilities, or comprehensive HIPAA BAA coverage across all communication channels. Best for building sophisticated pharmacy support systems with multiple AI agents, call routing, and deep integration with backend systems.

- **Hybrid Approach**: Some teams use Telnyx for high-volume SIP trunking (lowest cost) and SignalWire for AI agent orchestration (best multi-agent framework). Both support SIP interconnection, making this technically feasible.

---

## References & Links

### Telnyx

- Website: https://telnyx.com
- Developer Docs: https://developers.telnyx.com
- Pricing: https://telnyx.com/pricing
- Trust Center: https://trust.telnyx.com
- GitHub: https://github.com/team-telnyx
- Mission Control Portal: https://portal.telnyx.com

### SignalWire

- Website: https://signalwire.com
- Developer Docs: https://developer.signalwire.com / https://signalwire.com/docs
- Pricing (Voice): https://signalwire.com/pricing/voice
- Pricing (AI Agent): https://signalwire.com/pricing/ai-agent-pricing
- Trust Center: https://signalwire.com/technology/trust-center
- GitHub: https://github.com/signalwire
- Discord Community: https://discord.gg/signalwire

---

_This document was compiled from official documentation, third-party reviews (Gartner, G2, ITQlick, SoftwareAdvice), pricing pages, and developer resources as of May 2026._
