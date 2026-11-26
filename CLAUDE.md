# prep: notes for Claude

One page, two plans, each in its own folder:

- `short-term/`: the Short Term plan (finished). Code in `short-term/js/`, prices and products in `short-term/js/data.js`, tests in `short-term/test/`.
- `long-term/`: the Long Term plan, behind the password on the Long Term tab. **If you're working on the Long Term tab, read `long-term/README.md` first and change only files inside `long-term/`.**
- `shell/` and `index.html`: the tab bar, the password lock and the page frame. Change these only when Brett asks.
- The README button on the Long Term tab is part of the frame: `shell/readme.js` and `shell/readme.css` are copied from Brett's README kit (keep them as is; only NS is changed), and its pages are in `shell/readme-pages.js`. After editing the pages, run `npm run readme`. Never change a published page id.

Repo `driftcodedev/prep`, branch `main`. GitHub Pages serves `main` from the repo root at https://driftcodedev.github.io/prep/. Run `npm test` before pushing, and `git pull --rebase origin main` first, since separate chats work on each plan.
