#!/usr/bin/env python3
"""Build a repository file/directory index as JSON."""

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
}


def build_index(root: Path, ignored_dirs: set[str]) -> dict[str, list[str]]:
    directories: list[str] = []
    files: list[str] = []

    for path in root.rglob("*"):
        try:
            rel = path.relative_to(root).as_posix()
        except ValueError:
            continue

        parts = path.parts
        if any(part in ignored_dirs for part in parts):
            continue

        if path.is_dir():
            directories.append(rel)
        elif path.is_file():
            files.append(rel)

    directories.sort()
    files.sort()

    return {
        "root": root.as_posix(),
        "directories": directories,
        "files": files,
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate repo_index.json.")
    parser.add_argument(
        "--root",
        default=".",
        help="Repository root to scan (default: current directory).",
    )
    parser.add_argument(
        "--output",
        default="repo_index.json",
        help="Output JSON path (default: repo_index.json).",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    root = Path(args.root).resolve()
    output = Path(args.output).resolve()

    index = build_index(root=root, ignored_dirs=DEFAULT_IGNORED_DIRS)

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(index, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"Wrote {output}")


if __name__ == "__main__":
    main()
