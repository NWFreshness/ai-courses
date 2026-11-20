=== setup | Starter AGENTS.md
Every module ends with a <strong>Build it with an agent</strong> kit: a brief to hand your coding agent, a prompt for reviewing the result in a fresh session, and a short list of things to check yourself. Keep every module in one <code>agents-lab</code> repo, with a folder per module, so the tools and the task board can be reused.

The code in each lesson shows what good looks like. You'll rarely type it; you'll compare your agent's output against it. Start the repo with the file below. Codex, Cursor and most other agents read <code>AGENTS.md</code> directly; for Claude Code, also add a <code>CLAUDE.md</code> containing the single line <code>@AGENTS.md</code>. There's something pleasingly recursive about using a coding agent to build agents: notice how its harness does the things these modules teach.
--- brief
# Agents lab

One folder per module (m0/ to m9/), built from the briefs in docs/briefs/. Shared helpers live in common/.

## How to work
- Given a brief, first write docs/PLAN.md: phases, each with success criteria you can verify yourself (tests, commands and their output, traces), as checkboxes. Then stop and wait for my approval.
- After approval, build one phase at a time, run the tests, tick the criteria and commit.
- Pin framework versions in pyproject.toml; these frameworks change often.
- Tests never call a real model. Use a stub model, or the framework's fake model.
- Every agent run has a turn limit, and every tool returns errors as text instead of raising.
- Agent-written code runs only in a container with no network.
- Keys live in .env, which is git-ignored. Never print or commit them.
- Never send email or notifications to anyone but me.

## Stack
Python 3.12 with uv, async throughout. OpenAI Agents SDK, CrewAI, LangGraph and LangChain, and others as each brief says. Node 22 for MCP servers launched with npx. Docker. pytest and ruff.

=== m0 | The workshop: keys, a notifier and async
--- brief
# Brief: the workshop

## Goal
Set up agents-lab and the helpers every later module uses.

## Requirements
- A uv project on Python 3.12; .env and .gitignore; the keys from the course's setup list read from .env.
- common/notify.py: push(message) for Pushover and send_email(subject, body) that only ever sends to my own address from .env. Both return a short status string and never raise.
- m0/smoke_test.py: three model calls run with asyncio.gather and timed, against one call, to show the overlap.
- A check script that reports which keys are present and whether node, npx and docker are on the path.

## Success criteria
- [ ] `uv run m0/smoke_test.py` shows three calls taking about as long as one
- [ ] `uv run -m common.notify "hello"` delivers a phone notification
- [ ] The check script lists exactly what's missing
--- review
Fresh-context review. Read AGENTS.md and docs/briefs/m0.md. Run the criteria. Check send_email can't be given another recipient by any argument, that both helpers return status strings on failure, and that no key is printed. Report problems; don't fix them.
--- check
- You got the notification on your phone
- send_email only ever reaches you
- Node and Docker both answer from the terminal

=== m1 | A model panel with a judge
--- brief
# Brief: model panel

## Goal
m1/: one model writes a hard question, a panel of models from different providers answers it, and a judge ranks the anonymized answers.

## Requirements
- A config list of panel models (OpenAI, OpenRouter models from other providers, optionally Ollama), called concurrently.
- Answers are shown to the judge numbered, without model names, in a shuffled order recorded in the output.
- The judge returns JSON with the ranking; the code parses it, retrying once on invalid JSON with the error included.
- Run three times and report how stable the ranking is.
- Tests with stub models, including a judge that returns invalid JSON once.

## Success criteria
- [ ] `uv run m1/panel.py` prints the question, the ranking with model names, and timing
- [ ] Three runs produce a stability summary
- [ ] The invalid-JSON test passes
--- review
Fresh-context review. Read docs/briefs/m1.md. Check that the judge never sees model names, that order is shuffled between runs, that calls run concurrently, and that parsing failures are handled. Report problems; don't fix them.
--- check
- You can name which patterns this uses (parallelization, and half of evaluator-optimizer)
- The winner changed at least once across runs, or you know why it didn't
- The judge had no way to know which model wrote which answer

=== m2 | A career assistant that speaks for you, then a planning loop
--- brief
# Brief: career assistant and planner

## Goal
m2/: a chat assistant that answers as me from my profile, captures leads and unknown questions to my phone, checks its own replies, and deploys to Render; then a terminal agent that plans with a checklist.

## Requirements
- me/profile.pdf and me/summary.txt (I'll provide them). A system prompt grounded only in those.
- A hand-written tool loop (no agent framework): record_user_details and record_unknown_question, dispatched through an explicit dictionary, errors returned as text, a turn limit.
- An evaluator call with structured output (acceptable, feedback); on a fail, one retry with the feedback added.
- A Gradio ChatInterface; history stripped to role and content.
- Render deployment notes: build and start commands and the environment variables, including GRADIO_SERVER_NAME and GRADIO_SERVER_PORT. Don't deploy; I will.
- m2/planner.py: create_checklist and mark_complete tools, a rich terminal display, the same loop.

## Success criteria
- [ ] An unknown question and a lead each trigger one notification
- [ ] A test with a stub evaluator that fails once shows the retry
- [ ] The planner solves a small puzzle and every checklist item ends ticked
--- review
Fresh-context review. Read docs/briefs/m2.md. Check the dispatcher can't call functions outside its dictionary, that every tool call id gets a result, that the evaluator sees the rules and the reply, and that the deployment notes keep keys out of the repo. Report problems; don't fix them.
--- check
- You chatted with it and it refused to invent a degree you don't have
- Both notification types reached your phone
- You can point to the loop in under 30 lines

=== m3 | A sales team and a deep-research agent on the OpenAI Agents SDK
--- brief
# Brief: sales team and deep research

## Goal
m3/: a sales-email team orchestrated three ways, a guardrail, and a deep-research agent orchestrated by code.

## Requirements
- Three writer agents with different styles for a fictional product. Version 1: asyncio.gather plus a picker agent. Version 2: a manager agent with the writers as tools (as_tool) and a send_email tool. Version 3: a handoff to an emailer agent.
- One writer on a non-OpenAI model through OpenAIChatCompletionsModel.
- An input guardrail on the manager that trips when the request names a real person.
- Deep research: a planner with output_type WebSearchPlan, five searches run concurrently (searcher with WebSearchTool and tool_choice required), a writer with output_type Report, an emailer. Each step a separate Runner.run inside one trace.
- A Gradio UI that streams status lines and then the report.

## Success criteria
- [ ] All three sales versions send one email to me, each with its own trace name
- [ ] The guardrail stops a request naming a person, and a test covers it
- [ ] A research run produces a Report object and an email
--- review
Fresh-context review. Read docs/briefs/m3.md. Check the guardrail is on the first agent of the run, that only the emailer can send, that structured outputs are validated models, and that the research steps run in the order the brief gives. Report problems; don't fix them.
--- check
- You opened the traces and can say who was in control in each version
- You know where the guardrail runs and where it wouldn't
- The research report cites what it searched

=== m4 | Three CrewAI crews, including one that runs its own code in Docker
--- brief
# Brief: crews

## Goal
m4/: a debate crew, a hierarchical stock-picker crew, and an engineering crew that writes and tests code in a sandbox.

## Requirements
- Use the pinned CrewAI version; create each crew with the CLI and keep agents and tasks in YAML.
- debate: a debater for and against, a judge on a different provider, outputs written to files.
- stock_picker: finder, researcher and picker with SerperDevTool, output_pydantic on the first two tasks, a push-notification tool for the pick, hierarchical with a manager agent, memory on.
- engineering_team: lead, backend, frontend (Gradio) and test engineers. Sandbox tools that write files only inside sandbox/ and run Python in docker run --rm --network none with a memory limit and a timeout. Tool caching off for those tools.

## Success criteria
- [ ] Each crew runs with crewai run and writes its outputs
- [ ] The engineering crew's tests run inside the container and pass
- [ ] A test shows the write tool refuses a path outside sandbox/
--- review
Fresh-context review. Read docs/briefs/m4.md. Check the sandbox tools for path escapes (.., absolute paths, symlinks), that containers have no network, that caching is off for stateful tools, and that the manager isn't also listed as a crew agent. Report problems; don't fix them.
--- check
- You saw the manager send work back at least once
- Agent-written code never ran on your machine directly
- You read the full prompt CrewAI built for one agent

=== m5 | Sidekick: a co-worker that checks its own work
--- brief
# Brief: Sidekick

## Goal
m5/: a LangGraph worker with a browser, files, search and notifications, an evaluator that checks each answer against success criteria, and human approval for notifications.

## Requirements
- State: messages (add_messages), success_criteria, feedback, attempts, needs_user.
- Nodes: worker (model with tools), tools (ToolNode), evaluator (structured output: feedback, success_criteria_met, user_input_needed). Route worker to tools or evaluator; evaluator back to worker or END; stop after three attempts.
- Tools: Playwright via MultiServerMCPClient, file tools scoped to sandbox/, a search tool, and a push tool gated by HumanInTheLoopMiddleware or an interrupt.
- A SQLite checkpointer; a Gradio UI with request and success-criteria boxes and the evaluator's feedback shown.
- Async throughout, since MCP tools are async.

## Success criteria
- [ ] A task that fails the criteria once loops back with feedback and then passes
- [ ] A notification waits for approval and resumes after it
- [ ] Restarting the app and reopening a thread shows its history
--- review
Fresh-context review. Read docs/briefs/m5.md. Check the attempt limit really ends the loop, that file tools can't leave sandbox/, that the approval gate covers every outbound tool, and that nothing mixes sync invoke with async tools. Report problems; don't fix them.
--- check
- You rewound a thread with get_state_history and resumed from an earlier step
- You approved one notification and rejected one
- The evaluator's feedback was specific enough to act on

=== m6 | One board, five frameworks, then a team
--- brief
# Brief: the task board team

## Goal
m6/: a shared SQLite task board, the same worker in Google ADK, Pydantic AI, Strands, Microsoft Agent Framework and Agno, an A2A demo, and an orchestrator that coordinates the workers.

## Requirements
- common/board.py: goals and steps, with an atomic claim (a single conditional UPDATE).
- Shared tool functions (show_todos, plan_steps, complete_task) used unchanged by every framework.
- Each worker: the board tools plus the filesystem MCP server scoped to its workspace. Run bare, it seeds and works a demo goal; given a task id and board path, it works that task and exits.
- An A2A demo: serve one ADK agent with to_a2a and call it from another with RemoteA2aAgent.
- An orchestrator agent with launch_worker, wait_for_team, test_output (a QA agent with a browser) and relaunch_worker (one fix per task).

## Success criteria
- [ ] Each worker translates notes.txt to spanish.txt on its own
- [ ] A test with five concurrent claimers never gives one task to two workers
- [ ] The orchestrator builds one output per worker and sends at least one back for a fix
--- review
Fresh-context review. Read docs/briefs/m6.md. Check the claim is atomic in SQL, that every worker uses the same tool functions unchanged, that each MCP filesystem server is scoped to one folder, and that relaunches are capped. Report problems; don't fix them.
--- check
- You can answer the five questions (agent, run, tools, MCP, loop) for each framework
- You saw the A2A agent card in a browser
- Turning off the atomic claim in a test produced duplicate work

=== m7 | Your own MCP server, and an agent with memory and retrieval
--- brief
# Brief: MCP

## Goal
m7/: use several MCP servers from one agent, write an accounts server of your own, and give an agent memory and agentic RAG through MCP.

## Requirements
- An agent with fetch, Playwright and a filesystem server scoped to sandbox/ that researches a topic and saves a markdown file.
- accounts/: an Account class persisted to JSON or SQLite (balance, holdings, transactions, strategy) with tests, and an MCP server (MCPServer on SDK 2.x, or FastMCP on 1.x pinned with mcp<2) exposing get_balance, get_holdings, buy_shares, sell_shares and a resource accounts://accounts_server/{name}. buy_shares refuses trades the account can't afford.
- An agent with the memory knowledge-graph server that remembers me across runs.
- Agentic RAG: search plus the Qdrant server; the agent stores what it learns, then answers from the store alone in a later run.
- Tool filters where a server exposes more than the agent needs.

## Success criteria
- [ ] The accounts server works from the agent and from an MCP host such as Claude Desktop
- [ ] A test shows buy_shares refusing an unaffordable trade
- [ ] A second run recalls a fact stored in the first
--- review
Fresh-context review. Read docs/briefs/m7.md. Check which MCP SDK version is installed and that the imports match it; that the filesystem server is scoped; that tool filters are applied; and that refusals happen in the server, not the prompt. Report problems; don't fix them.
--- check
- You connected your server to a second host and it worked unchanged
- You know which third-party servers you ran and what they could access
- The agent answered from memory with the search server turned off

=== m8 | An autonomous trading floor on MCP
--- brief
# Brief: the trading floor

## Goal
m8/: four trader agents and a researcher, each capability behind an MCP server, running on a schedule with a live dashboard. Simulated money only.

## Requirements
- Servers: accounts (Module 7), market data (a simulator by default, a real API if a key is set), push notifications; the researcher gets fetch, search (filtered to search only) and memory, one memory file per trader.
- A Trader class: the researcher wrapped as a tool, AsyncExitStack for its servers, alternating trade and rebalance runs, max_turns, each trader's errors caught so others continue.
- trading_floor.py: all four traders with asyncio.gather every N minutes, with a flag to run when the market is closed.
- A custom TracingProcessor that writes each trader's spans to SQLite.
- A Gradio dashboard: portfolio value over time, holdings, transactions and logs per trader, refreshed by a timer.

## Success criteria
- [ ] Two cycles complete with trades recorded and a notification per trader
- [ ] A test makes one trader's market call fail; the other three still trade
- [ ] The dashboard shows each trader's logs from the trace processor
--- review
Fresh-context review. Read docs/briefs/m8.md. Check no trade can exceed cash, that each trader's memory is separate, that failures are isolated, and that every run is bounded by max_turns. Estimate the cost of a day at the default schedule. Report problems; don't fix them.
--- check
- You watched one cycle in the trace viewer end to end
- You know what a day of running it costs
- Nothing here touches real money

=== m9 | Harden one agent and build its evaluation suite
--- brief
# Brief: harden an agent

## Goal
m9/: take one earlier agent and make it production-shaped, with an evaluation suite that runs on every change.

## Requirements
- 15 to 30 evaluation cases with checks code can score (a tool was called, a file exists, a value is in range), each run three times, reporting pass rates per case.
- A model judge with a written rubric only where code can't check; ten of its rulings saved for me to review.
- Limits: turns per run, a daily spend cap, retries with backoff, timeouts on every external call.
- An audit log of every tool call with arguments, result and run id.
- Constraints enforced in tools (recipients, paths, amounts), not only in prompts.
- A red-team set: hidden instructions in fetched content, polite and insistent requests to exceed limits, a tool that fails halfway. Each must fail safely.

## Success criteria
- [ ] `uv run m9/evals.py` prints per-case pass rates and exits non-zero below the threshold
- [ ] Every red-team case fails safely, and the suite includes them
- [ ] The audit log shows the full history of one run
--- review
Fresh-context review. Read docs/briefs/m9.md. Try one new attack of your own and report what happened. Check that limits are enforced in code, that the evaluation suite runs each case more than once, and that the judge's rubric is specific. Report problems; don't fix them.
--- check
- A case that passed once failed on a repeat, and the pass rate showed it
- You added a new failure to the suite before fixing it
- You reviewed a sample of the judge's rulings yourself
