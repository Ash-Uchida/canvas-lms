# Memory practice: last-verified notes + re-ground after upstream churn

## Technique (name) and why it fits Canvas work

**Technique:** Treat agent-facing markdown under `agents/` as **long-term memory (LTM)** and treat the chat window as **short-term memory (STM)**. Operational rules: **append “last verified” metadata** (date + short scope + optional git SHA) when conclusions are still believed true, and run an **explicit re-grounding ritual** after merges or large `git pull` operations so path and API assumptions are not trusted from STM alone.

**Why it fits Canvas:** Canvas LMS is a large brownfield Rails + JS monorepo. Paths, feature flags, and Docker/doc flows change over time. Without LTM anchors, an agent session can confidently reuse yesterday’s mental map that is already wrong. Pairing **dated verification** with **post-pull re-ground** keeps effort on the fork instead of on hallucinated layout.

## Connection to other agent artifacts

This pattern is **attached whenever** the repository analysis agent in [`agents/analyze-repo.md`](analyze-repo.md) runs or is referenced:

- That agent already budgets context via indexes and summaries (≤40% raw load). **Last verified** and **re-ground** rules extend the same idea: **do not pay the cost of re-reading the whole tree, but do pay the cost of re-validating assumptions when the world changes.**
- Before invoking “analyze-repo” style work after pulling upstream, re-read `agents/analyze-repo.md` and update or add a **last verified** line in this file or in the task note you are writing (same repo, same fork).

## Procedure (prompts / file rituals)

- **Start of a focused Canvas session (bullet ritual)**  
  - Open `agents/analyze-repo.md` if the task needs structure or entry points.  
  - Skim the latest **Last verified** block in *this* file (below).  
  - If the task touches runtime (Docker, tests, ports), skim `AGENTS.md` in the repo root for canonical commands.

- **During the session**  
  - When you learn something durable (“override file required”, “tests live under X”), prefer writing it to **committed** `agents/` or feature notes—not only to chat.

- **End of session (if conclusions matter next week)**  
  - Append **Last verified** with: UTC or local date, 1–2 lines on what was checked, optional `git rev-parse --short HEAD`.  
  - If nothing was validated, write **“not verified—hypothesis only”** so future-you does not trust it.

- **After `git merge`, `git pull`, or rebasing on upstream**  
  - **Re-ground:** redo a narrow search or read the specific files for the area you will edit; do not assume symbols/paths from the prior session.  
  - If you maintain `repo_index.json` / summaries per `analyze-repo`, treat them as **stale until regenerated** for the areas that changed.

- **Purge / refresh**  
  - **STM:** start important new threads when the old one is long or wandered off-topic (cheap purge).  
  - **Scratch:** delete or trim local scratch notes that duplicate what is now captured in `agents/` so you do not maintain two conflicting truths.

## Purge / refresh / last verified (as applicable)

| Layer        | Policy |
|-------------|--------|
| Chat (STM)  | New session for new milestone; avoid carrying huge transcript as “memory.” |
| `agents/` (LTM) | Update in place; use “not verified” when unsure; append dated verification when sure. |
| Indexes / summaries | Refresh after upstream churn or when search results contradict the index. |

### Last verified

- **2026-05-13** — Memory-practice doc drafted; Docker accepted by instructor for env lab (verbal/email per your records); optional SHA: run `git rev-parse --short HEAD` on your machine when you submit.

## Failure modes and mitigations

| Failure mode | Mitigation |
|--------------|------------|
| **Stale context** — paths, ports, or flags changed upstream; agent repeats wrong instructions. | **Re-ground after pull**; reread small canonical files (`AGENTS.md`, `doc/docker/README.md`); spot-check with repo search; refresh indexes if you use them. |
| **Over-trust** — treating an old “last verified” line as proof the whole repo still matches. | Scope verification narrowly (“Docker compose path verified”, not “entire app verified”); re-verify when touching a subsystem. |
| **Over-retention** — duplicate notes in chat, scratch files, and `agents/` drifting apart. | **Single source of truth** in `agents/` for rituals; purge scratch after merge-up; prefer editing one note over adding a third copy. |

## Evidence excerpt (no secrets)

Below is a shortened excerpt from a real working session (prompt + assistant summary). Hostnames, tokens, and keys are omitted.

**User (excerpt):**  
> Lab 3.1 … memory … AWS … **I'm running it on docker, what are the steps we need to do?**

**Assistant (excerpt):**  
> **Part A** — unchanged: `agents/memory-practice.md` with technique, procedure, failure mode + mitigation, evidence, link to `agents/analyze-repo.md`.  
> **Part B** — adapt the runbook for Docker: follow `doc/docker/README.md`, `./script/docker_dev_setup.sh`, `docker compose up -d`, verify with `docker compose ps` and logs/HTTP; confirm with instructor if screenshot must still show AWS.

This shows the **LTM/STM split in use:** the durable procedure was captured here in `agents/` rather than relying on the chat alone for the next lab handoff.

---

## Out of scope (next lab)

Feature implementation in Canvas application code is **explicitly out of scope** for this lab; this file only defines **how** agent memory is managed for upcoming implementation work.
