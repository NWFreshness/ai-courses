# Recall cards for the review deck. One "=== <module id>" per module, then Q:/A: pairs.
# Backticks become code. Editing a question resets that card's schedule.

=== m0
Q: Why are Node and Docker required rather than optional for this course?
A: Many MCP servers are JavaScript packages launched with `npx`, and agent-written code needs a disposable Docker container to run safely.

Q: Why does `load_dotenv(override=True)` need `override=True`?
A: Without it, a stale key already exported in your shell wins over the .env file you just edited.

Q: What shape does a good tool function have?
A: A plain function with type hints, a docstring saying what it does, and a short readable result saying whether it worked.

Q: What are the three async rules that cover nearly everything?
A: `await` one thing, `asyncio.gather` many at once, and `asyncio.run(main())` at the top of a script.

Q: What does calling an `async def` function give you before it's awaited?
A: A coroutine object that does nothing until it's awaited.

Q: Why pin framework versions in this course?
A: Agent frameworks ship breaking changes often, so when something doesn't match, check the version first. `uv add "crewai==1.14.4"` pins exactly.

=== m1
Q: What's the difference between a workflow and an agent?
A: A workflow follows code paths you wrote in advance. An agent's model directs its own process: which tools, in what order, and when it's done.

Q: How much autonomy should you start with?
A: The least that solves the problem. One good call beats a workflow when it's enough; a workflow beats an agent when you can write the steps down.

Q: Name the five workflow patterns.
A: Prompt chaining, routing, parallelization, orchestrator-workers, and evaluator-optimizer.

Q: When do you need orchestrator-workers rather than parallelization?
A: When you can't know the subtasks until you see the input, such as which files a change touches.

Q: What three risks does handing control to a model bring?
A: An unpredictable path, unpredictable output and unpredictable cost. Answer them with tracing, limits on turns and spend, and guardrails.

Q: Name three biases of model judges and how to counter them.
A: They favor longer answers, the first answer they read and their own style. Shuffle the order, hide authorship, keep criteria specific and spot-check rulings.

Q: The model panel with a judge uses which two patterns?
A: Parallelization (voting), and the evaluator half of evaluator-optimizer.

=== m2
Q: Describe the agent loop in one sentence.
A: Call the model, run the tools it asks for, append the results, and repeat until it answers or a limit hits.

Q: What two things make up a tool?
A: A JSON Schema description the model reads, and a function your code runs when the model asks.

Q: Why dispatch tool calls through an explicit dictionary instead of `globals()`?
A: `globals()` lets the model call any function in your program. An allow-list exposes only what you chose.

Q: The model asks for three tools in one turn. What must you send back?
A: One result per `tool_call_id`, after appending the model's own request, or the next request fails.

Q: A tool raises an exception. What should the loop do?
A: Catch it in the dispatcher and return the error as the tool result. Models read the error and correct themselves; an uncaught exception kills the run.

Q: Why use a different model family as the evaluator?
A: Models share blind spots with themselves, so a different family catches more.

Q: What does a checklist tool pair change about an agent?
A: How it works, not what it can reach: the model writes a plan and ticks it off, making its loop visible.

=== m3
Q: In the Agents SDK, what is an `Agent` and what is `Runner.run`?
A: An Agent is configuration: name, instructions, model, tools. `Runner.run` executes the loop and returns a result whose `final_output` is the answer.

Q: What does `@function_tool` read to build a tool?
A: The function's name, type hints and docstring, including its Args section, to build the JSON Schema.

Q: Each `Runner.run` starts fresh. How do you carry a conversation across calls?
A: Pass a session, which stores the history and replays it each time.

Q: Name the three ways to orchestrate agents, and who's in control in each.
A: Code (you are), agents as tools (the calling agent, which gets each result back) and handoffs (control passes one way to the other agent).

Q: When is a handoff the right choice?
A: Triage: route a user to the right specialist, which then owns the reply.

Q: Where do input and output guardrails run?
A: Input guardrails only on the first agent's initial input; output guardrails only on the last agent's final output. On a handoff target or agent-as-tool they never fire.

Q: An agent sometimes answers from memory instead of searching. What setting fixes it?
A: `ModelSettings(tool_choice="required")` forces a tool call.

Q: Why orchestrate the deep-research agent by code?
A: Fixed steps with typed outputs are predictable and testable on their own. One agent with all the tools might stop after two searches or forget to email.

=== m4
Q: What defines a CrewAI agent, and what defines a task?
A: An agent is a role, goal, backstory and model. A task is a description, expected output and an agent. YAML holds both.

Q: How does a later task in a sequential crew see earlier work?
A: Each task automatically gets the outputs of the tasks before it as context.

Q: What does a hierarchical crew add, and what does it cost?
A: A manager agent that delegates and reviews. It trades predictability for judgment, and it can loop or skip work.

Q: What do `output_pydantic` and `memory=True` give a crew?
A: `output_pydantic` returns a validated object that the next task can parse reliably; `memory=True` stores what the crew learns and recalls it in later runs.

Q: Name the three safety choices in the Docker code-runner tool.
A: `--rm` throws the container away, `--network none` blocks the internet, and a path check stops writes outside the sandbox folder.

Q: Why is CrewAI's default tool caching wrong for the code runner?
A: Its answer depends on files that just changed, so a cached result is stale. Caching suits searches.

Q: Why return stderr as well as stdout from the code runner?
A: So the agent can see its own errors and fix them.

=== m5
Q: In LangGraph, what are state, nodes and edges?
A: State is a typed dictionary that flows through the graph; nodes are functions that return updates; edges decide what runs next.

Q: What does a reducer such as `add_messages` do?
A: It says how an update combines with the existing field. By default an update replaces it; `add_messages` appends.

Q: What do `ToolNode` and `tools_condition` do?
A: `ToolNode` runs the tools the last message asked for. `tools_condition` routes to "tools" when there are tool calls and ends otherwise.

Q: What four things come from a checkpointer?
A: Conversation memory, durability, history, and time travel (resuming from an earlier checkpoint_id). It saves full state after every step, keyed by thread_id.

Q: How does human approval work with `create_agent` middleware?
A: The run pauses before the gated tool, saves to the checkpointer and returns an interrupt. `Command(resume=...)` continues the same run from that point.

Q: What do Deep Agents add over a plain loop?
A: A to-do tool, file tools on a backend, sub-agents with their own contexts, and skills loaded only when needed.

Q: How does Sidekick check its own work?
A: An evaluator node grades each answer against the user's success criteria with structured output, and sends it back with feedback until it passes or needs the user.

Q: MCP tools from `MultiServerMCPClient` raise an error in your graph. Why?
A: They're async-only. Run the graph with `await graph.ainvoke(...)` and make nodes `async def`.

=== m6
Q: What five questions does every agent framework answer?
A: How to make an agent, run it, add tools, add MCP, and loop toward a goal.

Q: How do you keep tools portable across frameworks?
A: Write them as plain typed, documented functions and MCP servers.

Q: What does A2A connect that MCP doesn't?
A: Agents to other agents, possibly in other frameworks or organizations. MCP connects agents to tools.

Q: What is an A2A agent card?
A: A JSON description of the agent's name, skills and endpoint, published at a well-known URL.

Q: How do you stop two workers claiming the same task?
A: One conditional UPDATE that matches only `status='pending'`. Never read a status and write it in two separate steps.

Q: How does the team stay coordinated: chat, or something else?
A: Shared state on the board. Each worker reads and writes it, so the orchestrator always knows where things stand.

Q: Why does the orchestrator allow one fix per task?
A: So a broken result gets reported rather than retried forever.

Q: Which framework would you pick for durable state, human approval and replay?
A: LangGraph.

=== m7
Q: Name MCP's three roles.
A: The host (the application), a client inside it holding one connection per server, and the server exposing capabilities.

Q: What three things can an MCP server offer?
A: Tools (functions to call), resources (data to read, identified by URIs) and prompts (reusable templates).

Q: How do stdio and Streamable HTTP servers differ?
A: stdio servers are local subprocesses running with your permissions; Streamable HTTP servers run elsewhere and are reached by URL.

Q: A server that downloads on first run times out. What do you change?
A: Raise `client_session_timeout_seconds` above the 5-second default, since npx and uvx download on first run.

Q: What changed in version 2.0 of the MCP Python SDK?
A: The server class was renamed from FastMCP (in mcp.server.fastmcp) to MCPServer (in mcp.server.mcpserver). The decorators and `run()` are unchanged.

Q: Name the four questions to ask before running a third-party MCP server.
A: Who wrote it and can you read it? What can it reach? What can its output make the model do? Can you limit the tools it exposes?

Q: How does agentic RAG differ from classic RAG?
A: The agent decides what's worth storing as it works, and retrieval is just another tool it chooses to use.

Q: What's the difference between prompt engineering and context engineering?
A: Prompt engineering is the words of your instructions; context engineering is everything else the model sees: memory, retrieved documents, tool results and live data.

=== m8
Q: What's the core design rule of the trading floor?
A: Agents decide; MCP servers do. Capabilities sit behind servers that can be tested, swapped or reused on their own.

Q: How does a trader use the researcher agent?
A: As a tool, via `as_tool`, with the researcher's own fetch, search and memory servers attached.

Q: Why does each trader get its own memory file?
A: So one trader's notes about a company build up over runs without leaking into another's.

Q: What does `AsyncExitStack` do in the trader?
A: Opens a variable number of MCP servers and guarantees they all close, even if the run fails.

Q: Name four things that make unattended trading runs safe enough.
A: Bounded turns (`max_turns`), errors caught per trader, constraints enforced in the tools themselves, and logs of everything (plus simulated money).

Q: What does a custom trace processor give you?
A: Every trace and span as it starts and ends, so you can write them to a database your own dashboard reads.

Q: Name the span types the SDK records.
A: agent, generation (a model call), function (a tool call), mcp_tools (listing a server's tools) and handoff.

=== m9
Q: Why run each evaluation case several times?
A: An agent's output and path vary from run to run, so one pass proves little. Track the pass rate.

Q: What kind of checks should an agent eval prefer?
A: Ones code can score: a tool was called, a file exists, a test passes, a number is in range. Model judges with rubrics only for what code can't check.

Q: An agent misbehaves in use. What's the first thing you do?
A: Add that input to the evaluation suite before you fix it.

Q: Where should limits that matter, such as spend and recipients, be enforced?
A: In the tool's code, which refuses and explains. Not in the prompt.

Q: What should an agent that reads untrusted content not also hold?
A: Tools that send, pay or delete, unless a human approves each use.

Q: Name four items on the safety checklist besides sandboxing.
A: Any four of: least privilege, constraints in tools, separating untrusted input from powerful actions, approval for the irreversible, limits on everything, audit logs, and a stop button.
