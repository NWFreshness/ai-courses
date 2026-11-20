=== setup | Starter AGENTS.md
Every module ends with a <strong>Build it with an agent</strong> kit: a brief to hand your coding agent, a prompt for reviewing the result in a fresh session, and a short list of things to check yourself. The briefs build on each other, so one <code>wayfarer</code> repo grows module by module, the way the reference course's branches do.

The code in each lesson is there to show what good looks like. You'll rarely type it; you'll compare your agent's output against it. Start the repo with the file below. Codex, Cursor and most other agents read <code>AGENTS.md</code> directly; for Claude Code, also add a <code>CLAUDE.md</code> containing the single line <code>@AGENTS.md</code>.
--- brief
# Wayfarer claims platform

A claims agent and platform for Wayfarer, a fictional travel insurer. It is built in stages from the briefs in docs/briefs/.

## Read first
- docs/SPEC.md: what the client wants, in the client's words.
- docs/STATUS.md: what works, what's next, known problems. Update it after every change.
- The brief you've been given, in docs/briefs/.

## How to work
- Given a brief, first write docs/PLAN.md: phases, each with success criteria you can verify yourself (tests, commands and their output, pages checked in a browser), written as checkboxes. Then stop and wait for my approval.
- After approval, build one phase at a time: tests with each change, run the check command, tick the criteria, commit.
- Keep a single check command (for example `make check`) that runs linting, type checks, tests with coverage and end-to-end tests.
- Tests never call a real model. Use a stub model.
- Never lower a threshold, disable a rule or skip a hook to get a green run. If a rule seems wrong, stop and ask.
- Keys live in .env, which is git-ignored. Never print or commit them.
- Never open data/evals/: it is the answer key.
- Never push, deploy or create cloud resources unless the brief says to.

## Stack
Python 3.12 with uv. FastAPI and SQLite (Postgres from Week 2). LangChain and LangGraph for agents, calling models through OpenRouter. React, Vite and TypeScript for the dashboard. pytest, ruff, pyright, Playwright.

=== m0 | A project skeleton and a first agent that browses a tiny help centre
--- brief
# Brief: workshop and first agent

## Goal
Set up the wayfarer repo and a first agent built from first principles: a model, one tool and a loop, with no agent framework.

## Requirements
- A uv project on Python 3.12 with openai and python-dotenv; .env and .gitignore; OPENROUTER_API_KEY read from .env.
- first_agent.py: a dictionary of six to eight help-centre pages that link to each other (paths such as /claims/deadlines), a read_page(path) tool that returns the page text or a helpful message for a missing page, and run_agent(question, max_steps=10) that loops until the model answers or the steps run out, printing each step.
- The model name comes from MODEL_NAME in .env, defaulting to openrouter/free.
- A test that runs the loop with a stub model and checks it stops at max_steps, and that a missing page returns a message rather than raising.

## Out of scope
Any agent framework, any UI.

## Success criteria
- [ ] `uv run first_agent.py "How long do I have to file a claim?"` prints its steps and an answer taken from the pages
- [ ] With max_steps=2 on a question needing three pages, it stops and says it ran out of steps
- [ ] `uv run pytest` passes without calling a real model
- [ ] .env is not tracked by git
--- review
You're reviewing work another agent did, with a fresh context. Read AGENTS.md and docs/briefs/m0.md, then the code.
1. Run each success criterion yourself and report pass or fail with the output.
2. Check specifically: is there a hard step limit that can't be bypassed; does every tool failure come back to the model as text; is the key only ever read from the environment; do the tests avoid real model calls?
3. List up to five concrete problems, most serious first, with file and line. Don't fix anything.
--- check
- You can point to the three parts in the code: the model call, the tool, the loop
- Running it twice can take different paths, and both stay within the step limit
- `git status` doesn't show .env, and the key isn't in any file you could commit

=== m1 | Structured decisions on 25 claims, and the same job as an agent
--- brief
# Brief: decide claims with structured output

## Goal
Decide Wayfarer's first 25 claims with one structured model call each, score them against an answer key, then do the same with an agent and compare.

## Context
Wayfarer has three plans (Saver, Standard, Elite). A handler approves with a payout, declines, or refers. Payouts over $1,000 need a handler's sign-off before payment.

## Requirements
- data/: 25 invented claims, the customers' policies, a short policy wording (one page per plan: limits, deductible, exclusions), and data/evals/decisions.json with the handlers' decision, payout and reason per claim. Mix approvals, declines and referrals, and include five claims that depend on rules not in the wording.
- decide.py: a ClaimDecision Pydantic model with rationale first, then decision (approve, decline or refer) and payout; one call per claim with the wording, the policy and the claim.
- agent_decide.py: the same job with a LangChain create_agent and two tools, get_policy(policy_id) and record_decision(...).
- score.py: decision accuracy, accuracy (decision plus payout within $1), cost and seconds per claim, for each approach and for an approve-everything baseline. Reads the answer key; the deciders must not.
- results.md: a table for two or three models.

## Success criteria
- [ ] `uv run score.py` prints a table with every approach and the baseline
- [ ] Nothing in decide.py or agent_decide.py reads data/evals/
- [ ] Results show cost and time as well as accuracy
- [ ] results.md states which approach you'd recommend, and why
--- review
You're reviewing another agent's work with a fresh context. Read AGENTS.md and docs/briefs/m1.md.
1. Run the success criteria and report pass or fail.
2. Search the code for any path from the deciders to data/evals/, including through shared helpers.
3. Check the scoring: is a payout within $1 counted as right; are referrals compared like any other decision; is the approve-everything baseline computed on the same claims?
4. Check that the rationale field comes before decision and payout in the schema.
Report problems most serious first. Don't fix anything.
--- check
- Approve-everything scores higher than you'd guess, and you know why
- The agent costs more per claim than the single call; you can say whether it's better
- You've read five rationales and they cite a section of the wording

=== m2 | The pilot: API, dashboard and agent, built from a spec
--- brief
# Brief: the pilot

## Goal
Build the claims pilot from docs/SPEC.md: a backend that owns the records, a dashboard for handlers, and an agent that works the queue through the API.

## Context
Write docs/SPEC.md first, in the head of claims' words: work the queue straight through, as accurately as the handlers; show the queue, each claim with the agent's reasons, and the agent's steps live; a payout over $1,000 waits for a handler's sign-off and the system must block payment until then, whatever the agent does. The agent never sees data/evals/.

## Requirements
- backend/: FastAPI and SQLite seeded from data/. Every operation has an operation_id and a one-line docstring. Paying is its own operation taking the amount, and it refuses over $1,000 without a sign-off.
- agent/: create_agent whose tools call the API (get_claim, get_policy, record_decision, pay_claim). It reaches claims only through the API.
- dashboard/: React. The queue with each claim's status (waiting, in progress, waiting for sign-off, decided), a claim page with the decision and reasons, the agent's steps as it works, and a Sign off button.
- Checks: ruff, pyright, pytest at 80% coverage, ESLint, strict TypeScript, vitest, Playwright, all behind one command and a pre-commit hook.
- Commands: one to start everything, one to run the agent on the queue, one to reset the queue.

## Success criteria
- [ ] The check command passes
- [ ] A test proves pay_claim refuses $1,200 without a sign-off and accepts it after one
- [ ] Running the agent decides every waiting claim; large approvals show as waiting for sign-off
- [ ] In a browser, signing off a claim pays it and updates its status
--- review
You're reviewing the pilot with a fresh context, as a senior engineer would. Read AGENTS.md, docs/SPEC.md and docs/briefs/m2.md.
1. Run the check command and every success criterion; report pass or fail.
2. Try to make the agent pay over $1,000 without a sign-off by calling the API directly. Report what happens.
3. Look for: duplicated logic; business rules only in prompts; prompts that list every step instead of stating the goal; tests that assert nothing meaningful; any route from the agent to data/evals/.
4. List up to eight problems, most serious first, with file and line. Don't fix anything.
--- check
- You can explain every folder in the repo without opening the plan
- You tried paying a large claim yourself with curl and it was refused
- The agent's prompt states a goal and rules, not a script of tool calls

=== m3 | An open-model bake-off with a recommendation
--- brief
# Brief: open-model comparison

## Goal
Compare open-weight and local models with Module 1's frontier models on the claims that don't need the claims manual, and recommend one to Wayfarer.

## Requirements
- bakeoff.py: run each model on the same claims with a short prompt. Models: four to six open-weight models through OpenRouter (pin providers, no fallbacks, record the provider used) and, if an Ollama server is running, one or two local models.
- Record accuracy, cost per claim (from token usage, with cached tokens priced separately) and seconds per claim, three runs each.
- Plot accuracy against cost per claim, mark the Pareto front, save it as bakeoff.png.
- recommendation.md: one paragraph for the client, covering accuracy, cost per month at 5,000 claims, privacy and where the model would run.
- The model list lives in one config file, so adding a model is one line.

## Success criteria
- [ ] `uv run bakeoff.py` produces a results CSV and bakeoff.png
- [ ] Each result row records the provider that actually served it
- [ ] The approve-everything baseline is on the chart
- [ ] recommendation.md gives a monthly cost figure and the reasoning behind it
--- review
Fresh-context review. Read docs/briefs/m3.md, run the bake-off on two models only, and check:
1. Are providers pinned with fallbacks off, so each model's results come from one provider?
2. Is cost computed from reported token usage, including cached and reasoning tokens where reported?
3. Is the Pareto front computed correctly (no model on it is beaten on both accuracy and cost)?
4. Does the recommendation follow from the numbers?
Report problems; don't fix them.
--- check
- You can say why the cheapest model on the front isn't automatically the recommendation
- Three runs of the same model differ, and you know by how much
- The monthly cost figure is something you'd say out loud to a client

=== m4 | Wayfarer's harness: a queue agent, fresh context per claim, searchable documents
--- brief
# Brief: the harness

## Goal
Give the claim agent a proper harness: a queue agent that coordinates, a fresh context for each claim, searchable documents, and clear failure rules.

## Requirements
- A claims manual in docs or data (about ten sections: the three decisions, payment authority, repeat claims, documents required, and so on).
- Tools for the claim agent: search_documents(query) returning matching section titles with a line of context, and read_section(document, section).
- work_claim(claim_id): decides one claim in a fresh context and returns a one-line summary.
- A queue agent with a to-do list (TodoListMiddleware) shown on the dashboard, which works waiting claims with work_claim.
- A claim that fails goes back in the queue once; a second failure sets status left_for_handler. Keep referred, waiting_for_sign_off and left_for_handler as distinct statuses everywhere.
- The claim agent's prompt states the goal and rules, not a list of steps.
- A --cap N option to work only N claims.

## Success criteria
- [ ] `--cap 5` works five claims, and the queue agent's context never includes a claim's full details
- [ ] A test makes the claim agent raise twice and checks the claim ends as left_for_handler
- [ ] The dashboard shows the to-do list updating during a run
- [ ] At least one decision cites a claims manual section found by search
--- review
Fresh-context review of the harness. Read docs/briefs/m4.md.
1. Run the success criteria.
2. Inspect the queue agent's messages after a 5-claim run: does any claim detail leak in beyond one line per claim?
3. Check the three statuses are distinct in the database, the API and the dashboard, and that tests cover each.
4. Read the claim agent's prompt: flag any step-by-step instructions that should be a goal or a rule.
Report problems most serious first; don't fix them.
--- check
- You've seen a claim agent use search_documents and read only one section
- You can find where a second failure becomes left_for_handler
- The queue agent's context after 20 claims is still small

=== m5 | Evaluations with a cost of mistakes, tracing, and a payout tool
--- brief
# Brief: evals, observability and a payout tool

## Goal
Measure the claim agent the way the business would, trace its runs, and move payout arithmetic into code.

## Requirements
- 25 harder claims with several items, per-item limits, a deductible, and payments by other insurers, with the handlers' answers in data/evals/harder/.
- evals.py: decision accuracy, accuracy (payout within $1), a 3x3 confusion matrix, precision and recall for approve, Cohen's kappa, and cost of mistakes ($1,500 per wrongful decline, the payout for a wrongful approval, $50 per needless referral, the difference for a wrong amount). Constants in one place.
- Langfuse tracing on the agent, the harder claims as a Langfuse dataset, and an experiment runner with accuracy and cost-of-mistakes scores.
- calculate_payout(lines, per_item_limit, benefit_limit, deductible, paid_by_other_insurer) in Python with unit tests, given to the agent as a tool.
- Compare the agent with and without the tool, three runs each.

## Success criteria
- [ ] Unit tests for calculate_payout cover the limit, the deductible, other insurance and a zero floor
- [ ] Approve-everything scores a kappa of 0 in a test
- [ ] Two Langfuse experiments, with and without the tool, each run three times
- [ ] results.md reports the change in cost of mistakes with the spread across runs
--- review
Fresh-context review. Read docs/briefs/m5.md and check:
1. Is kappa computed against chance agreement from both raters' proportions?
2. Does the confusion matrix count decisions only, and is that stated where it's shown?
3. Does calculate_payout match the wording's rules on a hand-worked example you compute yourself?
4. Are the comparisons based on three runs per version, with spread reported, not one?
Report problems; don't fix them.
--- check
- You can read the confusion matrix and name the costliest cell
- You worked one payout by hand and it matched the tool
- The improvement is bigger than the run-to-run spread

=== m6 | A long-term memory of outside facts over MCP
--- brief
# Brief: agentic RAG with a memory server

## Goal
Give the claim agent a searchable memory of outside facts, through the Qdrant MCP server, and measure what it adds.

## Requirements
- 25 claims that each need one outside fact, and data/knowledge.json with about 30 facts (named storm dates, product descriptions, strikes, closures), each tagged with the claim it decides. Include look-alike facts.
- A librarian agent that stores the facts with qdrant-store, one per call.
- The claim agent gets qdrant-find only, never qdrant-store.
- A found_fact score: whether the needed fact appeared in any of the agent's search results.
- A Langfuse comparison with and without memory.
- Pin the server's Python (uvx --python 3.12) and keep the store in memory/qdrant/, git-ignored.

## Success criteria
- [ ] The librarian stores every fact and a direct qdrant-find returns them
- [ ] A test confirms the claim agent has no write tool for memory
- [ ] Results report found_fact and accuracy, with and without memory
- [ ] results.md says which claims still fail and why
--- review
Fresh-context review. Read docs/briefs/m6.md and check:
1. Can any code path let the claim agent write to memory?
2. Is found_fact computed from the search results, not from the decision?
3. Do failing claims fail at retrieval or at reasoning? Sample three and say which.
Report problems; don't fix them.
--- check
- You've seen the agent rephrase a search after a miss
- You can explain why the claim agent mustn't be able to write facts
- found_fact and accuracy don't move together on every claim, and you know why

=== m7 | A durable claim graph with sign-off, that can never pay twice
--- brief
# Brief: durable state and human in the loop

## Goal
Rebuild the claim agent as a LangGraph graph with checkpoints in Postgres, a pause for sign-off, and a payment that happens exactly once.

## Requirements
- Move the records to Supabase Postgres (DATABASE_URL in .env; session pooler).
- A graph with nodes agent, tools, decide, approval and pay; a thread per claim; PostgresSaver; durability="sync".
- approval calls interrupt() for payouts over $1,000; the dashboard's Sign off resumes the thread with Command(resume={"handler": ...}).
- pay is its own node after the pause and is idempotent: the payments table's primary key is the claim id and inserts do nothing on conflict.
- Bring in Module 5's payout tool and tracing.
- A script that pauses a claim, exits, and resumes it from a new process.

## Success criteria
- [ ] Pausing, restarting the program and signing off pays the claim once
- [ ] A test calls pay twice for one claim and finds one payment row
- [ ] A test kills the run inside pay before its checkpoint, resumes, and finds one payment row
- [ ] No side effect happens before an interrupt() anywhere in the graph
--- review
Fresh-context review. Read docs/briefs/m7.md.
1. Run the success criteria.
2. Read every node: list any side effect (payment, email, external call) that could run twice on resume or retry, and whether it's guarded.
3. Check checkpoints are written synchronously for the claim graph.
4. Check the sign-off records who approved and when.
Report problems most serious first; don't fix them.
--- check
- You restarted the process with a claim paused and it carried on
- You can explain why code before interrupt() runs again on resume
- The payments table has a primary key on the claim id

=== m8 | A dispatcher for parallel claim agents, and a scoreboard
--- brief
# Brief: the swarm

## Goal
Replace the queue agent with a dispatcher that works claims in parallel, and record enough per claim to compare runs.

## Requirements
- A LangGraph dispatcher with no model: list waiting claims, Send one work_claim per claim, collect results with an operator.add reducer, cap with max_concurrency.
- RetryPolicy on work_claim for rate-limit errors, with backoff.
- Start a dispatch from the dashboard with N agents (default 3).
- Record each claim's model cost and active time (excluding time waiting for sign-off).
- Evaluation runs: dispatch over a copy of the evaluation or held-out claims and write a scoreboard row (accuracy, cost of mistakes, cost and seconds per claim, straight-through rate). A Scoreboard page lists them.

## Success criteria
- [ ] With a one-second stub worker, caps of 1, 5 and 25 take about 25, 5 and 1 seconds
- [ ] A simulated 429 is retried and the claim still completes once
- [ ] A claim paused for sign-off doesn't hold up the others
- [ ] Two evaluation runs appear on the Scoreboard page
--- review
Fresh-context review. Read docs/briefs/m8.md.
1. Run the stub timings and the retry test.
2. Check connection usage: how many database connections can N agents open at once, and what's the pool limit?
3. Confirm a retried worker can't pay a claim twice.
4. Check cost and active time are recorded per claim and summed correctly on the scoreboard.
Report problems; don't fix them.
--- check
- You found the concurrency where adding agents stops helping
- Retries happen, and the payments table still has one row per claim
- The Scoreboard compares two runs side by side

=== m9 | Versioned configuration, a grounded judge and an improver you approve
--- brief
# Brief: self-improvement

## Goal
Let an improver agent propose changes to the claim agent, approved by the senior handler and kept only if held-out results improve beyond the noise.

## Requirements
- The claim agent's prompt, model and reasoning effort in versioned configuration rows, with diffs between versions and a Settings page.
- A judge that grades each rationale A, B, C or F against the handler's reason with a fixed rubric, returning structured output; calibrated on five claims with known grades.
- Noise: run the current version twice on the held-out claims and store the spread per score.
- An improver (create_agent) with tools read_results, propose_change, run_evaluation and propose_recipe; HumanInTheLoopMiddleware pauses both proposals for approval.
- Keep or roll back from held-out scores: objectives, noise thresholds, tolerances and a budget, all in one config.
- Handler sign-in with Supabase Auth (sign-ups off); only the senior handler can approve changes and large payouts.

## Success criteria
- [ ] The judge agrees with your grades on at least four of the five calibration claims
- [ ] A proposed change waits for approval and nothing changes until it's given
- [ ] A change smaller than the noise is rolled back, with the reason recorded
- [ ] Signed in as a junior handler, approval buttons are absent and the API refuses
--- review
Fresh-context review. Read docs/briefs/m9.md.
1. Check the improver can't read the held-out claims, directly or through any tool.
2. Check keep-or-roll-back uses the held-out set, the stored noise and the tolerances.
3. Try approving a change through the API as a non-senior handler.
4. Read the judge prompt: is it grounded in the handler's reason with fixed grades?
Report problems; don't fix them.
--- check
- You approved one change and rejected one, and both are in the history
- You can show the noise numbers the rule used
- There's a separate test set nobody has tuned on

=== m10 | A discovery note, an autonomy table and a safe cloud account
--- brief
# Brief: discovery pack and account checks

## Goal
Produce the engagement documents for Wayfarer, and a script that confirms the cloud account is safe to use.

## Requirements
- docs/DISCOVERY.md, one page: the problem, who has it, today's baseline (volume, time per claim, error rate), the target, how it will be measured, risks, and the use case type (automation, acceleration or differentiation).
- docs/AUTONOMY.md: every action the agent can take, its risk, its autonomy level (automatic, person approves, people only) and why.
- docs/ADR-001.md: one architecture decision record (for example a managed agent runtime versus your own containers).
- check_aws.py with boto3: prints the account and the caller's ARN, fails if the caller is the root user, fails if no budget exists, and lists budgets with their limits.
- Do not create or change any AWS resources. I set up the account, budget and IAM user myself.

## Success criteria
- [ ] Each document fits on one page and names an owner for each decision
- [ ] AUTONOMY.md covers every tool the agent has today
- [ ] check_aws.py exits non-zero when run with no budget, and prints the IAM user's ARN when run correctly
--- review
Fresh-context review. Read docs/briefs/m10.md and the three documents.
1. Does DISCOVERY.md state a measurable baseline and target, or only goals?
2. Does AUTONOMY.md match the tools in the code? List any tool missing from it.
3. Does check_aws.py make only read calls? List every AWS API it uses.
Report problems; don't fix them.
--- check
- Someone at Wayfarer could disagree with a number in DISCOVERY.md, because there are numbers in it
- The budget alert excludes credits and refunds
- You never used the root user for the script

=== m11 | Injection screening, an API key, and a gateway with a payment policy
--- brief
# Brief: security and the gateway

## Goal
Defend the claim agent against prompt injection, protect its API with a key, deploy the app to AWS Lambda, and enforce the payment limit at a gateway.

## Requirements
- Five attack claims (obvious, reworded, in a different language, hidden in an item description, addressed to "the reviewer") and the 25 ordinary claims for false alarms.
- A keyword check and a model check (structured output: reason, instructions_found) as the first node of the claim graph; a flagged claim is referred with the reason recorded.
- An API key: WAYFARER_API_KEY in .env, sent as X-API-Key, checked by the backend on every agent route.
- An OpenAPI document of the agent's operations; the FastAPI app wrapped with Mangum.
- Deploy only after I confirm: the app to Lambda with a Function URL; an AgentCore Gateway with the app as target and the key in AgentCore Identity; a Cedar policy permitting the tools and forbidding pay_claim over $1,000, first in log-only mode, then enforced. Tag everything project=wayfarer.

## Success criteria
- [ ] A report of each check's catches on the five attacks and false alarms on the 25 ordinary claims
- [ ] A request without the key is refused on every agent route
- [ ] Through the gateway, pay_claim for $1,500 is refused and $600 succeeds
- [ ] A teardown script removes everything tagged project=wayfarer except what the next module needs
--- review
Fresh-context review. Read docs/briefs/m11.md.
1. Try two new injection wordings against the model check and report the results.
2. Search the frontend and its build output for the API key.
3. Read the Cedar policies: does a forbid cover every route that moves money?
4. List every AWS resource created and confirm each is tagged and in the teardown.
Report problems; don't fix them.
--- check
- You saw at least one attack get past the keyword check and be stopped later
- The key isn't in any file the browser downloads
- You know what's still running on AWS right now, and what it costs

=== m12 | A context server with provenance, and per-customer memory
--- brief
# Brief: the context layer

## Goal
Serve Wayfarer's business knowledge to agents as an MCP server with provenance, record the context behind every decision, and add per-customer memory.

## Requirements
- context/: plans, claim rules, glossary, data dictionary, reference data, wording and manual, each with a source header (system, owner, reviewed date).
- context_server.py: an MCP server (MCPServer on SDK 2.x, FastMCP on 1.x) with get_rule, get_plan, search_documents and read_section; every answer includes its source header. Runs locally and, after I confirm, as a second Lambda behind IAM auth added to the gateway.
- Every decision stores its full record: lookups made, sections relied on, memory used. The claim page shows it as "Context used".
- AgentCore Memory with a semantic strategy (/customers/{actorId}/facts/) and a summary strategy (/customers/{actorId}/claims/{sessionId}/). A search_memory tool whose customer id comes from the claim in code, never from the model.
- Flag any context file past its review date in the decision record.

## Success criteria
- [ ] Every lookup in a decision record names its owner and review date
- [ ] A test shows search_memory can't return another customer's records
- [ ] Two claims from one customer: the second can find a memory from the first (allowing for extraction delay)
- [ ] A stale file appears as a warning on the claim page
--- review
Fresh-context review. Read docs/briefs/m12.md.
1. Check every tool answer carries provenance.
2. Trace where search_memory's customer id comes from; flag it if the model can influence it.
3. Check the decision record matches what the trace shows the agent actually looked up.
Report problems; don't fix them.
--- check
- You can trace one fact in a decision to its owner
- You tried to make the agent search another customer's memory and it couldn't
- The Context used panel matches the trace for one claim you picked

=== m13 | The agent on a managed runtime, with sign-off, send-back and a run lock
--- brief
# Brief: production deployment

## Goal
Run the agent as an AgentCore app that works the same on my laptop and on AgentCore Runtime, with sign-off and send-back, and one dispatch at a time.

## Requirements
- agent/entrypoint.py: a BedrockAgentCoreApp with actions dispatch, sign_off and send_back. dispatch registers its background work so the session stays alive, and returns immediately.
- Secrets (OpenRouter key, database URL) from AgentCore Identity when deployed, from a local env file under agentcore dev.
- The approval pause with two buttons: Sign off (the app pays, then a short session lets the agent finish the claim's graph) and Send back with a note (the agent resumes in a new session and decides again).
- A run lock row in Postgres with a heartbeat the agent refreshes; a start is refused while the heartbeat is fresh and allowed once it's over five minutes old.
- Pin the CLI version. Deploy only after I confirm. Document the teardown, including the CLI's bootstrap stack.

## Success criteria
- [ ] `agentcore dev` and the deployed runtime give the same result for the same claim
- [ ] A claim sent back resumes in a different session id from its Postgres checkpoint
- [ ] Killing the agent mid-dispatch, then starting again, is refused, then allowed after the heartbeat goes stale
- [ ] TEARDOWN.md lists every resource and the command that removes it
--- review
Fresh-context review. Read docs/briefs/m13.md.
1. Check no secret is in agentcore.json, the code or the repo.
2. Check the lock can't be taken twice by two simultaneous starts (look at the SQL).
3. Check send-back can't pay before the agent decides again.
4. Compare TEARDOWN.md with what's actually deployed.
Report problems; don't fix them.
--- check
- You saw two different session ids for one claim
- You know what the CLI's first deploy left in your account
- A swarm run from the deployed dashboard finished

=== m14 | A copilot for handlers, a success-criteria check, and the teardown
--- brief
# Brief: the copilot and the handover

## Goal
Add a copilot for handlers in the dashboard's sidebar, a coded check of the success criteria, and a complete teardown with proof.

## Requirements
- A hand-written LangGraph loop with tools for claims, customers, starting a dispatch and the context layer.
- It acts with the signed-in handler's credentials, never the claim agent's API key.
- Any payment goes through a confirmation card (an interrupt) showing claim, amount and reason.
- Conversations are threads with Postgres checkpoints; memory has a namespace per handler.
- check_success_criteria computes accuracy, straight-through rate (every claim not referred, including approvals waiting for sign-off), payouts over the limit paid without sign-off, and cost per claim, against targets in one config. The model explains the numbers; it never estimates them.
- Its own runtime, deployed only after I confirm.
- teardown.py removes everything tagged project=wayfarer, then lists anything remaining by name and with a resource search, and prints the current budget figures.

## Success criteria
- [ ] Asking "are we meeting our targets?" calls check_success_criteria and quotes its numbers
- [ ] A payment through the copilot shows the card and pays nothing until confirmed
- [ ] The copilot can't do anything the signed-in handler can't
- [ ] After teardown.py, the resource search finds nothing tagged project=wayfarer
--- review
Fresh-context review. Read docs/briefs/m14.md.
1. Try to make the copilot pay without the card, and to act as a different handler.
2. Check every number in its answers comes from a tool result.
3. Run teardown.py in dry-run mode and compare its list with what's deployed.
Report problems; don't fix them.
--- check
- You held the handover conversation as Rosa from start to finish
- The success-criteria answer matched the scoreboard
- Your AWS budget shows no new spend a day after teardown
