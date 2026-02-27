
/**
 * @fileOverview Refined artisan product data for the Kalamic catalog.
 * This file serves as the source of truth for the baseline collection.
 */

export const products = [
  {
    "_id": "699026a8ae873e1fa69cb18a",
    "name": "Mor Stambh Ceramic Customized Pillar",
    "slug": "mor_stambh",
    "short_description": "Handmade traditional ceramic pillar for temple and home decor.",
    "description": "Bahut sundar handmade ceramic pillar jo Bhagwan ke Jhula ke liye perfect hai. Traditional Indian cultural designs ke saath. Religious occasions jaise Diwali, Navratri ya ghar ke mandir decor ke liye best choice.",
    "category_id": "699026a7ae873e1fa69cb187",
    "tags": ["decor", "pillar", "handmade", "ceramic", "temple"],
    "images": [
      { "url": "https://i.imgur.com/wqfAvmq.png", "alt": "Mor Stambh Front View", "is_primary": true },
      { "url": "https://i.imgur.com/imOtW3n.png", "alt": "Side View", "is_primary": false }
    ],
    "price": 1499,
    "compare_at_price": 1999,
    "currency": "INR",
    "stock": 5,
    "sku": "MS-001",
    "is_active": true,
    "is_featured": true,
    "visibility_priority": 1,
    "specifications": [
      { "key": "Material", "value": "Ceramic" },
      { "key": "Finish", "value": "Hand-painted" },
      { "key": "Color", "value": "Brown & Grey" },
      { "key": "Usage", "value": "Temple Decor / Home Decor" }
    ],
    "shipping": {
      "weight_kg": 1.2,
      "package_dimensions_cm": { "length": 40, "width": 20, "height": 20 }
    },
    "seo": {
      "meta_title": "Mor Stambh Ceramic Pillar – Handmade Temple Decor",
      "meta_description": "Buy handmade ceramic Mor Stambh pillar for temple and festive decor.",
      "meta_keywords": ["mor stambh", "ceramic pillar", "temple decor"]
    }
  },
  {
    "_id": "699026a8ae873e1fa69cb18b",
    "name": "Handmade Ceramic Mirror",
    "slug": "ceramic_mirror",
    "short_description": "Exquisite hand-molded mirror frame with traditional patterns.",
    "description": "Add a touch of elegance to your walls with this handmade ceramic mirror. Each piece is unique and painted by master artisans.",
    "category_id": "699026a7ae873e1fa69cb188",
    "tags": ["decor", "mirror", "handmade", "wall-art"],
    "images": [
      { "url": "https://i.imgur.com/CjkQ8p3.png", "alt": "Ceramic Mirror", "is_primary": true }
    ],
    "price": 2499,
    "compare_at_price": 2999,
    "currency": "INR",
    "stock": 3,
    "sku": "CM-002",
    "is_active": true,
    "is_featured": true,
    "visibility_priority": 2,
    "specifications": [
      { "key": "Material", "value": "Ceramic & Glass" },
      { "key": "Dimensions", "value": "12x12 inches" }
    ],
    "shipping": {
      "weight_kg": 2.5,
      "package_dimensions_cm": { "length": 35, "width": 35, "height": 10 }
    },
    "seo": {
      "meta_title": "Artisan Ceramic Mirror – Wall Decor",
      "meta_description": "Beautiful handmade ceramic mirror frame for modern homes.",
      "meta_keywords": ["ceramic mirror", "wall decor", "handcrafted"]
    }
  },
  {
    "_id": "699026a8ae873e1fa69cb18e",
    "name": "Handmade Ceramic Mandala Wheel",
    "slug": "mandala_wheel",
    "short_description": "Traditional Mandala art captured in a ceramic wheel.",
    "description": "A symbol of universe and harmony. This Mandala wheel is meticulously carved and glazed at high temperatures.",
    "category_id": "699026a7ae873e1fa69cb187",
    "tags": ["mandala", "spiritual", "wall-decor", "ceramic"],
    "images": [
      { "url": "https://i.imgur.com/wqfAvmq.png", "alt": "Mandala Wheel", "is_primary": true }
    ],
    "price": 3999,
    "compare_at_price": 4500,
    "currency": "INR",
    "stock": 2,
    "sku": "MW-005",
    "is_active": true,
    "is_featured": true,
    "visibility_priority": 5,
    "specifications": [
      { "key": "Art Style", "value": "Mandala" },
      { "key": "Diameter", "value": "10 inches" }
    ],
    "shipping": {
      "weight_kg": 1.8,
      "package_dimensions_cm": { "length": 30, "width": 30, "height": 15 }
    },
    "seo": {
      "meta_title": "Ceramic Mandala Wheel – Spiritual Art",
      "meta_description": "Handcrafted Mandala wheel for spiritual and aesthetic wall decor.",
      "meta_keywords": ["mandala art", "ceramic wheel", "spiritual decor"]
    }
  }
];
