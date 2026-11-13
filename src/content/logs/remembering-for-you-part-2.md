---
project: ego-memory-assistant
title: "Remembering for You: Lessons from Building an Episodic Memory Assistant on Smart Glasses"
subtitle: "Part 2: where it goes wrong, and why"
date: 2026-11-11
summary: "Part 2: where it goes wrong, and why."
tags: ["Egocentric AI", "VLM", "Episodic Memory", "Failure Analysis"]
---

<img src="/assets/logs/ego-memory-assistant/logo.png" alt="Remembering for You: round glasses with a clock running backwards in one lens" style="width:170px;max-width:45%;display:block;margin:2rem auto 1.5rem;border:none;box-shadow:none;border-radius:0;" />

In [part 1](/log/remembering-for-you/) I built a memory assistant on Pupil Labs Neon glasses: an AI model writes a diary from 8 photos every 15 seconds, then answers my questions from that diary alone. This part asks how often it goes wrong, and why, on 500 questions about other people's videos.

### TL;DR

- With the diary, the AI answers 53% of the questions right; with no diary it already gets 31%, and with a diary written by people, 59%.
- The score hides three different failures: a small model invents objects from its own instructions, both models write down things that did not happen, and what happens between two photos never reaches the diary.

---

### How I tested it

QAEgo4D [5, 6] asks multiple-choice questions, four answers each, about first-person videos from Ego4D [7], filmed with head cameras: "Where was the red cup before walking towards the tractor?". I used the 500 questions of Lando et al. [4], over 148 clips of about 8 minutes, and added three checks the papers I build on [1-4] lack: a reader with no diary, a diary written from Ego4D's human narrations, and an eye check of 50 doubtful mentions per model.

### The diary adds 22 points; a human-written one, only 5 to 6 more

<a href="/assets/logs/ego-memory-assistant/ladder.jpg"><img src="/assets/logs/ego-memory-assistant/ladder.jpg" alt="Questions right out of 500: no diary 31.2%, small model 43.6%, large model 53.4%, human-written diary 59.4%" style="width:100%;display:block;margin:0 auto;" /></a>

Guessing gets 25%, but a reader with no diary already gets 31%: many wrong options were generated automatically and are easy to rule out ("on the ceiling"). With a diary from the large model (Gemma 4 31B) the reader gets 53%, 22 points more; from a small one (Gemma 4 E4B), 44%.

A diary made from Ego4D's human narrations shows roughly what a much better describer would give: 59%, only 5 to 6 points more, and not a robust gap (see Limits). Even a person's diary leaves 4 questions in 10 wrong, so better perception alone would not fix most of what remains.

### The small model's inventions come from its own instructions

<a href="/assets/logs/ego-memory-assistant/echo.jpg"><img src="/assets/logs/ego-memory-assistant/echo.jpg" alt="The prompt gives keys, wallet, phone, glasses and bags as examples; the small model names keys in a third of all windows, the large one almost never" style="width:100%;display:block;margin:0 auto;" /></a>

The describer's instructions (its *prompt*) list "keys, wallet, phone, glasses, bags" as examples, and the small model reads them back: it writes *"I picked up my keys and placed them on the counter near the sink."* word for word 63 times, and names keys in a third of all windows. Checked by eye, 20 of its 50 doubtful mentions were invented; the large model invented none.

Removing the examples drops keys to almost zero and invented objects to 0 of 50. It is a cheap fix, but the small model still trails the large one by about 7 points.

### Both models write down what did not happen

<a href="/assets/logs/ego-memory-assistant/negations.jpg"><img src="/assets/logs/ego-memory-assistant/negations.jpg" alt="About one window in ten has a negation sentence, for both models, even when told not to; none in the human narrations" style="width:100%;display:block;margin:0 auto;" /></a>

About one window in ten contains a negation, for both models; the human narrations have none. The large model writes *"No personal objects were handled, no food or medication was taken, and no appliances or doors were operated."* 22 times. From 8 photos it cannot know that nothing was taken, yet "no medication was taken" is exactly what answers "Did I take my pill?".

Telling the small model not to list what it did not see changed nothing: still 11.7%, and its favourite negation went from 123 to 244 times.

### What happens between two photos never reaches the diary

<a href="/assets/logs/ego-memory-assistant/cup.jpg"><img src="/assets/logs/ego-memory-assistant/cup.jpg" alt="The red cup shows only at 5.8 s, between two of the photos the describer gets; no diary mentions it, yet every diary reader answers 'on the wood' correctly" style="width:100%;display:block;margin:0 auto;" /></a>

Eight photos in 15 seconds is one every 1.9 seconds, and anything shorter can fall in between. In one clip, the red cup a question asks about shows only at 5.8 s, between two photos, so no diary mentions it, not even the human one.

Yet all three diaries answer right ("on the wood"), while the reader with no diary says "on the metal": the diaries say the person handled wood, and the reader picks the option that fits. Nothing remembered the cup, but a four-option score counts it as memory.

### Limits

- **Uncertainty** (95% intervals, resampling clips): diary vs. no diary +22.2 points [17.7, 26.6]; large vs. small model +9.8 [5.5, 14.1]; human vs. large +6.0 [0.7, 11.1], but +4.8 [−0.2, 9.8] with another option order, so not robust; small model without the examples vs. large −7.4 [−11.4, −3.5].
- Each diary was written once; the results held with a second option order and with a reader from another family (Qwen).
- I have not measured how often a negation leads to a wrong answer.
- The test still has four options: this post explains the score, it does not replace it.
- The human diary is a soft ceiling: narrations describe actions and skip many objects.
- The eye checks are 50 mentions per model on small photos (160×120), by one rater: an AI model (Claude), not a person.

### What I take from it

A diary that fills one Word page every 4 minutes adds 22 points, but the score mixes very different things: questions that need no memory, lines the describer invents or negates, and moments between photos. The describer's habits are cheap to see and partly to fix. What falls between photos, and writing as fast as life goes ([part 1](/log/remembering-for-you/)), are the hard part and where I am working next. Neon's gaze is an obvious lead: where I look could choose which photos get described. That is an idea, not a result yet.

### Code

The evaluation code is in [`experiments/describer_eval`](https://github.com/Enminxo/ego-memory-assistant/tree/worktree-describer-eval/experiments/describer_eval) of the [same repository](https://github.com/Enminxo/ego-memory-assistant), on a separate branch for now. QAEgo4D and Ego4D need their own licenses.

### References

1. Zhang et al., [*A Simple LLM Framework for Long-Range Video Question-Answering*](https://arxiv.org/abs/2312.17235) (LLoVi), EMNLP 2024.
2. Wang et al., [*LifelongMemory: Leveraging LLMs for Answering Queries in Long-form Egocentric Videos*](https://arxiv.org/abs/2312.05269), arXiv:2312.05269, 2023.
3. Lando, Forte, Farinella and Furnari, [*How Far Can Off-the-Shelf Multimodal Large Language Models Go in Online Episodic Memory Question Answering?*](https://arxiv.org/abs/2506.16450), arXiv:2506.16450, 2025.
4. Lando, Forte and Furnari, [*Exploring Multimodal LMMs for Online Episodic Memory Question Answering on the Edge*](https://arxiv.org/abs/2602.22455), arXiv:2602.22455, 2026.
5. Bärmann and Waibel, [*Where Did I Leave My Keys? Episodic-Memory-Based Question Answering on Egocentric Videos*](https://github.com/lbaermann/qaego4d) (QAEgo4D), CVPR Workshops 2022.
6. Di and Xie, [*Grounded Question-Answering in Long Egocentric Videos*](https://arxiv.org/abs/2312.06505) (GroundVQA, the four-option version), CVPR 2024.
7. Grauman et al., [*Ego4D: Around the World in 3,000 Hours of Egocentric Video*](https://ego4d-data.org), CVPR 2022.
