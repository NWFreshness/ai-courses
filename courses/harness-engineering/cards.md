# Recall cards for the review deck. One "=== <module id>" per module, then Q:/A: pairs.
# Backticks become code. Editing a question resets that card's schedule.

=== m1
Q: Complete the definition: an agent is a model plus ___, and that is ___.
A: A harness, and the harness is everything that isn't the model.

Q: Name the four jobs a harness does.
A: Inform, constrain, verify and correct.

Q: How do prompt, context and harness engineering relate?
A: They nest. Prompt engineering phrases the instruction; context engineering chooses which tokens the model sees (feedforward); harness engineering adds feedback and control over the whole run.

Q: What's the difference between the builder harness and the user harness?
A: The builder harness is what the agent's makers ship (loop, system prompt, built-in tools). The user harness is what you add: instruction files, hooks, linters, tests.

Q: What did LangChain change to move its coding agent from 52.8% to 66.5% on Terminal Bench 2.0?
A: Only the harness: the system prompt, the tools and the middleware. The model stayed fixed.

Q: Local fix versus structural fix: which one compounds, and why?
A: The structural fix, such as a lint rule, test or hook, because it protects every future run. A local fix, such as a re-run or a "don't do X" line, protects nothing beyond this one.

Q: What is prompt whack-a-mole?
A: A system prompt that grows one "IMPORTANT: never…" line per incident until nothing is checked, every rule looks equally important, and the rules contradict each other.

Q: What was OpenAI's Codex team's operating principle?
A: "Humans steer. Agents execute." When the agent struggled, they asked what was missing from the environment and had the agent build it.

=== m2
Q: When is an agent worth its cost over a workflow?
A: Only when you can't predict the steps in advance. Workflows are cheaper, faster and easier to test.

Q: Where does every guardrail in a harness live?
A: In the gap between the model's request and its execution. The model proposes; the harness decides whether and how to execute.

Q: How should a failed tool command reach the model?
A: As a tool result marked as an error, with a message it can act on. The harness raises only for its own faults.

Q: Why make completion an explicit tool call?
A: A finish tool with a required field such as `verified_by` turns "done" into a structured claim the harness can check, instead of the model going quiet.

Q: Name the three independent stop conditions every loop should have.
A: Finish, a turn limit and a token budget. Production adds wall-clock time and dollar cost.

Q: When truncating command output, which end do you keep, and why?
A: The tail, because that's where the error usually is.

Q: What is a stateless reducer, and what does it buy you?
A: Modeling the next action as a pure function of the event history. Pause, resume, replay and forking come almost for free.

Q: Name the four hook points to build into the loop.
A: before_model, before_tool, after_tool and on_stop.

=== m3
Q: Why does `schedule_event` beat separate list-users, list-events and create-event tools?
A: Build tools for workflows, not endpoints. One task-level tool saves the agent's context and turns.

Q: What should a tool return instead of a bare UUID?
A: Readable fields such as a name, with the ID alongside when a follow-up call needs it. Readable identifiers improved precision and cut hallucinated IDs.

Q: What does a `response_format` parameter let the agent do?
A: Choose verbosity: concise by default, detailed only when it needs the IDs for follow-up calls.

Q: What should a truncated tool output tell the agent?
A: Exactly how much it's seeing and how to get more or narrow the query, such as "Showing 50 of 4,812 matches. Add a host or since filter."

Q: What makes a good tool error?
A: It says what was wrong and shows a correct example, like "since must be ISO-8601, e.g. 2026-11-19T08:00:00Z".

Q: How did presenting MCP tools as code change token use in Anthropic's example?
A: From about 150,000 tokens to about 2,000, a 98.7% cut. The agent reads only the definitions it needs and intermediate data stays in the sandbox.

Q: Why keep the tool list stable within a run, and how do you restrict tools instead?
A: Changing definitions invalidates the prompt cache and confuses the model about earlier calls. Mask what's allowed, by constrained decoding or a before_tool hook that rejects out-of-phase calls.

Q: How should a huge tool output be handled?
A: Offload it: keep the head and tail in context and write the full output to a file the agent can grep.

=== m4
Q: What is context rot?
A: As the window fills, the model's ability to recall and use any given piece declines. It's gradual, not a cliff.

Q: Why is the prompt cache the dominant cost lever for agents?
A: Agents are input-bound: the history is re-sent every step. Manus reports roughly 100:1 input to output, and cached input can be ten times cheaper.

Q: Name four cache rules to enforce in code.
A: No volatile values in the prefix, append rather than edit history, serialize deterministically (`sort_keys=True`), and keep tool definitions stable.

Q: What's the classic cache-killer at the top of a system prompt?
A: A timestamp accurate to the second, such as "Current time: 2026-11-19 09:38:12".

Q: What should an instruction file such as AGENTS.md be?
A: A map of about 100 lines that points into a versioned docs/ tree, checked by CI. Not an encyclopedia.

Q: Name the four techniques for long tasks.
A: Compaction, the filesystem as memory, recitation of the plan at the tail, and subagents with clean windows.

Q: What is recitation, and what problem does it fix?
A: The agent rewrites its todo file as it works, pushing the current plan to the end of the context, where attention is strongest. It fixes "lost in the middle" and goal drift.

Q: When an action fails, should you clean it out of the context?
A: No. Keep the failed action and its error in, so the model updates its beliefs and doesn't repeat it.

Q: On a repetitive batch, how do you stop the context "few-shotting" the agent?
A: Add small, controlled variation in how appended actions and observations are serialized. Never vary the stable prefix.

=== m5
Q: What's the difference between a guide and a sensor?
A: A guide acts before the agent does, to make a good result likely (feedforward). A sensor observes after it acts and helps it self-correct (feedback).

Q: Computational versus inferential controls: which should you default to?
A: Computational (deterministic: tests, linters, type checks), because they're cheap enough to run on every change. Add inferential ones (model-based) where nothing deterministic can see.

Q: Why do you need both guides and sensors?
A: Feedback alone means the agent keeps making the same mistake. Feedforward alone means rules nobody verifies were followed.

Q: What four things should a sensor message for an LLM contain?
A: The location, the rule, the fix and a reference.

Q: What was the most common failure in LangChain's Terminal Bench traces?
A: The agent re-read its own code, decided it looked fine, and stopped without running anything. The fix is a pre-completion verification gate.

Q: What is a doom loop, and how does the harness catch it?
A: An agent retrying small variations of the same failing approach. Count edits per file and, after N, add a note suggesting it step back.

Q: What was the "reasoning sandwich", and how did it score?
A: Maximum reasoning for planning and verification, high for implementation: 66.5%, against 53.9% for maximum throughout (it timed out).

Q: Why use a separate evaluator rather than letting the generator grade itself?
A: Agents praise their own output. A separate, skeptical, calibrated evaluator is far easier to tune.

Q: Why must a verification gate have a rejection cap?
A: So the sensor can't trap the agent in a loop of its own.

=== m6
Q: Name the three failure modes of long-running agents.
A: Doing too much at once, premature completion, and features marked done without end-to-end verification.

Q: How do the initializer and the worker agents differ?
A: Only in the first user message. They share the same system prompt, tools and harness.

Q: Why is the feature list JSON rather than Markdown, and what may a worker change?
A: Models are less likely to rewrite structured JSON. Workers may only flip `passes` from false to true, enforced by a hook or pre-commit check.

Q: What's the first thing a worker session does after reading the log and feature list?
A: Runs init.sh and checks that the app still works end to end, to catch bugs left by the previous session.

Q: What does the session driver's completion test read?
A: The artifact (the feature list), not the model's claim. Completion is a property of the artifact.

Q: Compaction or a context reset: which should you use?
A: It depends on the model. Sonnet 4.5 showed context anxiety and needed resets; Opus 4.5 didn't. Make it configurable and test it.

Q: What is a Ralph loop?
A: A harness that catches the agent's exit and restarts it with the original prompt in a fresh context, relying on state in files.

Q: When does a planner, generator and evaluator split pay off?
A: Only for tasks beyond what the model can reliably do alone. In one example the solo run cost about $9 and didn't work; the full harness cost about $200 and produced a playable app.

=== m7
Q: What mostly explains multi-agent performance gains?
A: Spending more tokens in parallel. Token usage alone explained 80% of the variance in Anthropic's browsing eval.

Q: How many tokens do agents and multi-agent systems use compared with a chat?
A: Roughly 4× for an agent and 15× for Anthropic's multi-agent system.

Q: What reconciles "build multi-agent" with "don't build multi-agents"?
A: Reads parallelize far better than writes. Conflicting reads give redundant notes; conflicting writes give broken systems.

Q: "Actions carry implicit decisions." What follows from that?
A: Conflicting decisions carry bad results, so subagents writing parts of one artifact make choices that don't fit together.

Q: What is a subagent used as a context firewall?
A: A short-lived helper that explores in a clean window and returns a short answer (often 1,000–2,000 tokens), with its full trace saved.

Q: What four things belong in a delegation brief?
A: An objective, decisions already made, an output format, and boundaries.

Q: How should the lead agent treat a subagent's return?
A: As data from a possibly exposed source, not a trusted instruction. Otherwise it's an injection relay.

=== m8
Q: Why does prompt injection exist?
A: Trusted instructions and untrusted content share one channel, and the model can't reliably tell them apart.

Q: Name the three legs of the lethal trifecta.
A: Private data, untrusted content, and external communication (egress).

Q: What's the defense against the trifecta?
A: Architectural: count the legs, and if all three can meet in one context, cut one.

Q: Why did approval prompts fail in Claude Code, and what replaced them?
A: Users approved about 93% of them, so they stopped protecting anything. An OS-level sandbox replaced them and cut prompts by 84%.

Q: Why must filesystem and network isolation go together?
A: Without network isolation, a compromised agent can exfiltrate files. Without filesystem isolation, it can change its environment and escape to the network.

Q: Where should long-lived credentials live?
A: On the host, never in the sandbox. Give the sandbox a scoped, revocable token, or have an egress proxy attach credentials.

Q: Why is an allowlisted domain a capability grant?
A: Every function reachable through it is attack surface, such as uploading files to another account on that service. Allowlist paths and methods, pinned to your own account.

Q: Name three less obvious attack surfaces.
A: Any three of: project configuration (hooks and MCP configs in a cloned repo), custom proxies and allowlists, symlink path tricks, persistent memory files, and isolation that hides activity from host security tools.

=== m9
Q: If each step succeeds 99% of the time, how often does a 200-step run finish cleanly?
A: About 13% of the time. Small failure rates compound.

Q: State durable execution in one idea.
A: Record each completed step's result outside the process, and on restart replay the record instead of redoing the work.

Q: Why does every external side effect need an idempotency key?
A: A crash can land after the effect but before it's recorded. The key lets the service recognize the repeat and ignore it.

Q: Why must randomness and clock reads go inside recorded steps?
A: Replay only works if the loop makes the same decisions given the same recorded results.

Q: Which failures do you retry with backoff, and which do you not?
A: Retry 429s, 529s, 5xx and timeouts with exponential backoff and jitter. Don't retry a 400 or schema error (it's a harness bug), and return tool errors the model caused to the model.

Q: How should human approval be implemented?
A: As a tool call that records the request, notifies someone and ends the process. A resume call appends the answer later.

Q: Why does an approval need a state digest and expiry?
A: The world changes while the run is paused. Re-check that what was approved is still what will happen, and expire stale approvals.

Q: What goes wrong with a "forever approval"?
A: A process holding the run in memory loses every pending approval on a deploy or crash. Pending approvals belong in the database with an expiry.

=== m10
Q: What does a trace of an agent run look like?
A: A tree: the run is the root span, with model calls, tool executions, subagents and compactions as children.

Q: What's the status of the OpenTelemetry GenAI conventions?
A: Still in development, not stable, and moved to their own repository in June 2026. Expect attribute names to shift.

Q: An approval rate near 100% tells you what?
A: The prompt is noise. Tighten the boundary instead.

Q: Transcript versus outcome: which should you usually grade?
A: The outcome, the final state of the environment.

Q: Name the three kinds of grader, in order of preference.
A: Code-based first, model-based where code can't judge (with a rubric, calibrated against humans), and human review on samples.

Q: What belongs in a capability suite versus a regression suite?
A: Capability: tasks the agent often fails, to show progress. Regression: tasks it reliably passes, run on every change. Promote tasks when they become reliable.

Q: Give the formulas for pass@k and pass^k.
A: pass@k = 1 − (1 − p)^k, the chance at least one of k tries succeeds. pass^k = p^k, the chance all k succeed.

Q: An agent solves 80% of tasks. How often does it succeed three times in a row?
A: About half the time (0.8³ ≈ 0.51). Report pass^k for anything users depend on.

Q: How do you avoid overfitting the eval?
A: Keep a held-out set you don't look at while iterating, refresh tasks from production, and distrust a big jump from a small change.

=== m11
Q: What is the steering loop?
A: When the same failure recurs, improve a guide or a sensor so it becomes less likely or impossible, and record why.

Q: What do you do when docs aren't enough to change the agent's behavior?
A: Promote the rule into code: a lint, a test or a structural check.

Q: Why does a codebase built by agents drift?
A: Agents copy the patterns they see, including bad ones, so every shortcut becomes a template.

Q: What replaced OpenAI's weekly manual cleanup?
A: Golden principles as mechanical rules, background cleanup agents that open small PRs, and a doc-gardening agent.

Q: How strict should merge gates be?
A: As strict as your corrections are expensive. Minimal gates suit very high throughput where fixes are cheap; they'd be irresponsible elsewhere.

Q: What should you do with the harness when the model changes?
A: Re-run the evals, remove components the new model no longer needs, and tune for the model you actually run.

Q: What is a component record's removal test for?
A: It turns "should we still have this?" into an experiment you can run on every model upgrade.

=== m12
Q: What must every evidence item in a Sentinel report reference?
A: A log line ID or config diff hunk that actually exists in the fixtures, checked by a computational citation checker.

Q: Why include incidents with no local cause in Sentinel's fixtures?
A: Agents love to invent a culprit. You need to know whether yours says "nothing changed here; escalate upstream."

Q: Which trifecta leg does Sentinel cut, and how?
A: Egress: no network access, its only output is a report file plus a human-approved change request. Configs are also redacted before the model sees them.

Q: What pass^3 target does Sentinel's definition of done set?
A: At least 0.7 on the held-out incidents, including the "no local cause" ones.

Q: What should happen when a config fixture changes while a change request is pending?
A: Resume rejects the stale approval, because the state digest no longer matches.
