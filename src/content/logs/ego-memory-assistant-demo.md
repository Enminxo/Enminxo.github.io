---
project: ego-memory-assistant
title: "A diary that remembers: asking my glasses what I did"
date: 2026-10-28
summary: "A wearable camera writes a text diary of the day and a language model answers questions from it. What works, what fails, and how I got live video out of the Neon glasses over a weak Wi-Fi."
tags: ["Egocentric AI", "VLM", "Pupil Labs Neon", "Episodic Memory", "Open Source"]
img: /assets/logs/ego-memory-assistant/cover.jpg
img_alt: "What the glasses saw: my hand pushing the office window shut"
---

"Did I take my pill?" "Where did I leave my keys?" "Did I turn off the stove?" For someone with mild cognitive impairment or early Alzheimer's disease, these small questions come up every day, and nobody around may know the answer. A camera worn at eye level sees all of it. The hard part is not recording; it is answering.

This entry is about a prototype that tries to do that, the demo I have been building on top of it, and what I learned getting it to run live with real glasses. The code is now open: [github.com/Enminxo/ego-memory-assistant](https://github.com/Enminxo/ego-memory-assistant).

---

### The idea: from video to text, and from text to an answer

<a href="/assets/logs/ego-memory-assistant/pipeline.jpg"><img src="/assets/logs/ego-memory-assistant/pipeline.jpg" alt="Pipeline: wearable camera, 15 s clips, a vision model writes the diary, a language model reads it and answers with the moment" style="width:100%;display:block;margin:0 auto;" /></a>

The video is cut into 15-second clips. For each clip, a vision-language model (Gemma 4, 31B, running locally on a DGX Spark) looks at 8 frames and writes one line in first person: *"In the kitchen, I used chopsticks to stir vegetables in a pot on the stove."* Those lines, each with its time, are the diary. When you ask something, a language model reads only the diary and answers, citing the moment it relied on, so you can jump to that point of the video and check.

Why text, and not the video itself?

- **It is tiny.** Eight minutes of life fit in about 5 kB of text; the same eight minutes of video weigh 60 to 90 MB.
- **A person can read it.** If the answer is wrong, you can see why: either the diary never mentioned it, or the reader misread it.
- **It can be private.** Once the line is written, the frames can be thrown away. Whether to keep them is a decision, not a technical need.

The design follows two papers from Antonino Furnari's group at the University of Catania, which study this "describe, then read" approach to episodic memory with off-the-shelf multimodal models.

### Does it work?

I tested it on four 8-minute clips from Ego4D, one per everyday need (the stove, the keys, the medication, the wallet), with 59 four-option questions from QAEgo4D. The key is the control: the same reader answering **without** the diary. That control matters because many wrong options in the dataset are absurd ("on the ceiling"), so a model guesses well above chance without seeing anything.

<a href="/assets/logs/ego-memory-assistant/results.jpg"><img src="/assets/logs/ego-memory-assistant/results.jpg" alt="Accuracy with and without the diary on 59 questions, with 95% intervals" style="width:100%;display:block;margin:0 auto;" /></a>

With the diary, the reader got 47 to 54% right; without it, 41 to 42%. That is 5 to 14 points better over three runs, but every 95% interval reaches zero. **With 59 questions, the gain is not established.** It is a promising direction, not a result yet.

The failures were more instructive than the score, because they repeat:

- **It misreads gestures.** The hand touches the stove's panel, and the diary says the stove was switched off. It was not.
- **It writes negatives nobody asked for.** "No medication was taken" appeared in 15 of 128 entries, which is dangerous in this exact use case.
- **It misses what is blurred.** The keys are on the table, but in the one frame where they show, the image is blurred.

And a smaller model (Gemma 4 E4B) was worse in a way that matters even more: it invented things. In a living room with nobody else in it, it wrote that someone was sitting down. A diary that creates false memories is worse than no diary.

### From a dataset to my own glasses

Ego4D is a fine test, but the point is to run it on what *I* see. I used Pupil Labs **Neon** glasses. Neon is a sensor, not a computer: the glasses are wired to a phone running the Companion app, which records and can stream the video over Wi-Fi.

**Record, then ask** works well. You record with the phone, upload the recording to the demo page, and the diary is written as it is read. Here is the sample recording that now ships with the code: I walk to a window, push it shut, and go through two doors.

<a href="/assets/logs/ego-memory-assistant/app.jpg"><img src="/assets/logs/ego-memory-assistant/app.jpg" alt="The demo page: the hand pushes the window shut while the diary says the window remained closed" style="width:100%;display:block;margin:0 auto;" /></a>

It answers "What did I do at the window?" and "Did I open a door?", each with its moment. And it fails "Did I close the window?". The frames show the hand pushing the window shut, but the diary says the window "remained closed". The reader can only answer what the describer wrote down. I kept this failure in the sample on purpose, because it shows in one picture where the weak link is.

### Going live: the Wi-Fi was the problem

Live was harder. The first version read the Companion's plain video stream, which travels over UDP, and the tail of every full picture was lost on the way. Reading the same video through the Companion's WebSocket (TCP) stopped the losses, but not the real issue: the full scene video is about 4.9 Mbit/s, and the office Wi-Fi carried about 9 Mbit/s when I measured it. On a busy afternoon the video fell behind, and 13 of 22 live clips were dropped because no fresh video had arrived.

The fix was to stop sending the video at all. A small relay runs **on the phone itself**, in Termux, next to the Companion app. Inside the phone the video arrives at 127.0.0.1 with nothing in the way. The relay picks the 8 photos each clip needs and sends only those, about 0.7 Mbit/s, a seventh of the video. If the network drops, the photos wait on the phone and catch up later, each one keeping the time it was taken.

<a href="/assets/logs/ego-memory-assistant/relay.jpg"><img src="/assets/logs/ego-memory-assistant/relay.jpg" alt="Before: the whole video crosses the Wi-Fi and clips are lost. After: a relay inside the phone sends 8 photos every 15 s" style="width:100%;display:block;margin:0 auto;" /></a>

In a 10-minute test, all 403 photos arrived, none lost, about half a second after they were taken.

<a href="/assets/logs/ego-memory-assistant/relay-live.jpg"><img src="/assets/logs/ego-memory-assistant/relay-live.jpg" alt="Ten minutes live through the phone: every photo arrived 0.4 s late; about half of the clips were dropped because the describer was slow" style="width:100%;display:block;margin:0 auto;" /></a>

### Now the bottleneck is the describer

Once the network stopped losing things, the next limit showed up immediately. At the glasses' full image size, the 31B model needs about 26 seconds to describe a 15-second clip. It cannot keep up, so about 4 clips in 10 were dropped in that test. The app drops them on purpose and says so, instead of describing an old picture as if it were the present.

<a href="/assets/logs/ego-memory-assistant/describer-speed.jpg"><img src="/assets/logs/ego-memory-assistant/describer-speed.jpg" alt="Seconds to describe one clip by model and image size" style="width:100%;display:block;margin:0 auto;" /></a>

Most of that time is spent reading the image, so it grows with image size: about 11 s at 960×540, 18 s at 1280×960, 26 s at full size. Smaller models are fast enough, but the one I tried invented objects. Finding a describer that is both fast and faithful is the main open problem.

### A side experiment: greeting colleagues by name

Since the relay was already on the phone, it can do one more thing: serve the newest photo three times a second, and speak through the phone's speaker. With that, a small face recognizer on the DGX (YuNet to find faces, SFace to compare them, both on CPU) greeted colleagues by name as they came into view. The whole group agreed to take part, and the face templates are biometric data, so they stay on one machine and are **not** in the public code.

It worked, and it also taught caution: over one evening, three isolated sightings were matched to a colleague who was not in the office. No greeting was spoken only because I required two matches in a row. One evening is not enough to call it reliable.

### Try it

The repository has everything to run the demo on your own machine, with any server that speaks the OpenAI API (I use Ollama):

- a **sample recording** (66 s, no audio) to try the whole loop without any dataset;
- the **phone relay**, a single Python file that runs in Termux and can be reused for anything you want to compute next to the Companion app;
- a WebSocket reader for Neon's live video, for networks where its plain RTSP stream loses pictures;
- the evaluation with its **no-diary control**, which I would insist on for anyone comparing memory methods.

The open problems are listed as issues: a describer small enough to keep up live, noticing state changes (the window), using the glasses' audio, and running the live diary away from the office network. If any of them interests you, I would be glad to hear from you.

### What I take from it

The idea of a diary that remembers for you is simple, and the plumbing can be made robust: moving the work into the phone turned a lossy link into one that lost nothing. What decides whether it helps a person is the line the describer writes. When it writes "the window remained closed" while the hand is pushing it shut, no reader can fix that. That is where the next step is.
