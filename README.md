# AI Courses

Self-contained courses on AI engineering, published with GitHub Pages.

**Read them:** https://nwfreshness.github.io/ai-courses/

| Course | What it covers |
|---|---|
| [LLM Engineering](https://nwfreshness.github.io/ai-courses/llm-engineering/) | A week-by-week companion to Ed Donner's [llm_engineering](https://github.com/ed-donner/llm_engineering) repo |
| [Harness Engineering](https://nwfreshness.github.io/ai-courses/harness-engineering/) | Building production-grade agent harnesses |

Every course works on phones, saves progress in the browser, and has no external dependencies. The hub page shows progress across all of them.

## Layout

```
build.py                    builds everything into site/
engine/head.html            shared page shell: CSS, sidebar, top bar
engine/tail.html            shared scripts: navigation, quizzes, progress, animation
hub/index.html              the course list
courses/<slug>/course.json  title, colors, storage key, hero type, hub card
courses/<slug>/course.css   optional course-specific styles
courses/<slug>/m00.html …   the course's sections, in file-name order
```

## Working on it

```sh
python3 build.py                      # writes site/
python3 -m http.server 8000 -d site   # then open http://localhost:8000
```

Use a local server rather than opening the files directly, so links between courses resolve.

## Adding a course

1. Copy an existing folder in `courses/` to `courses/<new-slug>/`.
2. Edit `course.json`: `slug`, `title`, `subtitle`, a unique `storage` key (progress is stored under it), `hero` (`loom` or `tokens`, or add a new hero function in `build.py`), and the hub card fields (`accent`, `blurb`, `time`, `motif`).
3. Write sections as `m00.html` (start page), `m01.html`, … Each is a `<section class="module" id="…" data-title="…" data-wire="…" data-group="…">`. Sections with ids `m0`, `m1`, … count as modules for progress.
4. Run `python3 build.py` and push. The workflow in `.github/workflows/pages.yml` rebuilds and deploys on every push to `main`.

## GitHub Pages setup (one time)

Repo **Settings → Pages → Source: GitHub Actions**. Don't choose either of the suggested starter workflows; this repo already has its own.
