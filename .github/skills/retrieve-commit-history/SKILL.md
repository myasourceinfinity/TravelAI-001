---
name: retrieve-commit-history
user-invocable: true
summary: Parse raw git commit log data and produce developer-focused changelog entries with structured commit metadata and bullet-point changes.
description: |
  Use this skill to parse raw git log text, identify commit boundaries, infer metadata, and convert each commit into a developer-friendly changelog entry.
  The skill follows Conventional Commits-style categorization and outputs a professional summary with actionable bullet points.
inputs:
  - name: logSource
    type: string
    description: Raw git log text or git commit payloads to summarize.
  - name: outputFormat
    type: string
    description: Desired output style, such as "release notes" or "changelog bullets".
    default: "release notes"
  - name: maxCommits
    type: integer
    description: Maximum number of commits to include.
    default: 20
---

# Retrieve Commit History

## What this skill does
- Parses raw git log text and structures commits by hash, author, date, message, and file stats when available.
- Applies Conventional Commits-style categories: `feat`, `fix`, `refactor`, `docs`, `style`, `chore`, `test`, and explicit `merge` labels.
- Writes a clear 1-2 sentence overview for each commit.
- Produces present-tense, module-aware bullet points that reflect the actual change intent.

## Processing protocol
1. Parse commit boundaries and metadata from raw git log text.
2. Classify each commit type using message prefixes or inferred intent.
3. Generate a concise overview sentence for the commit.
4. Extract specific changes into bullet points, using commit body or diff/stat context.
5. Handle missing file stats by inferring bullets from commit messages.
6. Summarize merge commits explicitly and note merged branch or PR.

## Output format
For each commit, return:
---
### Commit [`<Hash>`] - <Short Summary Line>
**Author:** <Author Name> | **Date:** <Date> | **Type:** `<Category>`

**Overview:**
<1-2 sentence plain-language summary of what changed and why.>

**Key Changes:**
- **[Component/Module]**: <Actionable description of specific change>
- **[Component/Module]**: <Actionable description of specific change>
---

## Example prompts
- "Summarize this git log into changelog entries with commit metadata and bullet-point changes."
- "Convert raw `git log --stat` output into release notes using Conventional Commits categories."
- "Parse these commits and create a developer-facing summary with type labels and key changes."

## Notes
- If commit stats are unavailable, the skill infers specific changes from commit bodies and titles.
- This skill is workspace-scoped under `.github/skills/retrieve-commit-history/`.
