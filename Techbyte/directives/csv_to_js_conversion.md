# CSV to JS Conversion Directive

## Goal
To convert product data from `public/products_export_1.csv` to `src/data/csvproducts.js` with consistent field mapping.

## Dependencies
- Python 3.x
- `csv` and `json` standard libraries

## Usage
Run the following command from the project root:
```bash
python execution/convert_csv_to_js.py
```

## Inputs
- `public/products_export_1.csv`: Source file from Shopify export.

## Outputs
- `src/data/csvproducts.js`: Generated JavaScript file export `csvProducts` constant.

## Mapping details
- Handle -> id
- Title -> name
- Vendor -> vendor
- Product Category -> category
- Tags -> tags
- Published -> published (boolean)
- Variant SKU -> sku
- Variant Inventory Qty -> inStock (int)
- Variant Price -> price (float)
- Image Src -> image
- Image Position -> imagePosition (int)
- Brand -> brand
- Color -> color
- InBox -> inBox
- Model -> model
- Region -> region
- Sim -> sim
- Storage -> storage
- Warranty -> warranty
- Status -> status
