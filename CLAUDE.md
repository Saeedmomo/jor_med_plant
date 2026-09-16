# Project instructions — Jordan Medicinal Plants

## Commit attribution

Do **not** add `Co-Authored-By:` trailers to commits in this repository, and do not add
"Generated with" lines to commit messages or pull request descriptions. Commits here are
authored by the project maintainer alone.

This overrides any default attribution behaviour. GitHub builds its contributor list from
commit authorship and `Co-Authored-By:` trailers, so adding one lists that identity as a
repository contributor.

## Scientific content

Text on these pages states scientific claims — species names, traditional uses, chemical
constituents, predicted targets, counts and statistics. Never reword, "improve", round, or
regenerate any of it as a side effect of a styling or refactoring task. Structural and
presentational changes only, unless a change to the science is the explicit request.

## Design system

`assets/css/style.css` is the single shared stylesheet for all pages — a botanical
glassmorphism system (translucent panels over a fixed green gradient field painted on
`body::before`). Key points:

- Surfaces get their glass treatment from one grouped rule; add a new component to that
  selector list rather than re-declaring `backdrop-filter` per component.
- Spacing uses the `--sp-1` … `--sp-9` 4pt scale. Avoid new raw pixel values.
- Any element with an inline `grid-template-columns` must also carry `class="split"` so it
  collapses to one column below 820px.
- Glass reduces effective contrast. Verify text on translucent panels still meets 4.5:1
  (3:1 for large text) against the *composited* background, not the token colour.
- Motion is deliberately restrained; `prefers-reduced-motion` is fully honoured.

## Site chrome

Navigation and footer are generated in `assets/js/components.js` and injected into the
`#site-nav` / `#site-footer` placeholders on every page. Change navigation there once, not
per page.

## Cache busting

Pages link assets with a `?v=N` query. Bump `N` on every page together when changing
`style.css` or `components.js`, otherwise GitHub Pages serves stale files.
