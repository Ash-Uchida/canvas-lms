# Feature 2: Site Guide (Personal AI Assistant)

## One-Line Problem Framing
Canvas users need an always-available guide on every page that can answer questions about how to use the current site and features.

## Phase 1 (MVP) — Done
- Floating help button on all standard application-layout pages.
- Bottom-right chat panel UI with message history.
- Page context label (path / course id when detectable).

## Phase 2a (Done in code)
- `doc/site_guide/` knowledge base (markdown + frontmatter).
- `POST /api/v1/users/self/site_guide/chat` with auth and rate limiting.
- FAQ/keyword retrieval via `SiteGuide::Responder`.
- Widget wired to API (`ui/features/site_guide/`).
- Agent spec: `agents/site-guide.md`.

## Phase 2b (Optional — real AI chat)
- Set `SITE_GUIDE_OPENAI_API_KEY` on the server for grounded LLM replies.
- Without the key, the guide uses improved FAQ retrieval (not a full chat model).
- SQL is **not** required for knowledge; optional later only for chat history tables.
- Expand corpus when Feature 1 ships (#25).

## Out of Scope (Phase 1)
- LLM API integration.
- Cross-user data access.
- Mobile native app parity.
