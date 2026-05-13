---
name: qa
description: Runs the Ultimate SDET Unit Test Architect workflow for unit test design and implementation. Use when the user invokes /qa or asks to create, improve, or validate unit tests with strong edge-case coverage.
disable-model-invocation: true
---

# QA

## Instructions

When this skill is used:

1. Read [../Unit_Test.md](../Unit_Test.md).
2. Follow it as the controlling workflow for analyzing code changes, designing test cases, implementing unit tests, running them, and reporting coverage of happy paths, edge cases, and failure paths.
3. Use the repository's existing test patterns and project-specific guidance. For Ruby RSpec specs, also use the Canvas RSpec skill.
4. Do not delete, skip, or weaken existing tests unless the user explicitly asks for that.
5. Report back with the cases covered, commands run, and any remaining test risk.
