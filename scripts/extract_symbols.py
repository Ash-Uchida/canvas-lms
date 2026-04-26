#!/usr/bin/env python3
"""Extract Python symbols into symbol_map.json using ast."""

from __future__ import annotations

import argparse
import ast
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


def is_ignored(path: Path, ignored_dirs: set[str]) -> bool:
    return any(part in ignored_dirs for part in path.parts)


def parse_exports(module_ast: ast.Module) -> list[str]:
    exports: list[str] = []

    for node in module_ast.body:
        if not isinstance(node, ast.Assign):
            continue
        for target in node.targets:
            if isinstance(target, ast.Name) and target.id == "__all__":
                if isinstance(node.value, (ast.List, ast.Tuple)):
                    for elt in node.value.elts:
                        if isinstance(elt, ast.Constant) and isinstance(elt.value, str):
                            exports.append(elt.value)
    return sorted(set(exports))


def extract_python_symbols(path: Path) -> dict[str, list[str] | str]:
    source = path.read_text(encoding="utf-8", errors="replace")
    module_ast = ast.parse(source)

    functions: list[str] = []
    classes: list[str] = []

    for node in module_ast.body:
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            functions.append(node.name)
        elif isinstance(node, ast.ClassDef):
            classes.append(node.name)

    return {
        "functions": sorted(set(functions)),
        "classes": sorted(set(classes)),
        "exports": parse_exports(module_ast),
    }


def build_symbol_map(root: Path, ignored_dirs: set[str]) -> dict[str, dict[str, list[str] | str]]:
    symbol_map: dict[str, dict[str, list[str] | str]] = {}

    for path in root.rglob("*.py"):
        if not path.is_file() or is_ignored(path, ignored_dirs):
            continue
        rel = path.relative_to(root).as_posix()
        try:
            symbol_map[rel] = extract_python_symbols(path)
        except SyntaxError as exc:
            symbol_map[rel] = {
                "functions": [],
                "classes": [],
                "exports": [],
                "error": f"SyntaxError: {exc.msg}",
            }
        except Exception as exc:  # Keep indexing resilient.
            symbol_map[rel] = {
                "functions": [],
                "classes": [],
                "exports": [],
                "error": f"{type(exc).__name__}: {exc}",
            }

    return dict(sorted(symbol_map.items(), key=lambda item: item[0]))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate symbol_map.json.")
    parser.add_argument(
        "--root",
        default=".",
        help="Repository root to scan (default: current directory).",
    )
    parser.add_argument(
        "--output",
        default="symbol_map.json",
        help="Output JSON path (default: symbol_map.json).",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    root = Path(args.root).resolve()
    output = Path(args.output).resolve()

    symbol_map = build_symbol_map(root=root, ignored_dirs=DEFAULT_IGNORED_DIRS)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(symbol_map, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"Wrote {output}")


if __name__ == "__main__":
    main()
