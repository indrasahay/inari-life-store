# Inari Life storefront preview

This folder contains the storefront, separate product detail page, owner panel shortcut, 220 product records, and the supplied Inari Life wordmark and mnemonic. Product details are sourced from **Amazon_Listings 5th Nov.xlsx**. The seller SKU and numeric lead-in remain separate fields.

## Preview the site

1. Open `index.html` in a recent browser. If local scripts are blocked, open a terminal in this folder and run `python3 -m http.server 8000`, then visit `http://localhost:8000`.
2. Use the category chips, search, and Shop filters to browse. Product cards open a separate `product.html?sku=...` page. Purchase buttons open the exact Amazon listing supplied in the workbook.
3. The owner panel shortcut is `admin.html` (for a local server, `http://localhost:8000/admin.html`). This preview has no secure sign-in; use it locally only.

## Catalogue and images

- All 220 workbook SKUs were matched and imported, including the New Category value, Tag, MRP, Selling Price, percentage, and five feature fields.
- Product departments are derived from the workbook New Category value. Public product cards do not show the category label.
- Home collection rails use only products tagged in the workbook: Everyday favourites (11), New Launch (15), Best Sellers (9), In Focus (10), Deal of the Day (1), and Limited Time Deals (12). Rails show four cards at a time on desktop, with the rest available by horizontal scrolling.
- Price tabs show workbook MRP and Offer Price; the percentage bubble has no “discount” label. Confirm prices and Amazon offer details on the listing before launch.
- Six exact SKU-matched product photos are included. Products without a verified matching photo use the supplied Inari mnemonic (`media/inari-mark.jpg`), not an unrelated item image.
- Product rating and review data were not supplied in the workbook, so the site hides ratings until verified values are added.

## Responsive design updates

The header uses a compact category navigation, category tiles use varied illustrated shapes, and product collections have left/right arrow controls. Product cards use consistent heights, show crossed-out MRP, percentage off, and a logo-colored price tab, and link to a separate product page. Amazon buttons say **BUY NOW**; hovering or keyboard focusing them reveals the Amazon wordmark. The Deal of the Day uses a large, responsive product feature layout.

## Owner panel and data

The owner panel can edit products, preview content changes, export catalogue CSV, manage captured leads, and download or restore a JSON backup. Changes, leads, and click counts are saved in the current browser only. Do not collect real customer information in this preview. Amazon clicks are not orders or sales.

The public site has no secure admin authentication, shared database, server-side form protection, connected email service, or production backup service. Before publishing, connect these services and verify product photos, workbook details, supported Amazon offers, contact information, and policy text. The `.env.example` file contains placeholders only.

## Refreshing the workbook data

1. Export the workbook’s `Sheet1` as CSV.
2. In the owner panel, open **Products → Import workbook / CSV** and choose the CSV file.
3. Review each existing SKU prompt before confirming an update. The importer reads the new category, tag, prices, stock, Amazon URL, description, and Feature 1–5 columns.

The supplied policies are editable starter copy and need owner review before launch. To publish and connect `inarilife.com`, a hosting account, secure admin setup, and owner-approved DNS changes are still required.
