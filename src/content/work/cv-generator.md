---
title: Automated CV Generator
description: An n8n workflow that extracts job requirements from a posting URL and generates a tailored CV in HTML format, optimized for ATS systems. Runs locally with Ollama.
publishDate: 2024-09-01 00:00:00
tags:
  - n8n
  - Ollama
  - Automation
status: completed
hidden: true
url: ""
---

Customizing a CV for every job application is tedious but important. This workflow automates the tailoring step while keeping everything local (no data sent to external APIs).

## Workflow

1. Paste a job posting URL into a webhook trigger
2. n8n scrapes and parses the job requirements
3. Ollama (local LLM) maps requirements to my experience and generates a tailored CV in HTML
4. The HTML is exported to a PDF-ready format optimized for ATS keyword matching

## Design decisions

- **Local-first**: Ollama runs on-device, no data leaves the machine
- **HTML output**: easier to style and iterate than Word or LaTeX
- **Webhook trigger**: one URL, paste and go — no UI needed

## Outcome

Reduced time per application from ~45 minutes of manual editing to under 5 minutes of review.
