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

We have all asked ourselves at some point: "Where did I leave my keys?" "Did I turn off the stove?" "Did I close the window?" It usually happens on a busy day, about something we did a few minutes earlier without paying attention. Glasses with a camera would have caught the moment we missed. The hard part is not recording. It is remembering the right things.

This post is about a prototype that tries to do that, in two parts. This first part explains how it works, shows it on one minute of my own day with my Pupil Labs Neon glasses, and measures what it costs to run live. [Part 2](/log/remembering-for-you-part-2/) takes its mistakes apart on 500 benchmark questions.

### TL;DR

- I built a memory assistant on Pupil Labs Neon glasses: every 15 seconds a vision-language model writes one line in a diary, and a language model answers questions from that diary, pointing to the moment its answer comes from.
- On my own glasses it answers "What did I do at the window?" but not "Did I close the window?": the photos caught my hand on the glass, not the change.
- Storing the diary costs under 1 kB per minute. Writing it is the expensive part: on my glasses the good model needs about 29 seconds for every 15 seconds of life, so it falls behind.

---

### The system

<a href="/assets/logs/ego-memory-assistant/system.jpg"><img src="/assets/logs/ego-memory-assistant/system.jpg" alt="Three layers: the Neon glasses and their phone; the describer and the diary on a DGX Spark; the reader that answers with the moment. Each arrow is labeled with what crosses it." style="width:100%;display:block;margin:0 auto;" /></a>

The glasses' scene camera is wired to its phone. A small relay on the phone keeps 8 photos of every 15 seconds and sends only those to a DGX Spark on my desk. There, Gemma 4 31B writes one line in the first person for each 15-second window: *"In the kitchen, I stirred scrambled eggs in a pan on the stove."* Only the scene camera is used: Neon also records where I look and what I hear, but the prototype does not use either yet. The diary is text only. When a question comes in, the same model, now as a reader, sees only the diary, never the video, and answers citing the line it relied on, so the moment can be checked.

### Related work

The recipe is "describe, then read". A vision-language model watches the video in short pieces and writes down what happens; later, a language model reads that text to answer questions. LLoVi [1] and LifelongMemory [2] showed in 2023 that this simple recipe works on long videos. Lando, Forte, Farinella and Furnari [3, 4] turned it into an *online* episodic memory: the text is written as the video arrives, one piece every 15 or 30 seconds, and kept as a small diary. My prototype follows their design and their prompts.

The closest system on real glasses is VisionClaw [5]: Meta Ray-Ban glasses stream to a phone, Gemini Live answers, and an agent carries out tasks for the user. Its users also ask about the past ("What did I do yesterday?"): recall is 12% of their requests. But the paper does not describe a running diary of what the camera sees (recall draws on saved items and logged interactions), and it does not measure how often recall is right.

### On my own glasses: the window I closed

Benchmarks use other people's videos. The point of the glasses is to run this on mine, so here is one short recording, from start to finish. I wear the Neon glasses, wired to their phone, record with the Companion app, and upload the recording to the demo page. The diary is written as the video is read, and questions can be asked at any moment. (It also runs live, through the relay on the phone; that part is mostly about cost, so it comes later.)

In the recording I walk to the office window, push it shut, and go through two doors. This is the moment the window closes:

<video poster="/assets/logs/ego-memory-assistant/window-close-poster.jpg" autoplay muted loop playsinline style="width:100%;display:block;margin:0 auto;border-radius:12px;" aria-label="Seen through the glasses: my hand pushes the sliding office window shut"><source src="/assets/logs/ego-memory-assistant/window-close.mp4" type="video/mp4"><source src="/assets/logs/ego-memory-assistant/window-close.webm" type="video/webm"></video>

The describer never sees this video. It gets 8 photos of every 15 seconds, and only the last two catch my hand on the glass:

<a href="/assets/logs/ego-memory-assistant/window-frames.jpg"><img src="/assets/logs/ego-memory-assistant/window-frames.jpg" alt="The 8 photos of the first 15 seconds, the two diary lines written for them in two runs, and which questions the reader can answer" style="width:100%;display:block;margin:0 auto;" /></a>

So the diary says I touched the window, and in one of two runs that the window "remained closed". The reader answers "What did I do at the window?" well, and cites the moment, so I can jump to it in the video. It cannot answer "Did I close the window?", because nothing in the diary says so.

<a href="/assets/logs/ego-memory-assistant/app.jpg"><img src="/assets/logs/ego-memory-assistant/app.jpg" alt="The demo page: the video, the diary written so far, the photos behind each line, and an answer with its moment" style="width:100%;display:block;margin:0 auto;" /></a>

Two more things showed up in this one minute of my own day. The last line of one diary says *"I did not pick up or put down any personal objects, take any medication or food, or operate any appliances or doors"*, right after a line where I open a door. That line covers only the last 6.5 seconds, where it is true, but a reader asked "Did I open a door?" sees both. And in quick tests on this one video, Gemma 4 31B never wrote that I closed the window in any setting I tried, while Qwen 3.8 (27B) did in 8 of 12 tries, but only with 5-second clips around the gesture, not with the app's 15-second ones. That is a lead, not a result: shorter clips, a prompt that asks about states, or a second look when something changes are the next things to try.

### What it costs: storing the diary is almost free, writing it is not

<a href="/assets/logs/ego-memory-assistant/cost.jpg"><img src="/assets/logs/ego-memory-assistant/cost.jpg" alt="Accuracy against seconds to write one 15-second window, with the 15-second live limit; the diary takes 0.67 kB per minute against 15.3 MB per minute of video" style="width:100%;display:block;margin:0 auto;" /></a>

**Storage is the cheap part.** As the reader sees it, with its times, the large model's diary takes 0.67 kB per minute of video, about 195 tokens. The videos it was written from (the Ego4D [6] clips of the benchmark in part 2) take 15.3 MB per minute, more than 20,000 times as much. This agrees with the 3.6 kB per minute that Lando et al. report [3], although they do not say exactly what they count, so I would not compare the two numbers closely. A smaller describer, Gemma 4 E4B, writes slightly longer diaries (0.80 kB per minute).

**Writing is the expensive part.** On the benchmark's frames (720×540), the large model takes a median of 9.6 s per 15-second window and the small one 1.8 s. The small model's diary answers about 10 points fewer questions ([part 2](/log/remembering-for-you-part-2/) explains how that was measured), so those 10 points cost five times the time. Live, at the full size of Neon's scene camera (1600×1200), the large model took 29 s per window in a 10-minute session, so 20 of 46 windows were dropped. The app skips them on purpose rather than describe an old picture as if it were the present. Most of the time goes into reading the images: with the GPU to itself, 8 frames take about 11 s at 960×540, 18 s at 1280×960 and 26 s at full size.

**The network is the third cost.** The whole scene video is about 5 Mbit/s, and the office Wi-Fi did not carry it: on a busy afternoon, 13 of 22 live windows had no fresh video. Moving the work into the phone fixed that. The relay reads the video inside the phone and sends only the 8 photos of each window, about 0.7 Mbit/s; in a 10-minute test all 403 photos arrived, about 0.4 s after they were taken.

Lando et al. measured time per clip on desktop GPUs [4], and VisualClaw [7] lowers the cost of cloud calls by sending fewer frames. Neither runs on glasses, where a slow describer does not lower a score: it loses parts of the day.

### What I take from it

The recipe runs on real glasses, and keeping the diary is almost free: a few hundred bytes per minute. Two things stand in the way. With the model that writes it well, the diary is written more slowly than life goes by, so parts of the day are lost. And even when the photos catch the moment, the diary can miss the change: it saw my hand on the window, not the window closing. These live numbers come from short sessions, by one person, in one office. [Part 2](/log/remembering-for-you-part-2/) asks how often mistakes like these happen, on 500 questions about other people's videos, and pulls apart where they come from.

### References

1. Zhang et al., [*A Simple LLM Framework for Long-Range Video Question-Answering*](https://arxiv.org/abs/2312.17235) (LLoVi), EMNLP 2024.
2. Wang et al., [*LifelongMemory: Leveraging LLMs for Answering Queries in Long-form Egocentric Videos*](https://arxiv.org/abs/2312.05269), arXiv:2312.05269, 2023.
3. Lando, Forte, Farinella and Furnari, [*How Far Can Off-the-Shelf Multimodal Large Language Models Go in Online Episodic Memory Question Answering?*](https://arxiv.org/abs/2506.16450), arXiv:2506.16450, 2025.
4. Lando, Forte and Furnari, [*Exploring Multimodal LMMs for Online Episodic Memory Question Answering on the Edge*](https://arxiv.org/abs/2602.22455), arXiv:2602.22455, 2026.
5. Liu, Lee, Gonzalez, Gonzalez-Franco and Suzuki, [*VisionClaw: Always-On AI Agents through Smart Glasses*](https://arxiv.org/abs/2604.03486), arXiv:2604.03486, 2026.
6. Grauman et al., [*Ego4D: Around the World in 3,000 Hours of Egocentric Video*](https://ego4d-data.org), CVPR 2022.
7. [*VisualClaw: A Real-Time, Personalized Agent for the Physical World*](https://arxiv.org/abs/2606.16295), arXiv:2606.16295, 2026.
