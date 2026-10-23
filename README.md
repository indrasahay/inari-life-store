# INARI LIFE catalogue website

A static product catalogue (54 products imported from the Phase 1 workbook) hosted free on GitHub Pages and edited through Pages CMS. No paid website builder or hosting. Your only cost is a domain name, if you want your own.

**What it does**

- Responsive catalogue with product search, category filters, sorting and a page for every product
- MRP (crossed out), Selling Price and an automatic "% off" label
- Buy Now opens the product's Amazon page in a new tab. It only appears for **Active** products that have a valid Amazon Product URL
- Everything is edited in the CMS: name, SKU, category, prices, descriptions, features, specifications, images, video, Amazon URL, featured flag, status and SEO fields

## How Status works

| Status | On the website | Buy Now |
|---|---|---|
| **Active** | Listed and has a product page | Shown if an Amazon URL is set, hidden if blank |
| **Coming Soon** | Listed with a "Coming soon" label | Never shown |
| **Draft** | Not published at all | n/a |
| **Archived** | Not published at all | n/a |

All 54 imported products start as **Coming Soon** with no Amazon URL, so nothing is presented as buyable until you switch it on.

## One-time setup (about 20 minutes)

### 1. Create the repository
1. Create a free account at github.com if you do not have one.
2. Click **New repository**. Name it `inari-life-catalogue` (or any name) and set it to **Public**. GitHub Pages on a free account needs a public repository (see "Privacy" below).
3. Upload everything from this folder to the repository's `main` branch. Easiest ways:
   - **GitHub Desktop** (desktop.github.com): add the folder as a repository and publish it. This keeps hidden folders intact.
   - Or the website: **Add file, Upload files**, drag the contents in.
4. Check that these two hidden items arrived. If either is missing, create it with **Add file, Create new file** and paste in the contents:
   - `.pages.yml` (CMS configuration)
   - `.github/workflows/deploy.yml` (builds and publishes the site)

### 2. Turn on GitHub Pages
In the repository, go to **Settings, Pages**. Under **Build and deployment, Source**, choose **GitHub Actions**.

### 3. Publish
Open the **Actions** tab. The "Build and deploy site" run starts after each upload (if it has not, click it and choose **Run workflow**). When it shows a green tick, your site is live at:

`https://YOUR-GITHUB-USERNAME.github.io/inari-life-catalogue/`

If the run fails, open it and read the red step. Build errors name the product file and the problem.

### 4. Connect Pages CMS
1. Go to **app.pagescms.org** and sign in with GitHub.
2. Install the Pages CMS GitHub App on your account when asked, and allow access to this repository.
3. Open the repository. You will see **Products** and **Site settings** in the sidebar.

Every save in the CMS commits to GitHub and the site rebuilds automatically. Allow 1 to 2 minutes for changes to appear.

## Everyday tasks

**Make a product buyable:** open the product in the CMS, paste the full Amazon link into **Amazon Product URL**, set **Status** to **Active**, save. To hide Buy Now again, clear the URL.

**Add images:** open a product, upload the **Main image** and any **Gallery images**. Use square images (at least 800 x 800 px) so cards look consistent. Products without an image show a neutral placeholder.

**Feature products on the homepage:** switch on **Featured on homepage** (up to 8 are shown).

**Add a product:** Products, **Add an entry**. Fill in name, SKU, category, status and prices. The URL slug can be left blank.

**Change brand colours or logo:** Site settings. Enter two hex colours and upload a logo when the final identity is ready. The site restyles itself, no code changes.

**Use your own domain:** buy the domain, then in GitHub go to **Settings, Pages, Custom domain** and follow the DNS steps shown there. The site picks up the new address on its next build.

## Things to know

- **Prices:** the site shows exactly what is in the CMS. The Amazon page price is what the customer pays, so keep the two in step.
- **SKU is hidden from visitors** by default. Turn on **Show SKU on product pages** in Site settings if you want it public.
- **Privacy:** on a free GitHub account the repository is public, so anyone can read the files in it, including SKU and the internal **Supplier title** field. The supplier website links from the workbook were not imported. Keep supplier details out of the CMS.
- **Adding a new category:** add its name to the category list in `.pages.yml`. It then appears on the site automatically.
- **Amazon links** must be `https` links on amazon.in, amazon.com, amzn.in, amzn.to or a.co. Anything else is rejected by the CMS, and the build also hides Buy Now for an invalid link.
- **Rich description:** the Full description box accepts formatted text. Only people you invite to the repository can edit it.

## Preview on your computer (optional)

Requires Node.js 20 or later.

```
npm install
npm run preview
```

Then open http://localhost:8080

## Files

| Path | Purpose |
|---|---|
| `.pages.yml` | CMS configuration (fields, statuses, media) |
| `content/products/` | One file per product (54) |
| `content/settings/site.json` | Brand name, colours, logo, homepage text |
| `media/` | Uploaded images |
| `build.mjs` | Builds the website from the content |
| `static/` | Stylesheet and script |
| `.github/workflows/deploy.yml` | Automatic build and publish |
