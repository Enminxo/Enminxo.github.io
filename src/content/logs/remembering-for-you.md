---
project: ego-memory-assistant
title: "Remembering for You: Lessons from Building an Episodic Memory Assistant on Smart Glasses"
subtitle: "Part 1: how it works on my glasses, and what it costs"
date: 2026-11-10
summary: "Part 1: how it works on my glasses, and what it costs."
tags: ["Egocentric AI", "VLM", "Pupil Labs Neon", "Episodic Memory"]
img: /assets/logs/ego-memory-assistant/cover.jpg
img_alt: "What the glasses saw: my hand pushing the office window shut"
---

<img src="/assets/logs/ego-memory-assistant/logo.png" alt="Remembering for You: round glasses with a clock running backwards in one lens" style="width:170px;max-width:45%;display:block;margin:2rem auto 1.5rem;border:none;box-shadow:none;border-radius:0;" />

"Did I turn off the stove?" "Did I close the window?" We forget what we did minutes ago without paying attention; camera glasses would have caught it. The hard part is not recording; it is remembering the right things. This part shows a prototype that tries, on one minute of my day with Pupil Labs Neon glasses, and what it costs. [Part 2](/log/remembering-for-you-part-2/) takes its mistakes apart on 500 benchmark questions.

### TL;DR

- Every 15 seconds, an AI model looks at 8 photos from my glasses and writes one line in a diary; then, as a reader, it answers my questions from the diary alone.
- It can tell me what I did at the window, but not whether I closed it: the photos caught my hand on the glass, not the change.
- Keeping the diary is almost free: a waking day fits in about 220 Word pages. Writing it is the bottleneck: on my glasses, the good model writes at half the speed of life.

---

### How it works

<a href="/assets/logs/ego-memory-assistant/system.jpg"><img src="/assets/logs/ego-memory-assistant/system.jpg" alt="The glasses and phone send 8 photos every 15 seconds; the describer writes one diary line; the reader answers from the diary alone and cites the moment" style="width:100%;display:block;margin:0 auto;" /></a>

The glasses' camera is wired to a phone, which sends only 8 photos of every 15 seconds to a DGX Spark, an AI computer on my desk. There, a vision-language model (an AI that looks at images and writes text; here Gemma 4 31B) writes one line per window: *"In the kitchen, I stirred scrambled eggs in a pan on the stove."* When I ask a question, the same model reads only that diary, never the video, and cites the line it used. Neon also records where I look and what I hear; the prototype does not use either yet.

### What is new, and what is not

The recipe, "describe, then read", is not mine: LLoVi [1] and LifelongMemory [2] showed it works on long videos, and Lando et al. [3, 4] write the diary as the video arrives. I follow their design. The closest system on real glasses, VisionClaw [5] (Meta Ray-Ban), recalls the past but keeps no running diary and does not measure how often it is right.

### On my own glasses: the window I closed

I walk to the office window and push it shut:

<video poster="/assets/logs/ego-memory-assistant/window-close-poster.jpg" autoplay muted loop playsinline style="width:100%;display:block;margin:0 auto;border-radius:12px;" aria-label="Seen through the glasses: my hand pushes the sliding office window shut"><source src="/assets/logs/ego-memory-assistant/window-close.mp4" type="video/mp4"><source src="/assets/logs/ego-memory-assistant/window-close.webm" type="video/webm"></video>

The describer only gets 8 photos, and just the last two catch my hand on the glass:

<a href="/assets/logs/ego-memory-assistant/window-frames.jpg"><img src="/assets/logs/ego-memory-assistant/window-frames.jpg" alt="The 8 photos of those 15 seconds, the diary line written for them in two runs, and the two questions: one answered, one not" style="width:100%;display:block;margin:0 auto;" /></a>

So the diary says I touched the window, and in one of two runs that it "remained closed". The reader answers "What did I do at the window?" and points to the moment. It cannot answer "Did I close the window?": nothing in the diary says so.

<a href="/assets/logs/ego-memory-assistant/app.jpg"><img src="/assets/logs/ego-memory-assistant/app.jpg" alt="The demo page: the video, the diary written so far, the photos behind each line, and an answer with its moment" style="width:100%;display:block;margin:0 auto;" /></a>

### What it costs: keeping the diary is almost free, writing it is not

<a href="/assets/logs/ego-memory-assistant/cost.jpg"><img src="/assets/logs/ego-memory-assistant/cost.jpg" alt="Keeping: an hour of life is 14 Word pages of diary against 0.9 GB of video. Writing: the small model takes 1.8 s per 15-second window, the large one 9.6 s, and the large one live on the glasses 29 s, past the 15-second limit" style="width:100%;display:block;margin:0 auto;" /></a>

**Keeping it.** Language models read text in *tokens*, pieces of words; here 100 tokens are about 65 words. On the benchmark videos of part 2, the large model's diary grows by about 195 tokens, or 126 words, per minute of life. In Word's default layout, that is one page every 4 minutes, 14 pages an hour, and about 220 pages for a 16-hour day. The video would take about 15 GB that day, over 20,000 times more. (In the units papers use: 0.67 kB of diary against 15.3 MB of video per minute.)

**Writing it.** A new window arrives every 15 seconds, so each line has 15 seconds to be written. On the benchmark's photos, the large model needs about 10: it keeps up. Live on my glasses, with full-size photos, it needed 29: half the speed of life, so 20 of 46 windows were skipped. A smaller model, Gemma 4 E4B, needs under 2 seconds, but its diary answers about 10 fewer questions in 100.

### What I take from it

The recipe runs on real glasses, and the diary costs almost nothing to keep. What stands in the way is writing it as fast as life goes, and catching changes, not just moments. These numbers come from short sessions, one person, one office; [part 2](/log/remembering-for-you-part-2/) measures how often such mistakes happen.

### Code

The code is open (MIT): [github.com/Enminxo/ego-memory-assistant](https://github.com/Enminxo/ego-memory-assistant), with the demo page, the import of Neon recordings and the relay for the phone.

### References

1. Zhang et al., [*A Simple LLM Framework for Long-Range Video Question-Answering*](https://arxiv.org/abs/2312.17235) (LLoVi), EMNLP 2024.
2. Wang et al., [*LifelongMemory: Leveraging LLMs for Answering Queries in Long-form Egocentric Videos*](https://arxiv.org/abs/2312.05269), arXiv:2312.05269, 2023.
3. Lando, Forte, Farinella and Furnari, [*How Far Can Off-the-Shelf Multimodal Large Language Models Go in Online Episodic Memory Question Answering?*](https://arxiv.org/abs/2506.16450), arXiv:2506.16450, 2025.
4. Lando, Forte and Furnari, [*Exploring Multimodal LMMs for Online Episodic Memory Question Answering on the Edge*](https://arxiv.org/abs/2602.22455), arXiv:2602.22455, 2026.
5. Liu, Lee, Gonzalez, Gonzalez-Franco and Suzuki, [*VisionClaw: Always-On AI Agents through Smart Glasses*](https://arxiv.org/abs/2604.03486), arXiv:2604.03486, 2026.
6. Grauman et al., [*Ego4D: Around the World in 3,000 Hours of Egocentric Video*](https://ego4d-data.org), CVPR 2022.
