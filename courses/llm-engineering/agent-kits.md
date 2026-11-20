=== setup | Starter AGENTS.md
Every module ends with a <strong>Build it with an agent</strong> kit: a brief to hand your coding agent, a prompt for reviewing the result in a fresh session, and a short list of things to check yourself. Keep all eight weeks in one <code>llm-lab</code> repo, with a folder per week, so later weeks can reuse earlier code.

The code in each lesson shows what good looks like. You'll rarely type it; you'll compare your agent's output against it. Start the repo with the file below. Codex, Cursor and most other agents read <code>AGENTS.md</code> directly; for Claude Code, also add a <code>CLAUDE.md</code> containing the single line <code>@AGENTS.md</code>. Weeks 3 and 7 run on a Colab GPU: there, ask your agent to write the notebook, then run it in Colab yourself.
--- brief
# LLM lab

Eight weekly LLM projects, one folder each (week1/ to week8/), built from the briefs in docs/briefs/.

## How to work
- Given a brief, first write docs/PLAN.md: phases, each with success criteria you can verify yourself (tests, commands and their output, pages checked in a browser), as checkboxes. Then stop and wait for my approval.
- After approval, build one phase at a time, run the tests, tick the criteria and commit.
- Tests never call a paid model. Use a stub, or a local model through Ollama.
- Keys live in .env, which is git-ignored. Never print or commit them.
- Prefer small modules with functions over long notebooks; notebooks are for exploring and for Colab.
- Never lower a check to make it pass; stop and ask instead.
- Ask before anything that spends money beyond small model calls (GPU rentals, fine-tuning jobs, deployments).

## Stack
Python 3.12 with uv. OpenAI client for OpenAI-compatible endpoints (OpenAI, OpenRouter, Ollama). Gradio for interfaces. pytest and ruff.

=== m0 | The project and a first test call
--- brief
# Brief: the workshop

## Goal
Set up the llm-lab repo so every later week just runs.

## Requirements
- A uv project on Python 3.12 with openai, python-dotenv, requests, gradio and jupyter; .env and .gitignore.
- llm.py: a client() helper that returns an OpenAI-compatible client for "openai", "openrouter" or "ollama" from a name, with keys from .env and base URLs filled in.
- test_call.py: one call to a local Ollama model and, if a key is present, one to a frontier model; print the reply, the token counts and the time taken.
- A README section listing the keys the course uses and where to get each.

## Success criteria
- [ ] `uv run test_call.py` works with only Ollama running and no keys
- [ ] With an OpenAI or OpenRouter key, it also prints a frontier reply and its token counts
- [ ] .env is ignored by git
--- review
Fresh-context review. Read AGENTS.md and docs/briefs/m0.md. Run the success criteria. Check that keys are only read from the environment, that a missing key gives a clear message rather than a stack trace, and that the helper doesn't hard-code a model name. Report problems; don't fix them.
--- check
- You know which models you can run free and which need a key
- A spending limit is set on every paid account
- `git status` doesn't show .env

=== m1 | A web-page summarizer, then a two-step brochure writer
--- brief
# Brief: summarizer and brochure

## Goal
week1/: summarize any web page, then write a company brochure from a company's site with two model calls.

## Requirements
- fetch_text(url): the page title and visible text, scripts and styles removed, truncated to a configurable length.
- summarize(url, model): a short markdown summary, with system and user prompts as named constants.
- brochure(company, url, model): first call picks relevant links (about, careers, products) and returns them as JSON; code fetches those pages; second call writes the brochure in markdown, streamed.
- Works with a frontier model or a local Ollama model, chosen by a flag.
- Unit tests for fetch_text on saved HTML fixtures, and for parsing the links JSON, including a malformed reply.

## Success criteria
- [ ] `uv run week1/summarize.py https://example.com` prints a summary
- [ ] `uv run week1/brochure.py "Hugging Face" https://huggingface.co` streams a brochure
- [ ] Tests pass without network or model calls
--- review
Fresh-context review. Read docs/briefs/m1.md. Run the criteria. Check the link-picking call asks for JSON and the code survives invalid JSON; check fetched pages are truncated before being sent; check prompts are constants, not inline strings scattered through the code. Report problems; don't fix them.
--- check
- You can say why the brochure takes two model calls instead of one
- You've seen a summary from a local model and a frontier one, and compared them
- A broken or huge page doesn't crash it

=== m2 | FlightAI, a chat assistant that uses tools
--- brief
# Brief: FlightAI

## Goal
week2/: a chat assistant for a fictional airline that looks up fares in a database and can show a picture of the destination.

## Requirements
- A SQLite table of return fares by city, seeded with ten cities.
- A get_ticket_price(destination_city) tool with a JSON Schema description, and a chat function that runs the tool loop: handle several tool calls in one turn, one tool message per call id, and a cap on turns.
- A gr.ChatInterface first, then a gr.Blocks layout with the chat, an image and an audio player.
- Optional: an image of the destination and a spoken reply.
- Log every tool call to the console.
- Tests with a stub model that requests two tools at once.

## Success criteria
- [ ] "How much is a return to London and Paris?" gives both fares from the database
- [ ] An unknown city gets a clear "no fare" answer, not an error
- [ ] The two-tool test passes with a stub model
--- review
Fresh-context review. Read docs/briefs/m2.md. Check that every tool_call_id gets exactly one tool message, that the assistant's tool request is appended before the results, that the loop has a turn limit, and that database errors come back to the model as text. Report problems; don't fix them.
--- check
- You've watched the console log show two tool calls in one turn
- You can explain why the history is sent again on every call
- The fare in the answer is the one in the database

=== m3 | Meeting minutes from audio, on a Colab GPU
--- brief
# Brief: meeting minutes

## Goal
week3/minutes.ipynb, for Google Colab: transcribe a meeting recording with an open speech model, then write minutes with an open chat model.

## Requirements
- Cells in order: install, log in to Hugging Face from Colab's secrets (HF_TOKEN), load audio from Drive or an upload, transcribe with a Whisper-family model through a pipeline, then generate minutes with a small instruct model loaded in 4-bit.
- Use the model's chat template; stream the output.
- Minutes in markdown: summary, decisions, action items with owners.
- A final cell that frees GPU memory between models.
- Markdown cells explaining what each step does and which GPU it needs.

## Success criteria
- [ ] The notebook runs top to bottom on a free T4 runtime
- [ ] A ten-minute recording produces minutes with action items
- [ ] No token or key appears in the notebook
--- review
Fresh-context review. Read docs/briefs/m3.md and the notebook. Check the token comes from Colab secrets, the chat template is applied with add_generation_prompt, memory is released between models, and the model choices fit a 15 GB GPU. Report problems; don't fix them.
--- check
- You ran it in Colab yourself, from a fresh runtime
- You can say how much GPU memory each model used
- The action items match what was said in the recording

=== m4 | A model race: Python to C++, measured
--- brief
# Brief: the C++ race

## Goal
week4/: convert Python programs to C++ with several models, compile and run each safely, and compare correctness and speed.

## Requirements
- Two benchmark Python programs that print a result and their time.
- One call that asks a model for the right compile command for this machine (OS, CPU, compiler).
- port(model, source): asks for C++ only, strips any fences, writes main.cpp.
- Compile and run inside a Docker container with no network and a timeout; compare output with Python's; record the speedup.
- Race at least four models, including an open-weights one, three times each, and write a results table.
- A Gradio UI with a model dropdown.

## Success criteria
- [ ] `uv run week4/race.py` prints a table: model, compiled, correct, speedup, for each program and run
- [ ] Generated code never runs outside the container
- [ ] A program that loops forever is stopped by the timeout
--- review
Fresh-context review. Read docs/briefs/m4.md. Check that generated code only ever executes inside the container, with the network disabled and a timeout; that correctness compares outputs, not just exit codes; and that results come from more than one run. Report problems; don't fix them.
--- check
- You saw at least one model's code fail to compile or give the wrong answer
- The speedups differ between runs, and you know by how much
- You'd trust the container with code you hadn't read

=== m5 | An expert assistant over a document collection, with a real evaluation
--- brief
# Brief: RAG assistant

## Goal
week5/: answer questions about one company from its documents, and measure retrieval and answers.

## Requirements
- A knowledge base of 30 to 80 markdown documents in folders by type (generate a consistent fictional company if needed).
- Chunk, embed and store in Chroma; a 2D plot of the vectors coloured by document type.
- A Gradio chat that retrieves the top k chunks and answers from them, citing the documents used.
- A test set of 50 or more questions with keywords and reference answers, across direct facts, dates, comparisons and questions spanning several documents.
- Evaluation: hit rate, MRR and keyword coverage for retrieval; an LLM judge for answer accuracy and completeness.
- Then try LLM-based chunking, query rewriting and reranking one at a time, keeping only what improves the scores.

## Success criteria
- [ ] `uv run week5/evaluate.py` prints retrieval and answer scores by question type
- [ ] Each improvement is recorded with before and after numbers
- [ ] The chat cites its sources for every answer
--- review
Fresh-context review. Read docs/briefs/m5.md. Check the test questions aren't answerable from the model's general knowledge alone, that retrieval metrics are computed per question before averaging, and that kept improvements beat the baseline on the same test set. Sample five answers and check the cited chunks support them. Report problems; don't fix them.
--- check
- You can name the question type the system is worst at
- You checked that the plot clusters documents by type
- An improvement you tried made things worse, and you dropped it

=== m6 | A product price predictor: data, baselines and frontier models
--- brief
# Brief: The Price Is Right, part 1

## Goal
week6/: curate a product dataset, build one evaluation for every approach, and score traditional and frontier baselines.

## Requirements
- Load product metadata from several categories of a public dataset with the datasets library; parse title, text, category, weight and price; filter with explicit rules (price range, minimum text length).
- Plots of price, text length and category; rebalance if one dominates. Train and test splits saved to disk.
- An LLM rewrite of each item into a short standard description, using a batch API; a lite size (about 20,000) and a full size behind one switch.
- A Tester that runs any pricing function over a fixed test sample and reports average absolute error with a chart.
- Baselines: constant, linear regression, bag of words, random forest, XGBoost, a small neural network, and two frontier models with no training.

## Success criteria
- [ ] `uv run week6/leaderboard.py` prints every approach's error, lowest first
- [ ] Every approach uses the same Tester and test sample
- [ ] The test set is never used for training or tuning
--- review
Fresh-context review. Read docs/briefs/m6.md. Check for leakage between train and test (duplicates, shared items), that the Tester's sample is fixed, and that the frontier models aren't shown test prices. Report problems; don't fix them.
--- check
- You looked at the data's distributions before training anything
- The constant baseline is on the leaderboard
- You can explain why the frontier models do well with no training

=== m7 | Fine-tuning an open model with QLoRA
--- brief
# Brief: The Price Is Right, part 2

## Goal
week7/finetune.ipynb, for Colab: fine-tune a small open base model with QLoRA to predict prices, and evaluate it with Week 6's Tester.

## Requirements
- Training prompts from Week 6's data that end exactly where the price begins; push train and test sets to the Hugging Face Hub.
- Evaluate the base model in 4-bit before training.
- LoRA config (rank, alpha, dropout, target modules) and an SFT trainer, with checkpoints pushed to the Hub so a disconnect loses nothing.
- Train on the lite data first; log the loss.
- Evaluate the trained adapter with the same Tester and sample; parse the price robustly from the output.
- A markdown summary of hyperparameters, training time, cost and the new error.

## Success criteria
- [ ] The notebook runs on a single Colab GPU
- [ ] The fine-tuned error is reported beside Week 6's leaderboard
- [ ] Training can resume from the last pushed checkpoint
--- review
Fresh-context review. Read docs/briefs/m7.md and the notebook. Check the evaluation uses exactly Week 6's test sample, that the prompt format at evaluation matches training, that the price parser handles junk output, and that no token is in the notebook. Report problems; don't fix them.
--- check
- You watched the loss fall and level off
- You evaluated the base model first, so you know what training added
- You know how much the run cost

=== m8 | A multi-agent deal finder that notifies your phone
--- brief
# Brief: The Price Is Right, part 3

## Goal
week8/: an autonomous system that scans deal feeds, prices each deal with an ensemble, and notifies you of the best ones.

## Requirements
- A specialist agent that calls the Week 7 model deployed on Modal (or a stub if not deployed).
- A frontier agent that prices an item using the five most similar training products from Chroma as context.
- An ensemble agent that combines the specialist, frontier agent and a neural network with weights chosen on a validation set.
- A scanner agent that reads RSS deal feeds and returns structured deals; a messaging agent that sends a Pushover notification.
- A planning agent with three tools (scan, estimate, notify) and a memory file of deals already surfaced.
- A Gradio dashboard on a timer: deals table, agent logs, and a plot of the product vector space.

## Success criteria
- [ ] One planning run surfaces a deal and sends one notification
- [ ] A second run never notifies the same deal again
- [ ] The ensemble's error is reported with the weights and how they were chosen
--- review
Fresh-context review. Read docs/briefs/m8.md. Check ensemble weights were chosen on validation data, not the test set; that the memory file prevents repeats; that Modal secrets aren't in code; and that the planner has a step limit. Report problems; don't fix them.
--- check
- You received a notification on your phone
- The ensemble beats each of its parts on the test set
- You know what runs on Modal and what it costs while idle

=== m9 | Turn one project into something production-shaped
--- brief
# Brief: from prototype to production

## Goal
Take one of the earlier projects (the RAG assistant or the deal finder) and make it production-shaped.

## Requirements
- Package the code as modules with a config file; no notebook needed to run it.
- An evaluation suite that runs in one command and fails if quality drops below a threshold.
- Structured logging of every model call: model, tokens, cost, latency.
- Retries with backoff and timeouts on every external call.
- A budget check that stops work when a daily cost limit is reached.
- A Dockerfile and a README covering setup, configuration, running, evaluating and costs.

## Success criteria
- [ ] `docker build` and `docker run` start the app with only environment variables for configuration
- [ ] The evaluation command exits non-zero when a deliberately broken prompt lowers quality
- [ ] The log shows cost per request
--- review
Fresh-context review. Read docs/briefs/m9.md. Check that secrets come only from the environment, every external call has a timeout, the budget check really stops work, and the README is enough for someone new to run it. Report problems; don't fix them.
--- check
- Someone else ran it from the README alone
- You broke a prompt and the evaluation caught it
- You know the cost per request
