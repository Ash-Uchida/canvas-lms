# Site Guide Agent

## Role
You help users of this Canvas fork via the in-app site guide. Answers must come from the knowledge base and page context, not from guesswork.

## Inputs
- User message (chat)
- `pathname` and optional `course_id` from the browser
- Corpus: `doc/site_guide/*.md` (YAML frontmatter + body)

## Outputs
- JSON `{ reply, sources }` from `POST /api/v1/users/self/site_guide/chat`
- UI displays reply and optional source titles in `ui/features/site_guide/`

## Server components
- `lib/site_guide/knowledge_base.rb` — loads articles from markdown (not SQL)
- `lib/site_guide/responder.rb` — retrieves relevant articles, then answers
- `lib/site_guide/llm_responder.rb` — optional LLM chat via Ollama (free) or OpenAI (paid)
- `app/controllers/site_guide_controller.rb` — auth + rate limit

## FAQ-only vs AI chat
- **Default (no LLM env):** free — best matching help article (smart FAQ).
- **Free AI:** Ollama on your machine/EC2 — no per-message API bill.
- **Paid AI:** OpenAI API key.

Retrieval always uses `doc/site_guide/` first; the LLM only rephrases that context. SQL is not required for knowledge.

## Guardrails
- Authenticated users only (`require_user`)
- No API keys in the frontend
- No cross-user data in requests or responses
- Say when help is unknown; do not invent features
- Max message length 2000 characters; rate limit 30 requests/minute/user

## Free AI chat (Ollama)
```bash
# Terminal 1 — on Mac or EC2 (not inside Canvas container unless you install Ollama there)
brew install ollama
ollama pull llama3.2
ollama serve

# docker-compose.override.yml → web service environment:
SITE_GUIDE_LLM_PROVIDER=ollama
SITE_GUIDE_LLM_MODEL=llama3.2
# Canvas in Docker, Ollama on host Mac:
SITE_GUIDE_LLM_BASE_URL=http://host.docker.internal:11434/v1
# Canvas and Ollama both on same Linux host:
# SITE_GUIDE_LLM_BASE_URL=http://127.0.0.1:11434/v1
```
Restart `web` after changing env.

## Paid AI chat (OpenAI, optional)
```bash
SITE_GUIDE_LLM_PROVIDER=openai
SITE_GUIDE_OPENAI_API_KEY=sk-...
SITE_GUIDE_LLM_MODEL=gpt-4o-mini
```
Never commit keys.

## Adding help content
1. Add `doc/site_guide/your-topic.md` with frontmatter:
   - `title`, `keywords` (comma-separated), `paths` (pathname prefixes)
2. Restart Rails or call `SiteGuide::KnowledgeBase.reload!` in console after edits
3. Ask test questions in the widget and confirm `sources` in the response

## Verification
- [ ] Logged-out request returns 401
- [ ] "How do I use the dashboard?" returns Dashboard article
- [ ] "card appearance preset" returns preset article
- [ ] Nonsense question returns honest fallback
- [ ] Widget shows error state when API fails
