---
project: ego-memory-assistant
title: "Remembering for You: Lessons from Building an Episodic Memory Assistant on Smart Glasses"
subtitle: "Part 2: where it goes wrong, and why"
date: 2026-11-11
summary: "Part 2: where it goes wrong, and why."
tags: ["Egocentric AI", "VLM", "Episodic Memory", "Failure Analysis"]
---

<img src="/assets/logs/ego-memory-assistant/logo.png" alt="Remembering for You: round glasses with a clock running backwards in one lens" style="width:170px;max-width:45%;display:block;margin:2rem auto 1.5rem;border:none;box-shadow:none;border-radius:0;" />

In [part 1](/log/remembering-for-you/) I built a memory assistant on Pupil Labs Neon glasses. Every 15 seconds, a vision-language model (Gemma 4 31B) looks at 8 photos and writes one line in a diary of my day; when I ask a question, a language model answers from that diary alone. On my own glasses it answered "What did I do at the window?" but not "Did I close the window?". This part asks how often mistakes like that happen, and why, on 500 questions about other people's videos.

### TL;DR

- On 500 questions from QAEgo4D, the diary raises the score from 31% (no diary at all) to 53%, and a diary written by people gets only 59%.
- Where it fails is clearer than the score: a small model invents objects that come from its own prompt, both models write down things that did not happen, and the diary misses what falls between two photos.

---

### What the papers do not measure

The works this prototype builds on (LLoVi [1], LifelongMemory [2] and the online memory of Lando et al. [3, 4], all described in part 1) report what a paper usually reports: an accuracy on a benchmark, with four or five answer options per question, and, in some, a cost. What none of them puts numbers on is where the errors come from: how many questions a reader gets right with no memory at all, how much better a perfect describer would do, and what kind of false sentences end up in the diary. That is what this post is about.

### How I tested it

To measure it I used QAEgo4D [5], a set of multiple-choice questions about first-person videos: for example, "Where was the red cup before walking towards the tractor?", with four possible answers. The videos come from Ego4D [7], thousands of hours filmed by people wearing head cameras in their daily lives. I used the same 500 four-option questions as Lando et al. [4] (the version called QAEgo4D-Closed [6]), over 148 clips of about 8 minutes. To the usual score I added three things: a reader that gets no diary at all, a diary written from Ego4D's human narrations instead of a model, and, for each describer, 50 doubtful diary mentions checked one by one against their frames.

### A blind reader already gets 31%

With four options, guessing gets 25%. A reader that sees no diary at all gets 31.2%, because many wrong options were generated automatically and are easy to rule out ("on the ceiling"). So any score on this test has to be read against 31%, not 25%. None of the memory works above reports such a control for its own system.

### The diary adds 22 points, and a human-written one only about 5 more

<a href="/assets/logs/ego-memory-assistant/ladder.jpg"><img src="/assets/logs/ego-memory-assistant/ladder.jpg" alt="Questions right out of 500: no diary 31.2%, small model 43.6%, large model 53.4%, human-written diary 59.4%" style="width:100%;display:block;margin:0 auto;" /></a>

With the large model's diary (Gemma 4 31B), the reader gets 53.4%: **22.2 points above the blind reader**, with a 95% interval of [17.7, 26.6] (from resampling clips). The diary clearly helps. A smaller describer, Gemma 4 E4B, gets 43.6%, so who writes the diary matters (+9.8 [5.5, 14.1]).

The human-written diary is the useful comparison. Ego4D's narrations were written by people watching the video, so a diary made from them shows roughly what a much better describer would give. It reaches 59.4%, only 6.0 points above the large model [0.7, 11.1], and with a different order of the options the gap is 4.8 [−0.2, 9.8]: small, and not robust. Two things follow. The large model already writes most of what a person would. And even with a person's diary, 4 questions in 10 stay wrong, so better perception alone would not fix most of what remains. (Narrations describe actions and skip many objects, so this is a soft ceiling: on questions about people, the model's diary even does better.)

### What the small model invents comes from its own prompt

<a href="/assets/logs/ego-memory-assistant/echo.jpg"><img src="/assets/logs/ego-memory-assistant/echo.jpg" alt="The prompt lists keys, wallet, phone, glasses and bags as examples; the small model writes about picking up keys in a third of all windows" style="width:100%;display:block;margin:0 auto;" /></a>

"Fewer points" is not a diagnosis yet. Reading the lines that no narration supports, the small model's most common invention turns out to be its own prompt, read back. The prompt asks the describer to prioritise personal objects "(keys, wallet, phone, glasses, bags)". The small model writes *"I picked up my keys and placed them on the counter near the sink."* word for word 63 times, in 27 of the 148 clips, and names keys in a third of all windows (32.6%). Checked one by one on the frames, 20 of its 50 doubtful mentions were invented; the large model invented none of its 50.

Taking the examples out of the prompt drops keys to 0.1% of the windows and invented objects to 0 of 50. It is a cheap fix, but it does not close the gap: the small model still trails the large one by 7.4 points [3.5, 11.4], and it still names far fewer of the objects the person actually handles.

### Both models write down what did not happen

<a href="/assets/logs/ego-memory-assistant/negations.jpg"><img src="/assets/logs/ego-memory-assistant/negations.jpg" alt="About one window in ten has a negation sentence, for both models; none in the human narrations" style="width:100%;display:block;margin:0 auto;" /></a>

The second kind of false line is more worrying for this use. About one window in ten contains a negation: 11.7% for the small model and 9.4% for the large one, against none in the human narrations. The large model writes *"No personal objects were handled, no food or medication was taken, and no appliances or doors were operated."* 22 times. From 8 frames out of the 450 in those 15 seconds, a describer cannot know that nothing was taken, and yet "no medication was taken" is exactly what a reader needs to answer "Did I take my pill?".

The prompt without examples also added an explicit rule: do not list things I did not do or did not see. The small model's share of negations did not move (11.7%), and its favourite one, *"I did not switch any appliances, taps, doors, or windows."*, went from 123 to 244 occurrences. I have not yet measured how often a negation leads the reader to a wrong answer.

### What falls between two frames never reaches the diary

<a href="/assets/logs/ego-memory-assistant/cup.jpg"><img src="/assets/logs/ego-memory-assistant/cup.jpg" alt="The red cup is visible only in a frame at 5.8 s that the describer never gets; still, every diary reader answers 'on the wood' correctly" style="width:100%;display:block;margin:0 auto;" /></a>

Eight frames in 15 seconds is one every 1.9 seconds, and anything shorter can fall in between. In the first window of one clip, the red cup a question asks about is visible around 5.8 s. The describer gets the frames at 4.7 s and 6.6 s, and the cup is in neither. No diary of that clip, not even the human one, mentions a cup.

Yet all three diaries get the question right ("on the wood"), while the blind reader picks "on the metal". The diaries say again and again that the person handled wood, and the reader picks the option that fits. The answer is right, but nothing remembered the cup. A four-option score counts it as memory all the same.

The window on my own glasses, in [part 1](/log/remembering-for-you/), is the same problem from the other side: there the photos caught the moment, but not the change.

### Limits

- Each diary was written once. Its numbers held with a second option order and with a reader from another family (Qwen), but I did not write each diary several times.
- The test still has four options. This post explains a score; it does not replace it with open-ended answers.
- The human diary is a soft ceiling, because narrations describe actions and skip many objects.
- The checks on the frames are 50 mentions per describer, judged by a single rater on small frames (160×120), and that rater was an AI model (Claude), not a person.

### What I take from it

The recipe works: a text diary of a few hundred bytes per minute adds 22 points. But one score mixes very different things: questions that need no memory, lines the describer invents or negates, and moments that fall between two frames. Pulled apart, they point to different fixes. The describer's habits, like echoing its prompt or writing what did not happen, are cheap to see and partly cheap to fix. What falls between frames, and the time it takes to write the diary live ([part 1](/log/remembering-for-you/)), are the hard part, and that is where I am working next. Neon's gaze is an obvious lead there: where I look could choose which frames get described and which objects get named, the two places where the describer fails today. That is an idea, not a result yet.

### Code

The code of this evaluation (the diaries, the reader with no diary, the diary built from the narrations, the counts of prompt echoes and negations, and the checks on the frames) is in the [`experiments/describer_eval`](https://github.com/Enminxo/ego-memory-assistant/tree/worktree-describer-eval/experiments/describer_eval) folder of the [same repository](https://github.com/Enminxo/ego-memory-assistant), on a separate branch for now. QAEgo4D and Ego4D are not included: both require signing their licenses.

### References

1. Zhang et al., [*A Simple LLM Framework for Long-Range Video Question-Answering*](https://arxiv.org/abs/2312.17235) (LLoVi), EMNLP 2024.
2. Wang et al., [*LifelongMemory: Leveraging LLMs for Answering Queries in Long-form Egocentric Videos*](https://arxiv.org/abs/2312.05269), arXiv:2312.05269, 2023.
3. Lando, Forte, Farinella and Furnari, [*How Far Can Off-the-Shelf Multimodal Large Language Models Go in Online Episodic Memory Question Answering?*](https://arxiv.org/abs/2506.16450), arXiv:2506.16450, 2025.
4. Lando, Forte and Furnari, [*Exploring Multimodal LMMs for Online Episodic Memory Question Answering on the Edge*](https://arxiv.org/abs/2602.22455), arXiv:2602.22455, 2026.
5. Bärmann and Waibel, [*Where Did I Leave My Keys? Episodic-Memory-Based Question Answering on Egocentric Videos*](https://github.com/lbaermann/qaego4d) (QAEgo4D), CVPR Workshops 2022.
6. Di and Xie, [*Grounded Question-Answering in Long Egocentric Videos*](https://arxiv.org/abs/2312.06505) (GroundVQA, the four-option version), CVPR 2024.
7. Grauman et al., [*Ego4D: Around the World in 3,000 Hours of Egocentric Video*](https://ego4d-data.org), CVPR 2022.
