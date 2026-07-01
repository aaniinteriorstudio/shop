# Creative Chairs Website

Static WhatsApp-enquiry catalog site. No backend, no cart, no payment.

## Files

```
index.html       ← the whole site (one page, client-side routing)
style.css        ← design system (tokens, components, layout)
script.js        ← catalog logic (filter, search, modal, wa.me links)
products.json    ← single source of truth for all 62 products / 7 categories
images/          ← drop real product photos here (see naming below)
```

## Deploy to GitHub Pages (5 minutes)

```bash
# 1. Create repo on github.com (e.g. creative-chairs-website)
git init
git add .
git commit -m "Creative Chairs website — initial build"
git remote add origin https://github.com/moshoaib21/creative-chairs-website.git
git push -u origin main

# 2. On GitHub: Settings → Pages → Source: main / root → Save
# Live at: https://moshoaib21.github.io/creative-chairs-website/
```

## Adding Real Product Photos

Each product in `products.json` has an `images` field like:
```json
"images": ["images/aura-full-leather-1.jpg"]
```

1. Name your photo files to match exactly (the product `id` field + `-1.jpg`, `-2.jpg`, etc.)
2. Drop them in the `/images/` folder
3. The site picks them up automatically — no code changes needed

The `id` for each product is in `products.json` (e.g. `aura-full-leather`, `cosmo`, `alpha`, etc.)

To show the real photo in the card and modal instead of the placeholder icon,
update `script.js` — find `chairSVG(tint)` in the card and modal render functions
and replace with:
```js
`<img src="${p.images[0]}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;">`
```

## Updating Products / Prices

Edit `products.json` directly — no code changes needed. Fields:

| Field | Effect |
|---|---|
| `price` | Starting price shown on swing-tag and modal |
| `priceVariants` | Other back-type / variant prices shown in modal |
| `colors` | Color swatches shown in modal |
| `bulkThreshold` | Qty above which CTA switches to "Get Bulk Pricing" (default: 5) |
| `specs` | Spec bullet list in modal |

## WhatsApp Number

Set once in `products.json`:
```json
"whatsappNumber": "919867863763"
```

Change it there and every single CTA link on the site updates automatically.

## What the WhatsApp messages look like

**Regular order (qty < 5):**
> Hi, I'm interested in the AURA FULL LEATHER (Qty: 2, Color: TAN). Please share pricing & availability.

**Bulk enquiry (qty ≥ 5):**
> Hi, I'm interested in bulk pricing for the AURA FULL LEATHER (Qty: 8, Color: BLACK). Please share wholesale pricing & availability.
