# Freya

A personal operating agent that turns one Kanban card into the correct actions across Gmail, Calendar, Notion, GitHub, and Slack.

## North Star
One card in → the right actions out.  
No chat. No endless planning. Just classify → act → update.

## Core Loop
1. Read open Kanban cards (priority order)
2. Classify the card (meeting | task | bug | idea | follow-up)
3. Gather minimal context from the relevant apps
4. Execute the matching flow with hard constraints
5. Write results back to the card + destination apps
6. Move card to the correct column

## Supported Flows (v0)

### 1. Meeting / Call
Card example: “Call Sam on Wednesday about the pilot”
- Find contact in Notion
- Check Calendar for conflicts
- Create Calendar event
- Draft (and optionally send) Gmail
- Update Kanban card with event link + status

### 2. Bug / Engineering Work
Card example: “Fix bug on PR #3122”
- Pull PR context from GitHub
- Create structured note in Notion
- Optionally notify Slack
- Update Kanban card with links

### 3. Task / Follow-up
Card example: “Send proposal to Acme by Friday”
- Create Calendar deadline if needed
- Draft Gmail
- Log decision/action in Notion
- Update Kanban

### 4. Idea Capture
Card example: “Idea: usage-based pricing experiment”
- File cleanly in Notion under Ideas
- Optionally create a light Linear/GitHub issue later
- Mark card Done

## Tech Stack
- **Framework**: Next.js (App Router)
- **Agent**: Vercel AI SDK (`ToolLoopAgent`)
- **Language**: TypeScript
- **Memory / State**: SQLite (cards, run history, simple contact cache)
- **UI**: Single Kanban page + “Process next” button
- **Observability**: AI SDK telemetry + local run logs in SQLite

## Tools the Agent Can Use
- `kanban.listCards`
- `kanban.createCard`
- `kanban.updateCard`
- `kanban.moveCard`
- `gmail.search` / `gmail.draft` / `gmail.send`
- `calendar.listEvents` / `calendar.createEvent`
- `notion.findContact` / `notion.createPage` / `notion.append`
- `github.getPullRequest` / `github.createIssue` (optional)
- `slack.postMessage` (optional)

## Constraints (Hard Rules)
- Never send email without explicit approval flag on the card or in the run
- Never overwrite existing Calendar events
- Always write a short result summary back to the Kanban card
- Prefer the minimum number of tool calls
- If confidence is low → leave card in “Needs Review” and explain why

## Columns (Kanban)
- Inbox
- In Progress
- Needs Review
- Done

## Success Criteria for a Run
- Card is correctly classified
- Correct destination apps are updated
- Card contains links + outcome summary
- No silent failures (every tool result is recorded)

## Out of Scope (v0)
- Multi-agent debate
- Long-term memory beyond SQLite
- Complex scoring models
- Automatic sending of every email
- Mobile app

## Prompt Skeleton
You are Freya, a personal operating agent for a founder.
Your only job is to turn one Kanban card into the correct real-world actions.
Work in small, verifiable steps. Use tools. Update the card when finished.
Prefer action over discussion.