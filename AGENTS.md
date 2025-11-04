# 🧠 PULSE INTELLIGENCE — AI AGENTS

> **Codex Module:** `/agents`  
> **Purpose:** Core documentation for the Pulse Intelligence AI Agent System  
> **Author:** Pulse Intelligence Engineering Team  
> **Maintainer:** @pwru-dev  
> **Version:** 1.0  

---

## 🧭 Overview

Pulse Intelligence features a suite of specialized AI agents that operate as digital team members for real estate professionals.  
Each agent is designed to automate and optimize a core area of an agent’s business:

| Agent | Role | Core Function |
|--------|------|----------------|
| **NOVA** | Executive Assistant | Operations, scheduling, admin tasks |
| **SIRIUS** | Content Agent | Marketing, content creation, social media |
| **PHOENIX** | Leads Agent | Outbound calling, lead qualification |
| **VEGA** | Transaction Coordinator | Contract-to-close task management |

Together, they form the **Pulse Intelligence Agent Ecosystem**, built around personalization, automation, and execution consistency.

---

## ⚙️ System Architecture

- **Core Engine:** Pulse LLM + InvokeLLM (custom orchestration layer)  
- **Orchestration Service:** `AgentOrchestrator` microservice  
- **Data Entities:**  
  - `AgentProfile` — stores configuration per agent  
  - `AgentActivity` — logs actions and timestamps  
  - `AgentConfig` — maps integrations, preferences, and API credentials  
- **Integration Layer:** Unified OAuth + API Connectors (Google, Meta, CRM)  
- **Security:** JWT-based user session isolation + encrypted data storage  

---

## 🤖 AI AGENT DIRECTORY

<details>
<summary><strong>1️⃣ NOVA — Executive Assistant</strong></summary>

**Personality:** Organized, proactive, anticipatory  
**Tagline:** “I handle the details so you can focus on deals.”

### Core Capabilities
- **Email Management** → Draft, send, and organize Gmail/Outlook messages  
- **Calendar Coordination** → Syncs meetings and reminders across platforms  
- **Research & Reporting** → Summarizes market info or internal analytics  
- **Document Automation** → Generates Google Docs, Sheets, and Drive folders  
- **Performance Summaries** → Produces daily and weekly operational reports  

### Technical Stack
| Integration | Function |
|--------------|-----------|
| Google Workspace / Microsoft 365 | Email + calendar sync |
| Google Drive | Document storage |
| Pulse Dashboard | Displays summaries and task syncs |

### API Usage
```js
POST /api/agents/nova/task
{
  "action": "create_doc",
  "params": {
    "title": "Client Onboarding Checklist",
    "folder": "Transactions/2025"
  }
}
