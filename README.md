# Jordan Medicinal Plants — Website (Version 2)

An open, modern research portal for the cheminformatic analysis of secondary
metabolites in Jordanian medicinal plants. Built as **static files** so it runs
anywhere — especially **GitHub Pages**, with no server, no build step, and no
database required.

---

## 1. What's in this project (file map)

```
jor_med_plant/                 ← put these files in your repository root
│
├── index.html                 Home / landing page
├── plants.html                Searchable plant catalog (live Wikipedia images)
├── untapped.html              Underexplored / uncharacterized species
├── research.html              Methods & AI workflow + live data charts
├── discoveries.html           Featured compounds + repurposing case study
├── collaborate.html           Contribution portal + submission form
├── about.html                 Background, team, vision, citation
│
├── .nojekyll                  Tells GitHub Pages to serve files as-is
├── README.md                  This file
│
└── assets/
    ├── css/
    │   └── style.css           All site styling (one file — edit colours here)
    ├── js/
    │   ├── data.js             ALL the data + curated content (edit this to update content)
    │   ├── components.js       Shared navigation bar + footer (edit nav here)
    │   └── plants.js           Plant catalog logic + Wikipedia image fetching
    └── img/
        └── README.txt          Where to drop your manuscript figure images
```

### What each file is for

| File | Purpose | When you'd edit it |
|------|---------|--------------------|
| `index.html` … `about.html` | The seven pages of the site | To change page text or layout |
| `assets/css/style.css` | The entire visual theme (fonts, colours, spacing) | To restyle anything |
| `assets/js/data.js` | The dataset: stats, plant list, featured plants, untapped species, compounds, targets, scaffolds | **Most content edits happen here** |
| `assets/js/components.js` | The nav bar + footer that appear on every page | To add/rename a menu link site-wide |
| `assets/js/plants.js` | Renders plant cards and pulls images/summaries from Wikipedia | Rarely — only to change catalog behaviour |
| `assets/img/` | Your figure images (Figure 1, 2, 5, 7) | To show the manuscript figures |

---

## 2. Deploy to GitHub Pages (step by step)

You don't need any web-development experience for this.

### Option A — replace your existing repo contents (recommended)

1. Go to your repository: **https://github.com/Saeedmomo/jor_med_plant**
2. (Optional but safe) make a backup branch of your current site first:
   on the repo page, click the branch dropdown → type `v1-backup` → **Create branch**.
3. Upload the new files: click **Add file → Upload files**, then drag in
   **everything inside this `site` folder** (the `.html` files, `.nojekyll`,
   `README.md`, and the whole `assets/` folder). Keep the folder structure intact.
4. Scroll down, write a commit message like `Deploy website v2`, click **Commit changes**.
5. Turn on Pages: **Settings → Pages →** under *Build and deployment* set
   **Source = Deploy from a branch**, **Branch = `main`** (or `master`), folder **`/ (root)`**, then **Save**.
6. Wait ~1 minute. Your site is live at:
   **https://saeedmomo.github.io/jor_med_plant/**

### Option B — using Git on your computer

```bash
git clone https://github.com/Saeedmomo/jor_med_plant.git
cd jor_med_plant
# copy all files from this 'site' folder into here, then:
git add .
git commit -m "Deploy website v2"
git push origin main
```

> **Important:** the files must sit at the repository **root** (so `index.html`
> is at the top level), not inside a sub-folder — otherwise the URLs change.

---

## 3. Test it locally first (optional)

Because the plant catalog fetches images from Wikipedia, open the site through a
local web server rather than double-clicking the file:

```bash
cd site
python3 -m http.server 8000
# then open http://localhost:8000 in your browser
```

---

## 4. How to update content (no coding needed for most edits)

Almost all content lives in **`assets/js/data.js`**. Open it in any text editor:

- **Add a featured plant** → add an object to the `featured` list. The `wiki`
  field is the Wikipedia article title (use `_` for spaces) so the photo loads.
- **Add an untapped species** → add to the `untapped` list.
- **Add / edit a compound discovery** → edit the `compounds` list.
- **Headline numbers** (475 plants, 7,866 metabolites, etc.) → edit `stats`.

To **add a menu link** for the whole site, edit the `NAV` array at the top of
`assets/js/components.js`.

To **change colours or fonts**, edit the variables at the top of
`assets/css/style.css` (the `:root { … }` block).

---

## 5. Turn the contribution form into one-click submissions (optional)

Out of the box, the **Contribute** page opens a pre-filled email or a GitHub
issue — both work on GitHub Pages with no server. To collect submissions
automatically:

1. Create a free form at **https://formspree.io** and copy your endpoint URL.
2. Open `collaborate.html`, find the `CONFIG` block near the bottom, and paste it:
   ```js
   var FORMSPREE_ENDPOINT = "https://formspree.io/f/xxxxxxxx";
   var CONTACT_EMAIL = "your.real@email.com";
   ```
3. Commit and push. Submissions now arrive in your Formspree inbox.

Also update `CONTACT_EMAIL` so the email fallback reaches you.

---

## 6. Notes on images & copyright

- Plant photos and one-line summaries are fetched **live from Wikipedia /
  Wikimedia Commons** (CC BY-SA) at page-load and link back to the source —
  this keeps the site copyright-clean and always up to date, with nothing to host.
- Species with **no** Wikipedia entry show a botanical placeholder and a
  "No Wikipedia entry" note — which is exactly the point for the untapped species.
- Your own **manuscript figures** go in `assets/img/` (see that folder's README).

---

## 7. Credits

Jordan Medicinal Plants Project — Faculty of Pharmacy, Al-Ahliyya Amman
University. Open Access · CC BY 4.0.
