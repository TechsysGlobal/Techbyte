import csv
import json
import os

def convert_csv_to_js(csv_file_path, js_file_path):
    # Mapping CSV headers to JS keys
    mapping = {
        'Handle': 'id',
        'Title': 'name',
        'Vendor': 'vendor',
        'Product Category': 'category',
        'Tags': 'tags',
        'Published': 'published',
        'Variant SKU': 'sku',
        'Variant Inventory Qty': 'inStock',
        'Variant Price': 'price',
        'Image Src': 'image',
        'Image Position': 'imagePosition',
        'Brand (product.metafields.custom.brand)': 'brand',
        'Color (product.metafields.custom.color)': 'color',
        'InBox (product.metafields.custom.inbox)': 'inBox',
        'Model (product.metafields.custom.model)': 'model',
        'Region (product.metafields.custom.region)': 'region',
        'Sim (product.metafields.custom.sim)': 'sim',
        'Storage (product.metafields.custom.storage)': 'storage',
        'Warranty (product.metafields.custom.warranty)': 'warranty',
        'Status': 'status'
    }

    products = []
    
    if not os.path.exists(csv_file_path):
        print(f"Error: {csv_file_path} not found.")
        return

    with open(csv_file_path, mode='r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            product = {}
            for csv_header, js_key in mapping.items():
                val = row.get(csv_header, "")
                
                # Basic type conversions
                if js_key == 'price':
                    try:
                        val = float(val) if val else 0.0
                    except:
                        val = 0.0
                elif js_key == 'inStock':
                    try:
                        val = int(val) if val else 0
                    except:
                        val = 0
                elif js_key == 'published':
                    val = val.lower() == 'true'
                elif js_key == 'imagePosition':
                    try:
                        val = int(val) if val else 1
                    except:
                        val = 1
                
                product[js_key] = val
            products.append(product)

    # Wrap in JS export
    js_content = f"export const csvProducts = {json.dumps(products, indent=4)};\n"
    
    os.makedirs(os.path.dirname(js_file_path), exist_ok=True)
    with open(js_file_path, mode='w', encoding='utf-8') as jsfile:
        jsfile.write(js_content)
    
    print(f"Successfully converted {len(products)} products to {js_file_path}")

if __name__ == "__main__":
    # Use absolute paths or handle relative to script/cwd
    # Since I'm running from project root, relative paths should work
    csv_path = "public/products_export_1.csv"
    js_path = "src/data/csvproducts.js"
    convert_csv_to_js(csv_path, js_path)
