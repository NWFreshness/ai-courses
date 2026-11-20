# Recall cards for the review deck. One "=== <module id>" per module, then Q:/A: pairs.
# Backticks become code. Editing a question resets that card's schedule.

=== m0
Q: With uv, what replaces `pip install` and `python script.py`?
A: `uv add` installs a package into the project; `uv run script.py` runs a script in the project's environment. You never activate the .venv by hand.

Q: Name the three details behind most "key not found" errors with a .env file.
A: The file must be named exactly `.env` (not .env.txt), there's no space around the equals sign, and the file has to be saved.

Q: Why do API keys go in .env rather than in a notebook cell?
A: Notebooks get shared, pushed and pasted, so a key typed into a cell ends up public. A .env file listed in .gitignore stays on your machine.

Q: What's the free fallback for every paid API call in the course?
A: Ollama: it runs open models locally behind an OpenAI-compatible endpoint (http://localhost:11434).

Q: A notebook throws a NameError. What's almost always the cause?
A: A cell above it wasn't run. Restart the kernel and run from the top.

Q: What two money safeguards should every paid account have?
A: A monthly spending limit, and auto-recharge turned off.

=== m1
Q: What does a chat completions request contain, and what comes back?
A: A model name and a list of role-tagged messages (system, user, assistant). The response is the model's prediction of the next assistant message.

Q: What does the system message do, compared with user and assistant messages?
A: The system message sets the job and the tone. User messages are what you ask; assistant messages are what the model said earlier.

Q: What does the `openai` client library actually contain?
A: No model. It builds an HTTP request to /v1/chat/completions and parses the JSON reply, which is why changing `base_url` and the key points it at other providers.

Q: Why are models oddly bad at counting the letters in a word?
A: They read tokens, not characters. The letters are hidden inside tokens.

Q: You tell a model your name, then ask for it in the next call. Why doesn't it know?
A: Every call is stateless. Chat apps fake memory by resending the whole conversation each time, which is also why long chats cost more and eventually run out of room.

Q: What three techniques make the brochure writer work?
A: Ask for JSON with an example, let code do what code is good at (fetching pages), and stream long answers.

Q: Showing one example of the output you want is called what? Several examples?
A: One-shot prompting; several is few-shot.

Q: A scraper gets almost no text from a site. Why, and what's the fix?
A: The site builds its content with client-side JavaScript (or blocks bots). A browser-automation tool such as Playwright renders the page first.

=== m2
Q: Name the four ways to reach a model, with the trade-off of each.
A: Native SDK (full features, a different shape per provider), OpenAI-compatible endpoint (one shape, some features missing), a router such as OpenRouter (one key for many models, a middleman), and an abstraction library such as LiteLLM (one call plus cost tracking).

Q: What is inference-time scaling?
A: Spending more compute per question (reasoning tokens) rather than training a bigger model. That's what reasoning effort controls.

Q: When should you turn reasoning effort up, and when down?
A: Down (none or low) for summarizing; up for puzzles, math and code. More effort costs tokens and time.

Q: How should you order a prompt so prompt caching helps?
A: Stable, shared content first (system prompt, documents), the changing question last. Caching only reuses an identical prefix.

Q: In Gradio, how do you make output stream?
A: Make the function a generator that yields successively longer strings.

Q: What must a `gr.ChatInterface` function build from the message and history?
A: The messages list the API wants: the system prompt, then the history, then the new message.

Q: Does the model run your tool function?
A: No. It asks for a call with arguments; your code decides whether and how to run it, then sends the result back.

Q: Why is the tool-handling code a `while` loop rather than a single `if`?
A: So the model can chain several lookups. That loop is the heart of every agent.

Q: What should a tool return when there's no result?
A: Something the model can read and act on, such as "No price found for Lisbon", not None or a raw exception. And exactly one result per tool call ID.

=== m3
Q: Where should your Hugging Face token live in Colab?
A: Under Secrets (the key icon), read with `userdata.get("HF_TOKEN")`, never in a cell.

Q: What's lost when a Colab runtime disconnects, and how do you protect against it?
A: Installed packages, downloaded models and files in /content. Save outputs to Google Drive or push them to the Hugging Face Hub.

Q: What does a Hugging Face `pipeline` bundle, and what's the trade-off?
A: A default model, its tokenizer and the pre- and post-processing for a task. It's fast, but you get the task's defaults unless you pass your own model.

Q: Why must a chat model's input go through its own chat template?
A: The model was trained on conversations wrapped in its family's special tokens. Skip the template or mix up tokenizers and it sees a format it never learned.

Q: Roughly how much GPU memory does an 8B model need at 16-bit, and in 4-bit?
A: About 16 GB at 16-bit (two bytes per parameter); 4-bit cuts that to roughly a quarter, about 4–5 GB.

Q: Describe generation in one sentence.
A: The model scores every possible next token, one is chosen, it's appended, and the process repeats.

Q: Gated model downloads fail with an authorization error. Why?
A: You haven't accepted the model's license on its Hugging Face page yet (Llama models are gated).

Q: Name two things an open model you host gives you that a frontier API doesn't.
A: Your data stays on your machine, and you have full control: quantize, fine-tune and deploy anywhere.

=== m4
Q: Name the six questions for narrowing the field of models before benchmarking.
A: Open or closed and the license, size and hardware, context window, price and speed, knowledge cutoff, and reasoning support.

Q: What are public leaderboards good for, and why not more?
A: Making a shortlist. Scores can be gamed or leak into training data, and they rarely match your task.

Q: What makes the Python-to-C++ port a good benchmark?
A: The outcome is objective: it compiles or not, the output matches or not, and the runtime is a number.

Q: A generated port runs 1,000 times faster but prints a different answer. Score?
A: Zero. Correctness comes before speed.

Q: Why did the course run four models on two programs rather than one?
A: Most frontier models do well on the easy one; the harder problem reorders the field.

Q: How should you run code a model wrote?
A: In a container or VM with no network, no access to your files, and a timeout.

Q: What goes in a strict code-generation system prompt?
A: Output only code, identical output to the Python version, and attention to common port bugs such as integer overflow.

=== m5
Q: What is RAG in one sentence?
A: Find the passages most relevant to the question and include them in the prompt, with an instruction to answer from them.

Q: Why do chunks overlap?
A: So a fact that straddles a boundary still lands whole in at least one chunk. The basic version uses 500-character chunks overlapping by 200.

Q: Why must documents and queries use the same embedding model?
A: Similarity only means something between vectors in the same space.

Q: What does MRR measure?
A: How high the first relevant result ranks: the average of 1 / (rank of the first relevant result).

Q: What's the difference between hit rate and Recall@K?
A: Hit rate is the share of tests where some relevant context appeared. Recall@K is relevant chunks in the top K divided by all relevant chunks for that test. They're equal only with one relevant chunk per test.

Q: An answer is wrong. How do you tell whether retrieval or generation failed?
A: Check whether the needed fact was in the retrieved context. If it wasn't, it's retrieval; if it was and the model missed it, it's generation. The judge's written feedback helps.

Q: What does reranking do in the "pro" pipeline?
A: Retrieve generously (20 chunks), have a model order them by relevance, and keep the best 10 for the prompt.

Q: When do you keep LLM chunking, query rewriting or reranking?
A: Only when your evaluation numbers improve. Each adds latency and cost.

Q: Retrieval misses the right chunk. Should you tune the answer prompt?
A: No. No prompt rescues a missing fact; fix chunking, embeddings and reranking first.

=== m6
Q: Why does curation count as a design decision?
A: Every filter changes what the model can learn: too few expensive items and it never predicts high prices; a dominant category biases every estimate.

Q: How do you clean hundreds of thousands of records with an LLM cheaply?
A: A fast, cheap model through a batch API, which processes grouped requests asynchronously at a lower price.

Q: What does the Tester do, and why build it first?
A: It runs any pricing function over a fixed test sample and reports the average absolute error with a chart. One evaluation for every approach is what makes the comparison mean anything.

Q: What's the first baseline, and what does it tell you?
A: Always guess the average price. Anything worse than that is broken.

Q: How does XGBoost differ from a random forest?
A: A random forest averages many trees trained on random slices; XGBoost builds trees one after another, each correcting the previous ones' errors.

Q: Why did zero-shot frontier models beat the trained models in Week 6?
A: The task relies on world knowledge about products, which frontier models absorbed in pre-training.

Q: Does fine-tuning a frontier model automatically help?
A: No. In the reference course, a small frontier model fine-tuned on these products did worse than the same model untuned.

=== m7
Q: Why is full fine-tuning out of reach on one affordable GPU?
A: It needs the weights, their gradients and the optimizer state in memory at once, many times the model's size.

Q: What does LoRA train?
A: Two small matrices beside chosen layers, whose product corrects that layer. The original weights stay frozen; the adapter is megabytes.

Q: What does the Q in QLoRA add?
A: The frozen base weights are stored in 4-bit, while the small adapters train at higher precision, so a single T4-class GPU is enough.

Q: What do rank and alpha control, and what are the rules of thumb?
A: Rank sets the adapter's width (how much it can learn), starting at 8–32. Alpha scales its correction, commonly about twice the rank.

Q: How should each training example be formatted?
A: As a prompt that ends exactly where the answer begins, followed by the price, in the same format you'll use at inference.

Q: Why fine-tune the base Llama 3.2 3B rather than the instruct version?
A: For a narrow task with a fixed output format, a base model doesn't need the chat template or conversational habits. The format you train is the format you get.

Q: What two lessons come from the Week 7 leaderboard?
A: Data volume mattered enormously (lite mid-table, full first), and specialization beats size for a narrow task.

Q: How do you avoid fooling yourself when tuning hyperparameters?
A: Keep the test split separate from the start and tune against a held-out validation set, never the final test set.

=== m8
Q: In the Week 8 system, which agent makes open-ended decisions?
A: Only the planning agent, with exactly three tools (scan, estimate, notify). The rest are focused components with one job each.

Q: What three parts must match for a Modal secret to work?
A: The secret's name (huggingface-secret), the key inside it (HF_TOKEN) and its value (your token).

Q: What does `MIN_CONTAINERS = 1` buy you on Modal, and at what cost?
A: No cold start (around half a minute after the service sleeps), at a continuous cost in credits.

Q: How did the frontier model get from Week 6's error to about $30?
A: RAG with labeled examples: the five most similar products and their known prices go in the prompt.

Q: What does an ensemble mostly do?
A: Smooth out each model's worst misses. Here it took the error from $30.19 to $29.90, a small step.

Q: How do structured outputs differ from asking for JSON in the prompt?
A: You pass a schema (a Pydantic model) as `response_format`, and the API guarantees the reply matches it.

Q: What stops the deal agent from sending the same deal twice?
A: memory.json: the framework passes already-surfaced deals to the planner and records each new one.

Q: Which two legs of the lethal trifecta does the deal agent already have?
A: Untrusted input (public deal feeds) and an outbound channel (notifications). Add a tool that reads private data and the trifecta is complete.

=== m9
Q: Name four things a learning prototype leaves out on purpose.
A: Any four of: an evaluation suite, tracing, failure handling, security, cost control, model-drift handling and real deployment.

Q: What makes a first portfolio project worth showing?
A: It's narrow, from your own work, combines at least three course techniques, and has a measured result against a baseline.

Q: How many cases should a project's evaluation set have, and what rule applies to it?
A: At least 25, kept separate from anything you tune on.

Q: What's the habit that carries over from every week?
A: Define success, measure it, change one thing, measure again.

Q: In production, what replaces "swap the model name when it breaks"?
A: Pinned versions, a re-evaluation whenever a model changes, and a planned fallback.
