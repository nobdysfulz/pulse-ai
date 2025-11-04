Pulse Graph Intelligence Core (PGIC)

The AI reasoning and scoring engine that powers Pulse Intelligence

1️⃣ Overview

The Pulse Graph Intelligence Core (PGIC) is the central AI framework that learns from agent behavior, system usage, and market dynamics to generate a unified Overall Intelligence Score and personalized insights.
It powers:

Daily recommendations on focus areas

Predictive analytics (“If you keep this pace, you’ll close X deals next month”)

Real-time coaching actions surfaced across the app

PGIC is not a single LLM—it’s an intelligence layer combining deterministic scoring logic + LLM-based reasoning + historical data modeling.

2️⃣ Core Components
Component	Purpose	Example Entity
PULSE Engine	Measures agent execution & consistency.	DailyAction, Goal, AgentProfile
GANE Engine	Measures predictability & system adaptability.	SystemUsage, IntegrationStatus, UserPreferences
MORO Engine	Measures external market opportunity & favorability.	MarketData, Listing, Transaction
PGIC Aggregator	Combines engine outputs into unified intelligence context.	IntelligenceSnapshot
AI Insight Generator	Uses GPT-4o / 4o-mini to translate numeric patterns into natural-language recommendations.	AiInsight
3️⃣ Scoring Logic
3.1 Weighting Model
OverallScore = (PULSE * 0.4) + (GANE * 0.3) + (MORO * 0.3)

3.2 Sub-Formulas
PULSE = 0.4*(TaskCompletionRate) 
       + 0.4*(ConsistencyStreakScore)
       + 0.2*(OverduePenalty)

GANE  = 0.5*(ActiveSystemRatio)
       + 0.3*(GoalAlignment)
       + 0.2*(LearningProgress)

MORO  = 0.5*(MarketVelocityIndex)
       + 0.3*(PriceTrendMomentum)
       + 0.2*(InventoryBalance)

3.3 Status Bands
Range	Label	Color
0 – 39	Critical	Red #E03131
40 – 59	At Risk	Amber #FAB005
60 – 79	Healthy	Blue #228BE6
80 – 100	Optimized	Green #2F9E44
4️⃣ Data Sources & Pipelines
Data Type	Source	Frequency
Actions & Tasks	Internal DailyAction table	Real-time
Goals & KPIs	Goal, BusinessPlan	Daily
CRM Activity	Lofty / Follow Up Boss API	Hourly
Market Metrics	Redfin Market API	Weekly (Free users: 30 days)
System Usage	Integration events	Continuous
Transactions	SkySlope API	Real-time on update

The aggregator runs a nightly job (pgic_refresh_cron) that rebuilds the user’s intelligence graph and stores it in IntelligenceSnapshot.

5️⃣ AI Insight Workflow
flowchart TD
A[User triggers refresh] --> B[Gather context: PULSE,GANE,MORO,profile,goals,market]
B --> C[Generate structured JSON payload]
C --> D[send to GPT-4o via openaiAdvisor()]
D --> E[AI produces insights + actions array]
E --> F[Parse JSON -> store AiInsight entity]
F --> G[Display formatted insights in Intelligence UI]

Insight Schema
{
  "overallScore": 72,
  "trend": "up",
  "message": "Your consistency is improving. Double-down on task completion.",
  "actions": [
    {"title": "Block focus hours", "priority": "high", "type": "system_usage"},
    {"title": "Update expired listings", "priority": "medium", "type": "market"}
  ]
}

6️⃣ Integrations & Context Sharing

PGIC context is shared across all agents through the Agent Context Builder.

Agent	Consumes	Produces
Nova	PULSE Score + Goals	Execution data → Consistency feedback
Sirius	GANE Score + Brand Trends	Engagement metrics → Predictability update
Vega	PULSE + MORO	Transaction status → Execution update
Phoenix	MORO + PULSE	Lead outcomes → Market adjustment
7️⃣ Entities Overview
Entity	Key Fields	Description
IntelligenceSnapshot	pulse, gane, moro, overall, timestamp	Stores calculated scores
AiInsight	user_id, message, actions[], trend	Natural-language coaching output
AiInsightHistory	insight_id, date, change	Used for trend visualization
AiActionLog	action_id, completed	Tracks if user implemented suggestion
8️⃣ Front-End Integration

Route: /intelligence

Components:

<ScoreCards /> → renders PULSE, GANE, MORO

<OverallScoreCard /> → aggregated view + trend indicator

<InsightsList /> → AI recommendations as actionable cards

Refresh Cycle: manual button + daily auto update

Cache: 15-minute TTL to reduce LLM calls

9️⃣ Future Enhancements

Predictive income projection model (PulseForecast)

Industry benchmarking (compare to regional averages)

Graph API for brokerage-level rollups

Continuous learning via reinforcement from user actions

🔐 Security & Privacy

All PII encrypted at rest (AES-256).

LLM prompts sanitized before API call.

Only anonymized performance vectors stored in PGIC.

🧩 Developer Guidelines

All new analytics features must write to IntelligenceSnapshot.

LLM outputs must be validated via JSON schema before display.

Keep AI responses concise (max_tokens ≈ 800).

When adding a new data source, update:

context_builder.js

pgic_calculator.js

openaiAdvisor.js

🧠 Summary

PGIC turns raw agent activity into structured intelligence.
It doesn’t just track performance — it teaches performance.
Every action strengthens the agent’s personal success model, making Pulse the first real estate platform that learns the rhythm of results.
