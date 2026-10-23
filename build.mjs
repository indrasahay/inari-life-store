// INARI LIFE catalogue builder. Reads content/ and writes the static site to dist/.
// Run by GitHub Actions on every change (see .github/workflows/deploy.yml). Locally: npm run build
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';

const DIST = 'dist';
const STATUSES = ['Draft', 'Coming Soon', 'Active', 'Archived'];
const PUBLISHED = ['Active', 'Coming Soon']; // Draft and Archived are never published
const CATEGORY_ORDER = ['Home Organisation & Storage', 'Kitchen & Dining', 'Everyday Gadgets', 'Travel & Outdoors', 'Cleaning & Household Essentials', 'Toys', 'Car Accessories'];
const AMAZON_HOST = /(^|\.)(amazon\.(in|com)|amzn\.(in|to|com)|a\.co)$/i;
const HEX = /^#[0-9a-f]{6}$/i;

const warnings = [];
const errors = [];
const warn = (m) => warnings.push(m);

// ---------- settings ----------
const defaults = { brand_name: 'INARI LIFE', hero_title: '', hero_text: '', meta_description: '', logo: '', primary_color: '#0f5c55', accent_color: '#c8401d', show_sku: false, contact_email: '', footer_text: '', site_url: '' };
const S = { ...defaults, ...JSON.parse(fs.readFileSync('content/settings/site.json', 'utf8')) };
if (!HEX.test(S.primary_color)) { warn('primary_color is not a #RRGGBB value; using default'); S.primary_color = defaults.primary_color; }
if (!HEX.test(S.accent_color)) { warn('accent_color is not a #RRGGBB value; using default'); S.accent_color = defaults.accent_color; }

const siteUrl = (process.env.SITE_URL || S.site_url || '').replace(/\/+$/, '');
const base = siteUrl ? new URL(siteUrl).pathname.replace(/\/+$/, '') : '';
const url = (p = '') => `${base}/${String(p).replace(/^\/+/, '')}`;
const mediaUrl = (p) => (!p ? '' : /^(https?:)?\/\//.test(p) ? p : url(p));
const origin = siteUrl ? new URL(siteUrl).origin : '';
const absUrl = (p) => (origin ? origin + url(p) : '');

// ---------- helpers ----------
const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slugify = (s) => String(s).toLowerCase().replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const num = (v) => (v === '' || v == null || Number.isNaN(Number(v)) ? null : Number(v));
const money = (n) => '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 });
const list = (v) => (Array.isArray(v) ? v.filter((x) => x !== '' && x != null) : []);

function youtubeId(u) {
  const m = String(u).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/))([\w-]{11})/);
  return m ? m[1] : null;
}

// ---------- products ----------
const files = fs.readdirSync('content/products').filter((f) => f.endsWith('.md'));
const loaded = files.map((f) => {
  const { data: d, content } = matter(fs.readFileSync(path.join('content/products', f), 'utf8'));
  const slug = String(d.slug || f.replace(/\.md$/, '')).trim();
  let status = d.status;
  if (!STATUSES.includes(status)) { warn(`${f}: unknown status "${status}"; treated as Draft (not published)`); status = 'Draft'; }
  let amazon = String(d.amazon_url || '').trim();
  if (amazon) {
    let ok = false;
    try { const u = new URL(amazon); ok = u.protocol === 'https:' && AMAZON_HOST.test(u.hostname); } catch { /* invalid */ }
    if (!ok) { warn(`${f}: Amazon Product URL is not a valid https Amazon link; Buy Now hidden`); amazon = ''; }
  }
  const mrp = num(d.mrp), sp = num(d.selling_price);
  if (mrp != null && sp != null && sp > mrp) warn(`${f}: Selling Price is higher than MRP`);
  return {
    file: f, slug, status, amazon,
    name: String(d.name || '').trim(), sku: String(d.sku ?? '').trim(),
    category: String(d.category || '').trim(), subcategory: String(d.subcategory || '').trim(),
    mrp, sp, featured: d.featured === true,
    image: d.image || '', gallery: list(d.gallery), video: String(d.video_url || '').trim(),
    short: String(d.short_description || '').trim(), features: list(d.features),
    specs: list(d.specifications).filter((s) => s && s.label && s.value),
    html: content.trim() ? marked.parse(content.trim()) : '',
    seoTitle: String(d.seo_title || '').trim(), seoDesc: String(d.seo_description || '').trim(),
  };
});

const products = loaded.filter((p) => PUBLISHED.includes(p.status));
const seen = new Map();
for (const p of products) {
  if (!p.name) errors.push(`${p.file}: Product name is missing`);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.slug)) errors.push(`${p.file}: URL slug "${p.slug}" must be lowercase letters, numbers and hyphens`);
  if (seen.has(p.slug)) errors.push(`Duplicate URL slug "${p.slug}" in ${seen.get(p.slug)} and ${p.file}`);
  seen.set(p.slug, p.file);
}
if (errors.length) { console.error('\nBUILD STOPPED:\n- ' + errors.join('\n- ')); process.exit(1); }

products.sort((a, b) => Number(b.featured) - Number(a.featured) || a.name.localeCompare(b.name));
const catNames = [...new Set(products.map((p) => p.category).filter(Boolean))].sort((a, b) => {
  const ia = CATEGORY_ORDER.indexOf(a), ib = CATEGORY_ORDER.indexOf(b);
  return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
});
const cats = catNames.map((name) => ({ name, slug: slugify(name), count: products.filter((p) => p.category === name).length }));
const catSlug = (p) => slugify(p.category);
const canBuy = (p) => p.status === 'Active' && !!p.amazon;
const discount = (p) => (p.mrp && p.sp && p.sp < p.mrp ? Math.round(((p.mrp - p.sp) / p.mrp) * 100) : 0);

// ---------- templates ----------
const logo = S.logo
  ? `<img src="${esc(mediaUrl(S.logo))}" alt="${esc(S.brand_name)}" class="brand-img">`
  : `<span class="brand-text">${esc(S.brand_name)}</span>`;

function layout({ title, desc, path: pagePath, body, image, jsonld, noindex, noSearch }) {
  const canonical = absUrl(pagePath);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc || S.meta_description)}">
${noindex ? '<meta name="robots" content="noindex">' : ''}
${canonical ? `<link rel="canonical" href="${esc(canonical)}">` : ''}
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc || S.meta_description)}">
<meta property="og:type" content="website">
${canonical ? `<meta property="og:url" content="${esc(canonical)}">` : ''}
${image && siteUrl ? `<meta property="og:image" content="${esc(/^https?:/.test(image) ? image : absUrl(image))}">` : ''}
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=Figtree:wght@400;500;600&display=swap">
<link rel="stylesheet" href="${url('static/css/site.css')}">
<style>:root{--primary:${S.primary_color};--accent:${S.accent_color}}</style>
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, '\\u003c')}</script>` : ''}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap bar">
    <a class="brand" href="${url()}" aria-label="${esc(S.brand_name)} home">${logo}</a>
    <nav class="nav" aria-label="Main"><a href="${url()}">Home</a><a href="${url('products/')}">Catalogue</a></nav>
    ${noSearch ? '' : `<form class="hsearch" action="${url('products/')}" method="get" role="search">
      <label class="sr" for="hq">Search products</label>
      <input id="hq" name="q" type="search" placeholder="Search products">
    </form>`}
  </div>
</header>
<main id="main">
${body}
</main>
<footer class="site-footer">
  <div class="wrap">
    <p class="foot-brand">${esc(S.brand_name)}</p>
    ${S.footer_text ? `<p>${esc(S.footer_text)}</p>` : ''}
    ${S.contact_email ? `<p><a href="mailto:${esc(S.contact_email)}">${esc(S.contact_email)}</a></p>` : ''}
  </div>
</footer>
<script src="${url('static/js/site.js')}" defer></script>
</body>
</html>`;
}

const placeholder = (p) => `<div class="ph" role="img" aria-label="Image coming soon"><svg viewBox="0 0 48 48" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M8 16 24 8l16 8v16L24 40 8 32z"/><path d="M8 16l16 8 16-8M24 24v16"/></svg><span>${esc(p.category || '')}</span></div>`;

function priceHtml(p, big = false) {
  if (p.sp == null && p.mrp == null) return '';
  const main = p.sp ?? p.mrp;
  const showMrp = p.mrp != null && p.sp != null && p.mrp !== p.sp;
  const d = discount(p);
  return `<div class="price${big ? ' price-lg' : ''}"><span class="sp"><span class="sr">Selling price </span>${money(main)}</span>${showMrp ? `<span class="mrp"><span class="sr">MRP </span><s>${money(p.mrp)}</s></span>` : ''}${d ? `<span class="off">${d}% off</span>` : ''}</div>`;
}

function card(p, i) {
  const search = [p.name, p.category, p.subcategory, p.short, S.show_sku ? p.sku : ''].join(' ').toLowerCase();
  return `<li class="card" data-name="${esc(p.name.toLowerCase())}" data-cat="${catSlug(p)}" data-price="${p.sp ?? p.mrp ?? 0}" data-i="${i}" data-search="${esc(search)}">
  <a href="${url(`products/${p.slug}/`)}">
    <div class="thumb">${p.image ? `<img src="${esc(mediaUrl(p.image))}" alt="${esc(p.name)}" loading="lazy">` : placeholder(p)}${p.status === 'Coming Soon' ? '<span class="badge">Coming soon</span>' : ''}</div>
    <div class="info"><p class="cat">${esc(p.category)}</p><h3>${esc(p.name)}</h3>${priceHtml(p)}</div>
  </a>
</li>`;
}

function homePage() {
  const featured = products.filter((p) => p.featured).slice(0, 8);
  const body = `
<section class="hero"><div class="wrap">
  <h1>${esc(S.hero_title || S.brand_name)}</h1>
  ${S.hero_text ? `<p>${esc(S.hero_text)}</p>` : ''}
  <a class="btn" href="${url('products/')}">Browse the catalogue</a>
</div></section>
<section class="wrap block"><h2>Shop by category</h2>
  <ul class="cats">${cats.map((c) => `<li><a href="${url(`products/?category=${c.slug}`)}"><strong>${esc(c.name)}</strong><span>${c.count} product${c.count === 1 ? '' : 's'}</span></a></li>`).join('')}</ul>
</section>
${featured.length ? `<section class="wrap block"><h2>Featured</h2><ul class="grid">${featured.map((p, i) => card(p, i)).join('')}</ul></section>` : ''}`;
  return layout({ title: `${S.brand_name} | Product catalogue`, desc: S.meta_description, path: '', body });
}

function cataloguePage() {
  const body = `
<div class="wrap block">
  <h1>Catalogue</h1>
  <div class="tools">
    <div class="field"><label for="q">Search</label><input id="q" type="search" placeholder="Name or keyword" autocomplete="off"></div>
    <div class="field"><label for="sort">Sort by</label>
      <select id="sort"><option value="recommended">Recommended</option><option value="name">Name A–Z</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></div>
  </div>
  <div class="chips" role="group" aria-label="Filter by category">
    <button class="chip" data-cat="" aria-pressed="true">All</button>
    ${cats.map((c) => `<button class="chip" data-cat="${c.slug}" aria-pressed="false">${esc(c.name)}</button>`).join('')}
  </div>
  <p class="count" id="count" aria-live="polite">${products.length} products</p>
  <ul class="grid" id="grid">${products.map(card).join('')}</ul>
  <p class="empty" id="empty" hidden>No products match your search. Try a different word or clear the category filter.</p>
</div>`;
  return layout({ title: `Catalogue | ${S.brand_name}`, desc: S.meta_description, path: 'products/', body, noSearch: true });
}

function productPage(p) {
  const imgs = [p.image, ...p.gallery].filter(Boolean);
  const gallery = imgs.length
    ? `<div class="hero-img"><img id="hero" src="${esc(mediaUrl(imgs[0]))}" alt="${esc(p.name)}"></div>${imgs.length > 1 ? `<div class="thumbs">${imgs.map((src, i) => `<button type="button" data-thumb="${esc(mediaUrl(src))}" aria-label="Show image ${i + 1}"><img src="${esc(mediaUrl(src))}" alt=""></button>`).join('')}</div>` : ''}`
    : `<div class="hero-img">${placeholder(p)}</div>`;
  const yt = p.video ? youtubeId(p.video) : null;
  const video = p.video
    ? yt
      ? `<section class="sec"><h2>Video</h2><div class="video"><iframe src="https://www.youtube-nocookie.com/embed/${yt}" title="${esc(p.name)} video" loading="lazy" allowfullscreen></iframe></div></section>`
      : `<p><a href="${esc(p.video)}" target="_blank" rel="noopener noreferrer">Watch the product video (opens in a new tab)</a></p>`
    : '';
  const buy = canBuy(p)
    ? `<div class="buy"><a class="btn btn-buy" href="${esc(p.amazon)}" target="_blank" rel="noopener noreferrer">Buy Now</a><p class="note">Opens this product on Amazon in a new tab. Final price and availability are shown on Amazon.</p></div>`
    : p.status === 'Coming Soon' ? '<p class="soon">Coming soon. This product is not available to buy yet.</p>' : '';
  const related = products.filter((x) => x.category === p.category && x !== p).slice(0, 4);
  const jsonld = p.status === 'Active' ? {
    '@context': 'https://schema.org', '@type': 'Product', name: p.name,
    ...(p.short ? { description: p.short } : {}), brand: { '@type': 'Brand', name: S.brand_name },
    ...(imgs.length ? { image: imgs.map((i) => absUrl(i) && !/^https?:/.test(i) ? absUrl(i) : i) } : {}),
    ...(S.show_sku && p.sku ? { sku: p.sku } : {}),
    ...(p.sp != null && canBuy(p) ? { offers: { '@type': 'Offer', priceCurrency: 'INR', price: p.sp, url: p.amazon } } : {}),
  } : null;
  const body = `
<div class="wrap block">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="${url()}">Home</a><span>/</span><a href="${url('products/')}">Catalogue</a><span>/</span><a href="${url(`products/?category=${catSlug(p)}`)}">${esc(p.category)}</a></nav>
  <div class="detail">
    <div class="gallery">${gallery}</div>
    <div class="summary">
      <p class="cat">${esc(p.category)}${p.subcategory ? ' · ' + esc(p.subcategory) : ''}</p>
      <h1>${esc(p.name)}</h1>
      ${p.status === 'Coming Soon' ? '<span class="badge badge-inline">Coming soon</span>' : ''}
      ${priceHtml(p, true)}
      ${p.short ? `<p class="lead">${esc(p.short)}</p>` : ''}
      ${buy}
      ${S.show_sku && p.sku ? `<p class="meta">SKU: ${esc(p.sku)}</p>` : ''}
    </div>
  </div>
  ${p.features.length ? `<section class="sec"><h2>Key features</h2><ul class="features">${p.features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul></section>` : ''}
  ${p.html ? `<section class="sec prose"><h2>Description</h2>${p.html}</section>` : ''}
  ${p.specs.length ? `<section class="sec"><h2>Specifications</h2><table class="specs"><tbody>${p.specs.map((s) => `<tr><th scope="row">${esc(s.label)}</th><td>${esc(s.value)}</td></tr>`).join('')}</tbody></table></section>` : ''}
  ${video}
  ${related.length ? `<section class="sec"><h2>More in ${esc(p.category)}</h2><ul class="grid">${related.map(card).join('')}</ul></section>` : ''}
</div>`;
  const title = p.seoTitle || `${p.name} | ${S.brand_name}`;
  const desc = p.seoDesc || p.short || `${p.name} from ${S.brand_name}.`;
  return layout({ title, desc, path: `products/${p.slug}/`, body, image: imgs[0] || '', jsonld });
}

// ---------- write ----------
fs.rmSync(DIST, { recursive: true, force: true });
const write = (rel, content) => { const f = path.join(DIST, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, content); };
write('index.html', homePage());
write('products/index.html', cataloguePage());
for (const p of products) write(`products/${p.slug}/index.html`, productPage(p));
write('404.html', layout({ title: `Page not found | ${S.brand_name}`, body: `<div class="wrap block"><h1>Page not found</h1><p>That page does not exist. <a href="${url('products/')}">Browse the catalogue</a>.</p></div>`, noindex: true }));
fs.cpSync('static', path.join(DIST, 'static'), { recursive: true });
if (fs.existsSync('media')) fs.cpSync('media', path.join(DIST, 'media'), { recursive: true });
if (siteUrl) {
  const urls = ['', 'products/', ...products.map((p) => `products/${p.slug}/`)];
  write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `<url><loc>${origin}${url(u)}</loc></url>`).join('\n')}\n</urlset>\n`);
  write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${origin}${url('sitemap.xml')}\n`);
}

const by = (s) => loaded.filter((p) => p.status === s).length;
console.log(`Built ${products.length} product pages (Active ${by('Active')}, Coming Soon ${by('Coming Soon')}); not published: Draft ${by('Draft')}, Archived ${by('Archived')}`);
console.log(`Buy Now visible on ${products.filter(canBuy).length} products; base path "${base || '/'}"`);
if (warnings.length) console.warn('\nWarnings:\n- ' + warnings.join('\n- '));
