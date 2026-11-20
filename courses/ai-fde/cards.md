# Recall cards for the review deck. One "=== <module id>" per module, then Q:/A: pairs.
# Backticks become code. Editing a question resets that card's schedule.

=== m0
Q: Name the three disciplines a forward deployed engineer combines.
A: AI engineering, AI architecture and forward deployment.

Q: Besides skills, what two kinds of experience make an FDE?
A: Solving a real business problem, measured in the business's terms, and delivering it to a customer who keeps using it after you leave.

Q: What are the risks of OpenRouter's `openrouter/free` models?
A: A small daily request limit, and their providers may train on what you send, so never send anything confidential.

Q: What three habits does even the 30-line first agent have?
A: A tool that fails gracefully with a helpful message, a hard step limit, and a system prompt that says where knowledge may come from.

Q: Where does the term "forward deployed engineer" come from?
A: Palantir, which embedded engineers with its customers in the 2000s rather than shipping software and leaving.

=== m1
Q: Which token type costs the most, and which costs the least?
A: Output tokens cost the most; cached input (an exactly repeated prompt start) costs the least.

Q: How should you order a prompt so repeated calls hit the cache?
A: The long, unchanging part (the policy wording) first, and the claim last.

Q: What makes a model worth shortlisting from a leaderboard?
A: Being on the Pareto front: no other model is both better and cheaper. Then test the shortlist on the client's actual task.

Q: Turn "as accurate as our handlers" into Wayfarer's measurable targets.
A: Accuracy (right decision, payout within $1 of the handler's), the straight-through rate, and every payout over $1,000 waiting for a handler's sign-off.

Q: Why does `rationale` come first in the ClaimDecision schema?
A: The model writes fields in order, so it explains itself before committing to a decision and an amount, which tends to improve both.

Q: Single structured call or agent for deciding a claim from known inputs?
A: The single call. The agent took longer, cost more and did no better, because this is a fixed workflow.

Q: Some claims are wrong whichever approach you use. What should you check first?
A: Whether the claim needs a rule that isn't in the context, such as one from the claims manual.

=== m2
Q: Name the three kinds of coding agent.
A: AI-first editors (Cursor, Windsurf), editor extensions (Copilot, Cline) and terminal agents (Claude Code, Codex, OpenCode).

Q: What are the five habits of being the boss of a coding agent?
A: Own what ships, keep instructions as a short map, use a fresh context per task, plan and check before building, and commit often.

Q: What's the one rule about quality gates that matters most?
A: The agent may never weaken a check to make it pass. If a rule looks wrong, it stops and asks.

Q: What does the Playwright MCP server give a coding agent?
A: A browser to open the app, click through it and check what it built, instead of guessing.

Q: Where does the $1,000 sign-off rule live in the pilot?
A: In the backend, behind its own pay operation, where the model can't talk past it.

Q: The pilot passes every check. Is it reviewed?
A: No. Passing checks can hide duplication, step-by-step prompts and bad names. Read the code, ideally with a review by a fresh agent too.

=== m3
Q: What's the difference between open-weight and open-source models?
A: Open-weight gives you the trained weights under a license; open-source adds the training code and data, so the model can be reproduced.

Q: What do open weights buy you, and what don't they?
A: Privacy and control (data stays in, nobody retires it, you can fine-tune). They're not automatically cheaper: a rented GPU sits idle between requests.

Q: Decode `Qwen3-30B-A3B-Instruct-Q4_K_M.gguf`.
A: Qwen 3, 30B parameters in total, about 3B active per token (mixture of experts), instruction-tuned, about 4-bit K_M quantization, GGUF format.

Q: What does a mixture of experts save, and what doesn't it?
A: It saves compute per token, so it runs like a small model, but it still needs memory for all its weights.

Q: What sets how fast a model generates?
A: Memory bandwidth: tokens per second is at most bandwidth divided by the size of the active weights.

Q: Why pin providers on OpenRouter?
A: Providers of the same model differ in precision, features and price, so pinning gives consistent results.

Q: What baseline should you score before any model?
A: "Approve every claim." On a queue where most claims deserve approval, it can get most decisions right.

=== m4
Q: Name the seven parts of a harness.
A: Context, workflow, state, subagents, permissions, observability and self-improvement.

Q: Why does Wayfarer give each claim a fresh context?
A: The queue agent sees only a one-line result, so its context stays small however long the queue, and one strange claim can't confuse the next.

Q: Why give the claim agent `search_documents` and `read_section` instead of the whole manual?
A: Progressive disclosure: it pays for the text it needs, when it needs it.

Q: Distinguish "referred", "waiting for sign-off" and "left for a handler".
A: Referred: the agent judged a person is needed. Waiting for sign-off: it approved a payout over $1,000. Left for a handler: it failed twice to finish.

Q: Why keep those three outcomes apart?
A: Mixing them makes the straight-through rate meaningless and hides failures as if they were judgments.

Q: Goals or scripts: how should an agent's prompt be written?
A: State the goal, the rules that must hold and what a good result looks like, and let the model choose its steps. Step-by-step scripts make it brittle.

=== m5
Q: Name the three architecture traps.
A: The "agent for X", human-shaped teams of agents, and output that's plausible but not accurate.

Q: Name four good reasons to add a second agent.
A: Any four of: to isolate context, for an independent check, to use a different model for a step, for parallel work, or to ring-fence permissions.

Q: Why is "approve everything" a useful score to compare against, and what's its kappa?
A: It can agree with handlers most of the time when most claims deserve approval, yet its Cohen's kappa is zero: no skill at all.

Q: Why do the mistakes in a claims confusion matrix need different costs?
A: They hurt differently: a wrongful decline lets down a customer who was owed money, a wrongful approval pays money that wasn't owed, and a needless referral only costs a handler's time.

Q: What should the agent decide, and what should code decide, in a payout?
A: The agent decides what's covered; a tested Python `calculate_payout` tool decides how much.

Q: Why run each experiment at least three times?
A: A run of 25 claims is noisy, and one good run proves little.

Q: In Langfuse, what are a dataset, an experiment and a score?
A: A dataset holds inputs with expected outputs; an experiment runs one version over it; scores attach results to each item so experiments compare side by side.

=== m6
Q: How does agentic RAG differ from classic RAG?
A: Classic RAG retrieves once with the user's words. Agentic RAG makes retrieval a tool: the agent writes its own queries, searches as often as needed and decides when it knows enough.

Q: When do you choose RAG, agentic RAG or fine-tuning?
A: RAG when knowledge changes or must be cited; agentic RAG when the right question isn't obvious from the input; fine-tuning for a new skill or format, not new facts.

Q: What does the "found fact" score measure?
A: Whether, across all the agent's searches, the fact the claim needs came back at all.

Q: Why does the claim agent get `qdrant-find` but not `qdrant-store`?
A: So a strange claim can't plant a false "fact" for later claims to find.

Q: When does MCP earn its place over a plain function?
A: When a tool is shared by several agents, teams or apps, or maintained by someone else.

Q: What's the difference between short-term and long-term memory?
A: Short-term is the run in progress (messages, tool results, to-do list); long-term outlives the run and is designed deliberately.

=== m7
Q: How does LangGraph make a claim run durable?
A: It checkpoints the whole state after every step under a thread ID. One thread per claim, checkpoints in Postgres, and any process can pick it up.

Q: What does `durability="sync"` do, and when do you want it?
A: It writes each checkpoint before the next step starts, so a crash can't lose a step that happened. Slower, and right for anything involving money.

Q: How do you pause for a person and carry on later?
A: `interrupt()` pauses the graph; `Command(resume=...)` resumes it from any process, even after a restart.

Q: Why can a payment placed before `interrupt()` happen twice?
A: On resume, the paused node re-runs from its start; after a crash, the running node re-runs too.

Q: Name the three defenses against paying twice.
A: Put each side effect in its own node after the pause, make it idempotent (claim ID as the payment's primary key), and remember rewinding a checkpoint doesn't rewind the world.

Q: Name the three design questions for the human's step.
A: When to ask (only where a person adds value), what to show (everything on one screen), and what to record (who, when, what changed).

=== m8
Q: What's the difference between a team, a swarm and a fleet?
A: A team is a few agents on one task; a swarm is many agents on independent pieces; a fleet is every agent a business runs.

Q: Why should a swarm's coordinator be code, not a model?
A: For independent work a plain dispatcher is cheaper, faster and more predictable than an LLM deciding who works next.

Q: In the LangGraph dispatcher, what do `Send`, `operator.add` and `max_concurrency` do?
A: `Send` starts one worker per claim, the `operator.add` reducer collects their results, and `max_concurrency` caps how many run at once.

Q: Name four things that limit how fast a swarm really goes.
A: Provider rate limits (429s), shared resources such as database connection pools, the slowest claim, and retries.

Q: Why can 25 agents be barely faster than 10?
A: They queue for a small pool of database connections (about 15 on small Supabase tiers).

Q: What makes parallel retries safe?
A: Each claim has its own durable thread, and the payment step is idempotent.

Q: Does a claim waiting for sign-off block the swarm?
A: No. Its thread pauses, its worker finishes, and the slot goes to the next claim.

=== m9
Q: How do you ground a model judge?
A: Give it the expert's answer to compare against, a rubric with a small set of grades, and ask for a grade, not an essay. Then calibrate it on known cases.

Q: What is noise, and why measure it first?
A: How much a score varies between runs of the same version. Any "improvement" smaller than it means nothing.

Q: Define objectives, noise thresholds and tolerances.
A: Objectives are floors a version must meet; thresholds are how much a score must improve to count; tolerances are how much another score may fall before rejection.

Q: What should the improver try first?
A: Cheap levers, such as a different model or reasoning effort, before adding rules to the prompt.

Q: Why does the keep-or-roll-back decision use held-out data?
A: The improver sees the evaluation set's mistakes and can write rules that fix exactly those claims.

Q: Why do you need a third test set?
A: Held-out scores choose which versions survive, so they're no longer unbiased. An untouched test set gives the final number for the client.

Q: On 25 claims, is 84% better than 80%?
A: Not necessarily. One claim is four points, so treat small differences as ties.

=== m10
Q: Name the five phases of the agent development lifecycle.
A: Discovery, R&D, development, implementation and maintenance.

Q: What four threads run through every phase?
A: Clear ownership, governance with tollgates, evaluations, and change management.

Q: Name the three kinds of use case in discovery.
A: Automation (less effort on an existing task), acceleration (people work faster) and differentiation (something new).

Q: What does a discovery note contain?
A: On one page: the problem, who has it, the baseline today, the target, how you'll measure it, and the risks.

Q: Why is "how autonomous is the agent?" the wrong question?
A: Autonomy is a risk decision per action, from fully automatic through human approval to people only.

Q: What must the client be able to do at handover?
A: Run, monitor, change and switch off the system without you.

Q: Why exclude credits and refunds from an AWS budget?
A: Otherwise it shows zero spend and never alerts. AWS has no hard spending cap.

=== m11
Q: Name the three kinds of agent risk.
A: What it can do where it runs (files, network, credentials), what it can do through its APIs, and prompt injection.

Q: Keyword check versus model check for injection: trade-offs?
A: Keywords catch the obvious attempt and miss rewordings. A model check reads for intent but costs a call and raises false alarms. Measure catches and false alarms for both.

Q: Does a key on the API make a Lambda Function URL private?
A: No. A Function URL is public; the key only protects the routes that check it.

Q: What three things does AgentCore Gateway do?
A: Turns each OpenAPI operation into an MCP tool, adds the target's credentials so the agent never holds the key, and checks every call against Cedar policies.

Q: In Cedar, which wins: permit or forbid?
A: Forbid always wins, and with a policy engine attached a call is refused unless something permits it.

Q: Where does the $1,000 rule end up, ranked by how much you rely on it?
A: The backend, the gateway, then the prompt.

Q: Where must the agent's API key never go?
A: In a frontend setting, where anyone with a browser can read it.

=== m12
Q: Name the four parts of an enterprise context layer.
A: Meaning, practice, permission and provenance.

Q: Where does each kind of data live?
A: Security rules in the gateway, business knowledge in the context layer, the agent's notes in memory, and records in the database behind the app's API.

Q: What header does every file in Wayfarer's context layer carry?
A: Its source system, owner and review date (provenance).

Q: What does "Context used" on a claim page show?
A: The lookups made, the sections relied on and the memory used for that decision.

Q: Who chooses the customer ID in the memory search tool?
A: Your code, from the claim being worked, never the model. That keeps one customer's history out of another's decision.

Q: Why might a memory written by one claim not show up for the next?
A: Extraction runs in the background and is eventually consistent, usually within a couple of minutes.

=== m13
Q: Where do Wayfarer's secrets live in production?
A: In AgentCore Identity, fetched at run time. Settings go in environment variables, with nothing hard-coded.

Q: Why must a claim sent back days later resume from Postgres?
A: It resumes in a brand-new session; its state lives in checkpoints, not in the session's memory.

Q: How does the run lock avoid getting stuck forever?
A: The agent refreshes a heartbeat while it works. A second start is refused while it's fresh; a stale heartbeat releases the lock.

Q: What happens on "Sign off" versus "Send back with a note"?
A: Sign off: the app pays immediately and the agent finishes the graph. Send back: the agent resumes in a new session with the note and decides again.

Q: The CLI's first deploy creates what lingering cost?
A: A bootstrap stack with a KMS key, at about $1 a month. Delete it when you finish.

=== m14
Q: Whose identity does the copilot act with?
A: The signed-in handler's own credentials, so permissions and the audit trail are theirs. Never the claim agent's key.

Q: How does the copilot answer "are we meeting the targets?"
A: Code computes the numbers and the model explains them. It never estimates them.

Q: How should the straight-through rate be defined, and when?
A: Every claim not referred counts, including approvals waiting for sign-off. Agree the definition in discovery, not at handover.

Q: What does a good handover look like?
A: A working session where the client's expert drives the system, plus the documents to run, monitor, change, approve, rotate keys and switch it off.

Q: Name the three ways to prove a teardown worked.
A: List the project's resources by name, search the region with a resource explorer, and watch the budget over the next day or two.
