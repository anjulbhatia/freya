# Freya
> A personal operating agent that turns one Kanban card into the correct actions across Gmail, Calendar, Notion, GitHub, and Slack.

Opinionated personal + small-team operating agent.

One project → one chat + one Kanban → agent proposes concrete multi-app actions → human approves → agent executes and writes proof back.

Inspired by the tightness of products like Daynode. Local-first, self-hostable, no bloat.

## North Star
Capture anything.  
Turn it into the correct real-world actions across the tools you already use.  
Keep a human in the loop for anything irreversible.  
Stay simple and opinionated.

## What We Are Making (v0.1)

A self-hosted web application where:

- You create **Projects**
- Each project has its own **Chat Interface** (capture + context) and **Kanban** (decision + approval surface)
- An operating agent reads cards / messages, classifies intent, gathers context from connected apps, and proposes a concrete plan
- The plan appears on the Kanban in a **Proposed** state
- A human approves, edits, or rejects
- On approval the agent executes the side effects and writes links + outcome back to the card

This is **not** a multi-agent harness control panel, not a full Basecamp/Jira clone, and not a generic chatbot.

## Core Features (v0.1)

### Projects
- Create / rename / archive projects
- Each project is isolated (own chat history, own board, own agent context)

### Chat + Kanban (single main view)
- Chat: free-form capture and light conversation
- Kanban: the control surface
- Default columns (configurable later):  
  `To-Do` → `In Progress` → `In Review` → `Done`  
  (or the simpler `Tasks` / `Running` / `Done`)
- Cards show type, proposed actions, status, and connected-app icons
- One-click Approve / Reject on Proposed cards

### Operating Agent
- Classifies incoming cards/messages (meeting, task, bug, idea, follow-up…)
- Proposes a minimal, verifiable sequence of tool calls
- Never performs irreversible actions without approval
- Writes a clear result summary + links back to the card

### Human-in-the-loop
- Every email send, calendar create, Slack post, GitHub write, etc. must pass through the Proposed state
- Approval is explicit and visible on the board

### Self-hosting
- Docker Compose (app + Postgres)
- One-command local start
- Environment-based configuration

### UI
- Responsive web app
- Sidebar (projects + settings)
- Main area: Chat + Kanban
- Overlays only (card detail, approval, connect integration)
- Clean, dark, opinionated visual language

## Integrations (v0.1)

Only the ones that deliver the core demo loops. All others are explicitly out of scope.

| Integration       | Read | Write / Act          | Notes                          |
|-------------------|------|----------------------|--------------------------------|
| Gmail             | ✓    | Draft + Send (gated) | Core for meeting + follow-up   |
| Google Calendar   | ✓    | Create event         | Core for meeting flow          |
| Notion            | ✓    | Create / append page | Contacts, notes, decision log  |
| Slack             | ✓    | Post message (gated) | Notifications                  |
| GitHub            | ✓    | Read PR/issue, light write | Bug / engineering flow     |

Later candidates (not v0.1): Linear, Jira, Discord, Outlook, Zoom/Meet deep links, etc.

## Explicitly Out of Scope for v0.1
- Multi-agent orchestration UI / harness panel
- Desktop app (Electrobun) and mobile app
- Full team roles & permissions matrix
- Built-in calendar UI or calendar operations beyond the Google integration
- Automation marketplace / pre-built workflow gallery
- Long-term memory beyond project chat + card history
- Complex scoring or multi-criteria optimization
- Cloud-hosted multi-tenant SaaS version

## Tech Stack
- **Frontend / App**: Next.js (App Router) + TypeScript
- **Agent**: Vercel AI SDK (`ToolLoopAgent`)
- **Database**: Postgres (Docker) + Drizzle or Prisma
- **Auth**: Auth.js or better-auth (magic link or simple email/password)
- **UI**: Tailwind + shadcn/ui (or equivalent tight component set)
- **Structure**: Feature-based folders
- **Deploy / Run**: Docker Compose for self-hosting

## Information Architecture
```
Sidebar
├── Projects
├── Current project
└── Settings / Integrations
Main (single page)
├── Chat (collapsible)
└── Kanban
└── Card detail / Approval modal (overlays)
```


## Success Criteria for v0.1
- A new user can self-host with Docker, create a project, connect at least Gmail + Calendar + Notion, and complete both demo flows below without code changes.
- Proposed plans on cards are concrete and readable in <5 seconds.
- No irreversible action happens without an explicit approval step.
- UI feels tight and intentional (Daynode-level craft, not “project broken”).

## Demo Flows (must work)

**Flow A – Meeting**  
Input: “Call Bob at 3pm tomorrow about the pilot”  
→ Agent looks up Bob in Notion  
→ Checks Calendar  
→ Proposes: create event + draft email with meet link  
→ Human approves on the board  
→ Agent executes and writes links back to the card

**Flow B – Bug / Task**  
Input: “Fix the bug on PR #3122”  
→ Agent pulls PR context from GitHub  
→ Proposes: create Notion note + optional Slack notification  
→ Human approves  
→ Agent executes and updates the card

## Immediate Task List (execution order)

1. Docker Compose + Postgres + basic project model + auth skeleton
2. Project → Chat + Kanban (configurable columns, card CRUD)
3. Proposed state + Approve / Reject interaction
4. Agent loop (classify → propose → wait → execute) with Vercel AI SDK
5. Gmail + Google Calendar + Notion tools (reliable, well-typed)
6. GitHub + Slack tools (read + gated write)
7. Card result summary + link writing
8. Polish UI (sidebar, responsive, modals, empty states)
9. README + one-command self-host instructions
10. Record clean demo of the two flows

## Prompt Skeleton (agent)
You are the operating agent for a Freya project.
Your job is to turn a card or message into the correct real-world actions across the connected tools.
Work in small, verifiable steps.
Always propose first. Never perform irreversible actions without approval.
When finished, write a clear summary and links back to the card.
Prefer action over discussion.

## Principles
- Chat = capture. Kanban = decision + proof.
- Fewer features, higher craft.
- Self-hosted and local-first by default.
- Every new feature must make the propose → approve → execute loop clearer or more reliable.