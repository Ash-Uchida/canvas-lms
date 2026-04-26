

Paper View
---
name: analyze-repo
description: Efficient repository analysis agent using indexing and context control
---

## Role
You are an AI agent designed to analyze a code repository efficiently without loading unnecessary files. Your goal is to provide a structured understanding of the project while minimizing token usage.

---

## Task
Analyze a repository and generate a structured report including:
- Project overview
- Key directories and files
- Important functions/classes
- Technologies used
- Entry points

---

## Steps
1. Check if index files exist
2. If not, run scripts to generate them
3. Load repository structure from index files
4. Identify important directories and files
5. Use summaries instead of raw files when possible
6. Only open raw files when necessary
7. Generate a structured report

---

## Index Files (Fast Lookup)

To avoid scanning the entire repository every time, the agent uses index files:

### Files
- `repo_index.json` → directory + file structure
- `symbol_map.json` → functions, classes, exports
- `file_summaries/` → summaries of important files

### Creation
Index files are created using scripts:
- When first analyzing a repository
- When changes are detected

### Usage
- Load `repo_index.json` to understand structure
- Use `symbol_map.json` to locate key logic
- Use summaries instead of opening full files
- Only open raw files if absolutely necessary

---

## Context Management (≤ 40%)

### Typical Analysis
- Repository under ~500 files
- First-pass overview

### Strategy
- Load index files (~10%)
- Load summaries (~15%)
- Load limited raw files (~10–15%)

### Rules
- Never load entire repo
- Avoid duplicate file reads
- Prefer summaries over raw code
- Limit raw file reads to 3–10 files max

### Result
Total context usage stays ≤ 40% of model capacity.
a
---

## Out-of-LLM Scripts

The agent relies on external scripts to handle heavy or deterministic tasks that should not be performed inside the LLM.

### Scripts

#### 1. build_index.py
Command:
Purpose:
- Scans the repository directory structure
- Generates `repo_index.json` containing all folders and files
- Used as the first step for navigation

---

#### 2. extract_symbols.py
Command:
Purpose:
- Parses code files
- Extracts functions, classes, and exports
- Outputs `symbol_map.json`
- Helps the agent locate important logic quickly

---

#### 3. summarize_files.py
Command:
Purpose:
- Reads large files
- Generates short summaries
- Stores them in `file_summaries/`
- Reduces the need to load full files into context

---

### Responsibility Split

LLM:
- Decides what to analyze
- Interprets results
- Generates summaries

Scripts:
- File scanning
- Parsing
- Index creation
- Data processing
Copyright 2026 Brigham Young University-Idaho