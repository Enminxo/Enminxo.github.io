---
title: Voice Blog & Communication Coach
description: A personal tool that captures spoken reflections via Whisper Flow, then uses the Claude API to analyze communication structure, filler words, and connector quality.
publishDate: 2024-10-01 00:00:00
tags:
  - Whisper
  - Claude API
  - Python
status: in progress
url: ""
---

I wanted a low-friction way to journal and also improve how I communicate — two problems solved with one tool.

## How it works

1. Record a voice note through Whisper Flow (real-time transcription)
2. The transcript is sent to Claude via the API
3. Claude returns structured feedback: PREP framework adherence, filler word count, connector quality, and a 1-paragraph summary of the main idea

## Why this matters

Speaking clearly is a skill that compounds. This tool gives me daily feedback without requiring a coach or audience.

## Stack

- **Whisper Flow** — macOS app for real-time transcription
- **Claude API** — analysis and feedback generation
- **Python** — glue layer, file management, prompt templates
