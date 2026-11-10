---
project: ego-memory-assistant
title: "Remembering for You: Lessons from Building an Episodic Memory Assistant on Smart Glasses"
date: 2026-11-10
summary: "A describe-then-read memory, taken apart: where its errors come from on 500 questions, and what it costs to run live on Pupil Labs Neon glasses."
tags: ["Egocentric AI", "VLM", "Pupil Labs Neon", "Episodic Memory", "Failure Analysis"]
img: /assets/logs/ego-memory-assistant/cover.jpg
img_alt: "What the glasses saw: my hand pushing the office window shut"
---

"Did I take my pill?" "Where did I leave my keys?" "Did I turn off the stove?" For someone with mild cognitive impairment or early Alzheimer's disease, these small questions come up every day, and nobody around may know the answer. A camera worn at eye level sees all of it. The hard part is not recording, it is answering.

This post is about an assistant that tries to answer, running on Pupil Labs Neon glasses. The way it works is not mine, and I say so first. What I add is a closer look at it: where its mistakes come from, and what it costs to run.

---

### What is not new

The recipe is "describe, then read". A vision-language model watches the video in short pieces and writes down what happens; later, a language model reads that text to answer questions. LLoVi [1] and LifelongMemory [2] showed in 2023 that this simple recipe works on long videos. Lando, Forte, Farinella and Furnari [3, 4] turned it into an *online* episodic memory: the text is written as the video arrives, one piece every 15 or 30 seconds, and kept as a small diary. My prototype follows their design and their prompts.

The closest system on real glasses is VisionClaw [5]: Meta Ray-Ban glasses stream to a phone, Gemini Live answers, and an agent carries out tasks for the user. Its users also ask about the past ("What did I do yesterday?"), but it keeps no running diary of what the camera sees (the paper describes saving things on request and logging interactions), and how well it recalls is not measured.

These works report what a paper usually reports: an accuracy on a benchmark (for the memory ones, four or five answer options per question) and, in some, a cost. Lando et al. measure their memory at about 3.6 kB per minute [3] and the time per clip on consumer GPUs [4]. What none of the memory works puts numbers on is where the errors come from: how many questions a reader gets right with no memory at all, how much better a perfect describer would do, and what kind of false sentences end up in the diary. That is what this post is about.

### The system, and how I tested it

<a href="/assets/logs/ego-memory-assistant/system.jpg"><img src="/assets/logs/ego-memory-assistant/system.jpg" alt="Three layers: the Neon glasses and their phone; the describer and the diary on a DGX Spark; the reader that answers with the moment. Each arrow is labeled with what crosses it." style="width:100%;display:block;margin:0 auto;" /></a>

The glasses' scene camera is wired to its phone. A small relay on the phone keeps 8 photos of every 15 seconds and sends only those to a DGX Spark on my desk. There, Gemma 4 31B writes one line in the first person for each 15-second window: *"In the kitchen, I stirred scrambled eggs in a pan on the stove."* Only the scene camera is used: Neon also records where I look and what I hear, but the prototype does not use either yet. The diary is text only. When a question comes in, the same model, now as a reader, sees only the diary, never the video, and answers citing the line it relied on, so the moment can be checked.

To measure it I used the same test as Lando et al. [4]: the 500 four-option questions of QAEgo4D-Closed [6, 7], over 148 eight-minute Ego4D clips [8]. To the usual score I added three things: a reader that gets no diary at all, a diary written from Ego4D's human narrations instead of a model, and, for each describer, 50 doubtful diary mentions checked by eye against the frames.

### A blind reader already gets 31%

With four options, guessing gets 25%. A reader that sees no diary at all gets 31.2%, because many wrong options were generated automatically and are easy to rule out ("on the ceiling"). So any score on this test has to be read against 31%, not 25%. None of the memory works above reports such a control for its own system.

### The diary adds 22 points, and a human-written one only about 5 more

<a href="/assets/logs/ego-memory-assistant/ladder.jpg"><img src="/assets/logs/ego-memory-assistant/ladder.jpg" alt="Questions right out of 500: no diary 31.2%, small model 43.6%, large model 53.4%, human-written diary 59.4%" style="width:100%;display:block;margin:0 auto;" /></a>

With the large model's diary, the reader gets 53.4%: **22.2 points above the blind reader**, with a 95% interval of [17.7, 26.6] (from resampling clips). The diary clearly helps. A smaller describer, Gemma 4 E4B, gets 43.6%, so who writes the diary matters (+9.8 [5.5, 14.1]).

The human-written diary is the useful comparison. Ego4D's narrations were written by people watching the video, so a diary made from them shows roughly what a much better describer would give. It reaches 59.4%, only 6.0 points above the large model [0.7, 11.1], and with a different order of the options the gap is 4.8 [−0.2, 9.8]: small, and not robust. Two things follow. The large model already writes most of what a person would. And even with a person's diary, 4 questions in 10 stay wrong, so better perception alone would not fix most of what remains. (Narrations describe actions and skip many objects, so this is a soft ceiling: on questions about people, the model's diary even does better.)

### The 22 points are 150 questions won and 39 lost

<a href="/assets/logs/ego-memory-assistant/dots.jpg"><img src="/assets/logs/ego-memory-assistant/dots.jpg" alt="500 dots in four groups: 150 right only with the diary, 39 right only without it, 117 right either way, 194 wrong either way" style="width:100%;display:block;margin:0 auto;" /></a>

An average hides which questions move. Question by question, the diary turns 150 wrong answers into right ones and 39 right answers into wrong ones; 117 are right either way and 194 wrong either way. The gain is the difference, 111 questions out of 500. With the other option order the picture is the same (165 won, 49 lost). Some of the swaps, in both directions, are noise: given a different prompt, the reader can change a guess it never had grounds for. Only the difference is the effect. And almost a quarter of the questions (117) are answered right with no memory at all.

### What the small model invents comes from its own prompt

<a href="/assets/logs/ego-memory-assistant/echo.jpg"><img src="/assets/logs/ego-memory-assistant/echo.jpg" alt="The prompt lists keys, wallet, phone, glasses and bags as examples; the small model writes about picking up keys in a third of all windows" style="width:100%;display:block;margin:0 auto;" /></a>

"Fewer points" is not a diagnosis yet. Reading the lines that no narration supports, the small model's most common invention turns out to be its own prompt, read back. The prompt asks the describer to prioritise personal objects "(keys, wallet, phone, glasses, bags)". The small model writes *"I picked up my keys and placed them on the counter near the sink."* word for word 63 times, in 27 of the 148 clips, and names keys in a third of all windows (32.6%). Checked by eye on the frames, 20 of its 50 doubtful mentions were invented; the large model invented none of its 50.

Taking the examples out of the prompt drops keys to 0.1% of the windows and invented objects to 0 of 50. It is a cheap fix, but it does not close the gap: the small model still trails the large one by 7.4 points [3.5, 11.4], and it still names far fewer of the objects the person actually handles.

### Both models write down what did not happen

<a href="/assets/logs/ego-memory-assistant/negations.jpg"><img src="/assets/logs/ego-memory-assistant/negations.jpg" alt="About one window in ten has a negation sentence, for both models; none in the human narrations" style="width:100%;display:block;margin:0 auto;" /></a>

The second kind of false line is more worrying for this use. About one window in ten contains a negation: 11.7% for the small model and 9.4% for the large one, against none in the human narrations. The large model writes *"No personal objects were handled, no food or medication was taken, and no appliances or doors were operated."* 22 times. From 8 frames out of the 450 in those 15 seconds, a describer cannot know that nothing was taken, and yet "no medication was taken" is exactly what a reader needs to answer "Did I take my pill?".

The prompt without examples also added an explicit rule: do not list things I did not do or did not see. The small model's share of negations did not move (11.7%), and its favourite one, *"I did not switch any appliances, taps, doors, or windows."*, went from 123 to 244 occurrences. I have not yet measured how often a negation leads the reader to a wrong answer.

### What falls between two frames never reaches the diary

<a href="/assets/logs/ego-memory-assistant/cup.jpg"><img src="/assets/logs/ego-memory-assistant/cup.jpg" alt="The red cup is visible only in a frame at 5.8 s that the describer never gets; still, every diary reader answers 'on the wood' correctly" style="width:100%;display:block;margin:0 auto;" /></a>

Eight frames in 15 seconds is one every 1.9 seconds, and anything shorter can fall in between. In the first window of one clip, the red cup a question asks about is visible around 5.8 s. The describer gets the frames at 4.7 s and 6.6 s, and the cup is in neither. No diary of that clip, not even the human one, mentions a cup.

Yet all three diaries get the question right ("on the wood"), while the blind reader picks "on the metal". The diaries say again and again that the person handled wood, and the reader picks the option that fits. The answer is right, but nothing remembered the cup. A four-option score counts it as memory all the same.

<a href="/assets/logs/ego-memory-assistant/app.jpg"><img src="/assets/logs/ego-memory-assistant/app.jpg" alt="The demo page: the hand pushes the window shut while the diary says the window remained closed" style="width:100%;display:block;margin:0 auto;" /></a>

On my own recording with the Neon glasses the failure is a related one. The frames show my hand pushing the office window shut, and the diary says the window "remained closed". The reader answers "Did I close the window?" from that line, and gets it wrong. A change of state is easy to miss in a few still photos.

### What it costs: storing the diary is almost free, writing it is not

<a href="/assets/logs/ego-memory-assistant/cost.jpg"><img src="/assets/logs/ego-memory-assistant/cost.jpg" alt="Accuracy against seconds to write one 15-second window, with the 15-second live limit; the diary takes 0.67 kB per minute against 15.3 MB per minute of video" style="width:100%;display:block;margin:0 auto;" /></a>

**Storage is the cheap part.** As the reader sees it, with its times, the large model's diary takes 0.67 kB per minute of video, about 195 tokens. The same Ego4D clips take 15.3 MB per minute as video, more than 20,000 times as much. This agrees with the 3.6 kB per minute that Lando et al. report [3], although they do not say exactly what they count, so I would not compare the two numbers closely. The large model even writes shorter diaries than the small one (0.80 kB per minute).

**Writing is the expensive part.** On the benchmark's frames (720×540), the large model takes a median of 9.6 s per 15-second window and the small one 1.8 s: the 10 extra points cost five times the time. Live, at the full size of Neon's scene camera (1600×1200), the large model took 29 s per window in a 10-minute session, so 20 of 46 windows were dropped. The app skips them on purpose rather than describe an old picture as if it were the present. Most of the time goes into reading the images: with the GPU to itself, 8 frames take about 11 s at 960×540, 18 s at 1280×960 and 26 s at full size.

**The network is the third cost.** The whole scene video is about 5 Mbit/s, and the office Wi-Fi did not carry it: on a busy afternoon, 13 of 22 live windows had no fresh video. Moving the work into the phone fixed that. The relay reads the video inside the phone and sends only the 8 photos of each window, about 0.7 Mbit/s; in a 10-minute test all 403 photos arrived, about 0.4 s after they were taken.

Lando et al. measured time per clip on desktop GPUs [4], and VisualClaw [9] lowers the cost of cloud calls by sending fewer frames. Neither runs on glasses, where a slow describer does not lower a score: it loses parts of the day.

### Limits

- Each diary was written once. Its numbers held with a second option order and with a reader from another family (Qwen), but I did not write each diary several times.
- The test still has four options. This post explains a score; it does not replace it with open-ended answers.
- The human diary is a soft ceiling, because narrations describe actions and skip many objects.
- The checks by eye are 50 mentions per describer, judged by one person (me) on small frames.
- The live numbers come from short sessions, by one person, in one office.

### What I take from it

The recipe works: a text diary of a few hundred bytes per minute adds 22 points. But one score mixes very different things: questions that need no memory, lines the describer invents or negates, and moments that fall between two frames. Pulled apart, they point to different fixes. The describer's habits, like echoing its prompt or writing what did not happen, are cheap to see and partly cheap to fix. What falls between frames, and the time it takes to write the diary live, are the hard part, and that is where I am working next. Neon's gaze is an obvious lead there: where I look could choose which frames get described and which objects get named, the two places where the describer fails today. That is an idea, not a result yet.

<!-- TODO before publishing: the repository github.com/Enminxo/ego-memory-assistant is private. Make it public and add a short "Code" section here, or leave it out. -->

### References

1. Zhang et al., [*A Simple LLM Framework for Long-Range Video Question-Answering*](https://arxiv.org/abs/2312.17235) (LLoVi), EMNLP 2024.
2. Wang et al., [*LifelongMemory: Leveraging LLMs for Answering Queries in Long-form Egocentric Videos*](https://arxiv.org/abs/2312.05269), arXiv:2312.05269, 2023.
3. Lando, Forte, Farinella and Furnari, [*How Far Can Off-the-Shelf Multimodal Large Language Models Go in Online Episodic Memory Question Answering?*](https://arxiv.org/abs/2506.16450), arXiv:2506.16450, 2025.
4. Lando, Forte and Furnari, [*Exploring Multimodal LMMs for Online Episodic Memory Question Answering on the Edge*](https://arxiv.org/abs/2602.22455), arXiv:2602.22455, 2026.
5. Liu, Lee, Gonzalez, Gonzalez-Franco and Suzuki, [*VisionClaw: Always-On AI Agents through Smart Glasses*](https://arxiv.org/abs/2604.03486), arXiv:2604.03486, 2026.
6. Bärmann and Waibel, [*Where Did I Leave My Keys? Episodic-Memory-Based Question Answering on Egocentric Videos*](https://github.com/lbaermann/qaego4d) (QAEgo4D), CVPR Workshops 2022.
7. Di and Xie, [*Grounded Question-Answering in Long Egocentric Videos*](https://arxiv.org/abs/2312.06505) (GroundVQA, the four-option version), CVPR 2024.
8. Grauman et al., [*Ego4D: Around the World in 3,000 Hours of Egocentric Video*](https://ego4d-data.org), CVPR 2022.
9. [*VisualClaw: A Real-Time, Personalized Agent for the Physical World*](https://arxiv.org/abs/2606.16295), arXiv:2606.16295, 2026.
