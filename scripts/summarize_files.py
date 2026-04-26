#!/usr/bin/env python3
"""Generate simple per-file summaries under file_summaries/."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


DEFAULT_IGNORED_DIRS = {
    ".git",
    ".hg",
    ".svn",
    "__pycache__",
    ".idea",
    ".vscode",
    "node_modules",
    "file_summaries",
}

DEFAULT_MAX_SUMMARIES = 250
DEFAULT_MIN_BYTES = 8_000
DEFAULT_MIN_LINES = 200


def is_ignored(path: Path, ignored_dirs: set[str]) -> bool:
    return any(part in ignored_dirs for part in path.parts)


def summarize_file(path: Path, root: Path) -> dict[str, object]:
    raw = path.read_bytes()
    text = raw.decode("utf-8", errors="replace")
    lines = text.splitlines()
    rel = path.relative_to(root).as_posix()

    first_non_empty = next((line.strip() for line in lines if line.strip()), "")
    preview = first_non_empty[:180]

    return {
        "path": rel,
        "extension": path.suffix,
        "bytes": len(raw),
        "line_count": len(lines),
        "summary": (
            f"{rel} is a {path.suffix or 'no-extension'} file with "
            f"{len(lines)} lines and {len(raw)} bytes."
        ),
        "first_non_empty_line": preview,
    }


def iter_target_files(root: Path, ignored_dirs: set[str]) -> list[Path]:
    candidates: list[Path] = []
    for path in root.rglob("*"):
        if not path.is_file() or is_ignored(path, ignored_dirs):
            continue
        try:
            raw = path.read_bytes()
        except OSError:
            continue

        # "Large files" in a simple way: either large by bytes or by line count.
        if len(raw) < DEFAULT_MIN_BYTES and raw.count(b"\n") + 1 < DEFAULT_MIN_LINES:
            continue
        candidates.append(path)

    candidates.sort(key=lambda p: p.relative_to(root).as_posix())
    return candidates[:DEFAULT_MAX_SUMMARIES]


def write_summary(output_dir: Path, summary: dict[str, object]) -> None:
    rel_path = str(summary["path"])
    safe_name = rel_path.replace("/", "__")
    output_file = output_dir / f"{safe_name}.json"
    output_file.write_text(json.dumps(summary, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate file summaries.")
    parser.add_argument(
        "--root",
        default=".",
        help="Repository root to scan (default: current directory).",
    )
    parser.add_argument(
        "--output-dir",
        default="file_summaries",
        help="Output directory (default: file_summaries).",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    root = Path(args.root).resolve()
    output_dir = Path(args.output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    targets = iter_target_files(root=root, ignored_dirs=DEFAULT_IGNORED_DIRS)
    for path in targets:
        summary = summarize_file(path=path, root=root)
        write_summary(output_dir=output_dir, summary=summary)

    print(f"Wrote {len(targets)} summaries to {output_dir}")


if __name__ == "__main__":
    main()
