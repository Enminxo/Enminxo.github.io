---
title: Episodic Memory Assistant
description: A wearable camera writes a text diary of your day, and you can ask it "where did I leave my keys?". Where its errors come from, and what it costs to run live on Pupil Labs Neon glasses.
publishDate: 2026-10-28 00:00:00
tags:
  - Egocentric AI
  - VLM
  - Pupil Labs Neon
  - Assistive Technology
status: prototyping
img: /assets/logs/ego-memory-assistant/cover.jpg
img_alt: "What the glasses saw: a hand pushing an office window shut"
logo: /assets/logs/ego-memory-assistant/logo.png
url: https://github.com/Enminxo/ego-memory-assistant
---

A prototype of an assistant for the small questions we all ask ourselves, like "Did I turn off the stove?". The glasses' camera turns what you see into a short text diary, one entry every 15 seconds, and a language model answers questions from that diary, pointing to the moment its answer comes from.

It runs on recordings and live, from Pupil Labs Neon glasses. The entry takes it apart on 500 benchmark questions: how much the diary adds over a reader with no memory, what kinds of false lines the describer writes, and what it costs to store and to write the diary live.

The code is open, under the MIT license: [github.com/Enminxo/ego-memory-assistant](https://github.com/Enminxo/ego-memory-assistant).
