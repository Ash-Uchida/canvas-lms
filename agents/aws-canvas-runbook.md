# AWS + Canvas runbook (Docker verification path)

**Environment note:** This fork uses **local Docker** for Lab 3.1 verification, per instructor approval. **AWS Academy Learner Lab and EC2 are not used** for this submission; no access keys, `.pem` files, or session tokens appear here.

---

## Goal

Run Canvas LMS from this fork using the **official Docker development path** so the stack is **verifiable**: containers build and stay up, the `web` service reaches a healthy running state, and you can show a **browser or HTTP check** against the URL your setup exposes (commonly `http://canvas.docker/` when using a local HTTP proxy—see upstream `doc/docker/README.md`).

**Ready for next lab:** A working brownfield dev stack you can iterate on for the scoped Canvas feature.  
**Out of scope for this lab:** Implementing that feature in `app/`, `ui/`, or plugins—see bottom of this file.

---

## AI prompts used (summary)

These are representative prompts used in Cursor (or similar) to stand up and debug the environment—**AI as executor** for navigation and commands, human for approval and secrets handling:

1. *“Read `doc/docker/README.md` and `AGENTS.md` and list the exact steps to run Canvas with Docker on my machine from a fresh clone.”*
2. *“I ran `./script/docker_dev_setup.sh` and got [paste error]. What should I check next per `doc/docker/developing_with_docker.md` troubleshooting?”*
3. *“After `docker compose up -d`, how do I verify `web` and `postgres` are healthy? Give `docker compose` commands only.”*
4. *“Do not print or commit secrets. Where should `docker-compose.override.yml` come from and what is gitignored?”*

Adapt the bracketed parts to your real errors and outputs when you paste evidence for your instructor.

---

## Learner Lab + EC2 checklist

| Item | Status |
|------|--------|
| AWS Learner Lab started | **N/A** (Docker path) |
| EC2 instance + SSH | **N/A** |
| Security groups / Elastic IP | **N/A** |

**Local prerequisites (fill in your versions when submitting):**

- Docker Engine / Docker Desktop installed and running.
- Enough disk and RAM for Canvas images and `node_modules` volumes (upstream docs warn this is heavy).
- Repo cloned from **your fork** of the course Canvas LMS tree.

---

## Canvas LMS: clone + doc path followed

Canonical anchors in this repository (paths only—no large upstream pastes):

| Path | Purpose |
|------|---------|
| [`doc/docker/README.md`](../doc/docker/README.md) | Entry point: `./script/docker_dev_setup.sh`, then `docker compose up -d`; mentions `http://canvas.docker/` when using Dinghy-http-proxy or Dory. |
| [`doc/docker/developing_with_docker.md`](../doc/docker/developing_with_docker.md) | Overrides, `COMPOSE_FILE`, manual `config/` copies, troubleshooting. |
| [`docker-compose.yml`](../docker-compose.yml) | Base services: `web`, `jobs`, `postgres`, `redis`. |
| [`config/docker-compose.override.yml.example`](../config/docker-compose.override.yml.example) | Example override shape (your real `docker-compose.override.yml` is typically **gitignored**—create via setup script or copy as documented). |
| [`AGENTS.md`](../AGENTS.md) | Quick commands: `docker compose up`, dev shell `docker compose run --rm web bash`, JS/Ruby tests. |

**Typical flow (high level):**

1. Clone your fork and `cd` into the repo root.
2. Run **`./script/docker_dev_setup.sh`** and complete any **Next steps** it prints (first-time build can take a long time).
3. Start stack: **`docker compose up -d`** (or `docker compose up` if you prefer attached logs).
4. Resolve URL: follow README for **canvas.docker** + proxy, **or** your own published port if you customized overrides—record the exact URL you verified in your submission notes.

---

## Verification commands and signals

Run from the **repository root** (same directory as `docker-compose.yml`).

### 1. Compose status

```bash
docker compose ps
```

**Expected signals:** `web`, `postgres`, and `redis` show **running** (and `jobs` / `webpack` if your compose file starts them). Exit code 0.

### 2. Web service logs (tail)

```bash
docker compose logs web --tail=80
```

**Expected signals:** No immediate crash loop; eventually Rails/Puma listening messages or steady “listening” behavior per your image. Investigate stack traces if the container restarts repeatedly.

### 3. Optional: follow logs live

```bash
docker compose logs -f web
```

**Expected signals:** Requests logged when you load the app in a browser (if routing reaches the container).

### 4. HTTP / browser (pick what matches your override)

- If using **canvas.docker** flow from [`doc/docker/README.md`](../doc/docker/README.md): open **`http://canvas.docker/`** (or the host your proxy maps) and confirm the Canvas UI loads.
- Otherwise: use **`curl -I`** against the **localhost** URL and port you configured (example only—replace host/port):

```bash
curl -I --max-time 10 http://127.0.0.1:PORT/
```

**Expected signals:** HTTP **200** or **302** to a login/setup page—not connection refused.

**Screenshot (submission):** Browser showing Canvas (or your instructor’s agreed checkpoint) with Docker running—**no** AWS console required for this Docker path if they accepted the substitution.

---

## Last verified (optional but recommended)

| Date | What was verified |
|------|-------------------|
| *YYYY-MM-DD* | *e.g. `docker compose ps` + browser at … — fill when you run verification* |

Optional: `git rev-parse --short HEAD` → paste short SHA in your lab notes (not a secret).

---

## Out of scope: feature implementation (next lab)

- No graded feature work in this lab: **no** required changes to production Canvas behavior for submission credit here.
- Next milestone: implement your **scoped Canvas feature** (or course milestone) against this verified Docker dev stack.

---

## Guardrails

- **Do not** commit AWS keys, `.pem` contents, session tokens, or personal `.env` secrets.
- **Do not** commit generated `docker-compose.override.yml` if it contains machine-specific secrets; follow `.gitignore` and course rules.
