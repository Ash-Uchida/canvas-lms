# Repository Analysis Scripts

These scripts generate fast-lookup artifacts used by the `analyze-repo` agent.

## Run from repo root

```bash
python3 scripts/build_index.py --root "." --output "repo_index.json"
python3 scripts/extract_symbols.py --root "." --output "symbol_map.json"
python3 scripts/summarize_files.py --root "." --output-dir "file_summaries"
```

## Outputs

- `repo_index.json`: repository directories and files
- `symbol_map.json`: Python functions, classes, and `__all__` exports (via `ast`)
- `file_summaries/`: simple JSON summaries for larger files
