const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const products = [
  {
    name: "ZEENE Argan Hair Oil",
    price: 34.99,
    description: "100% pure Moroccan Argan oil for silky smooth hair. Deeply moisturizes and restores shine.",
    image_url: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&q=80&w=800",
    stock_quantity: 100,
    is_featured: true,
    is_active: true,
    rating: 4.8,
    review_count: 124
  },
  {
    name: "ZEENE Scalp Treatment Serum",
    price: 42.50,
    description: "Intensive scalp treatment to promote hair growth and thickness. Formulated with biotin and caffeine.",
    image_url: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?auto=format&fit=crop&q=80&w=800",
    stock_quantity: 50,
    is_featured: true,
    is_active: true,
    rating: 4.9,
    review_count: 89
  },
  {
    name: "ZEENE Jojoba Moisture Blend",
    price: 28.00,
    description: "Lightweight moisture blend featuring golden Jojoba oil. Perfect for daily hydration without weighing hair down.",
    image_url: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&q=80&w=800",
    stock_quantity: 150,
    is_featured: false,
    is_active: true,
    rating: 4.5,
    review_count: 56
  },
  {
    name: "ZEENE Rosemary Mint Growth Oil",
    price: 32.00,
    description: "Stimulating blend of rosemary and mint essential oils. Improves scalp circulation and follicle strength.",
    image_url: "https://images.unsplash.com/photo-1615397323602-9856f6c91e13?auto=format&fit=crop&q=80&w=800",
    stock_quantity: 75,
    is_featured: true,
    is_active: true,
    rating: 4.7,
    review_count: 210
  },
  {
    name: "ZEENE Overnight Repair Mask",
    price: 45.00,
    description: "Intensive overnight repair mask. Wake up to transformed, intensely nourished hair.",
    image_url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=800",
    stock_quantity: 40,
    is_featured: false,
    is_active: true,
    rating: 4.9,
    review_count: 67
  },
  {
    name: "ZEENE Castor Edge Control",
    price: 18.99,
    description: "Jamaican black castor oil edge control. Smooths edges while promoting hairline growth.",
    image_url: "https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&q=80&w=800",
    stock_quantity: 200,
    is_featured: false,
    is_active: true,
    rating: 4.3,
    review_count: 45
  },
  {
    name: "ZEENE Vitamin E Hair Gloss",
    price: 26.50,
    description: "Instant shine and protection with Vitamin E. Shields against environmental damage.",
    image_url: "https://images.unsplash.com/photo-1611079830811-865ff4428d17?auto=format&fit=crop&q=80&w=800",
    stock_quantity: 120,
    is_featured: false,
    is_active: true,
    rating: 4.6,
    review_count: 82
  },
  {
    name: "ZEENE Almond Detangling Spray",
    price: 22.00,
    description: "Sweet almond oil infused detangling spray. Makes combing a breeze while reducing breakage.",
    image_url: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=800",
    stock_quantity: 90,
    is_featured: true,
    is_active: true,
    rating: 4.8,
    review_count: 156
  },
  {
    name: "ZEENE Marula Hydration Oil",
    price: 38.00,
    description: "Luxury Marula oil for intense hydration and frizz control. Rich in antioxidants.",
    image_url: "https://images.unsplash.com/photo-1608282121334-3158c3f412de?auto=format&fit=crop&q=80&w=800",
    stock_quantity: 60,
    is_featured: true,
    is_active: true,
    rating: 5.0,
    review_count: 34
  },
  {
    name: "ZEENE Tea Tree Purifying Serum",
    price: 24.99,
    description: "Clarifying tea tree serum for flaky, itchy scalps. Soothes and purifies instantly.",
    image_url: "https://images.unsplash.com/photo-1629198688554-3e911244d2d4?auto=format&fit=crop&q=80&w=800",
    stock_quantity: 110,
    is_featured: false,
    is_active: true,
    rating: 4.4,
    review_count: 91
  },
  {
    name: "ZEENE Grapeseed Heat Protectant",
    price: 29.50,
    description: "Thermal protection oil. Defends hair against heat styling up to 450°F.",
    image_url: "https://images.unsplash.com/photo-1599305090598-fe179d501227?auto=format&fit=crop&q=80&w=800",
    stock_quantity: 85,
    is_featured: true,
    is_active: true,
    rating: 4.7,
    review_count: 142
  },
  {
    name: "ZEENE Macadamia Deep Conditioner",
    price: 36.00,
    description: "Rich macadamia nut oil conditioner. Restores elasticity and strength to damaged hair.",
    image_url: "https://images.unsplash.com/photo-1556228720-192b9b7e3e26?auto=format&fit=crop&q=80&w=800",
    stock_quantity: 70,
    is_featured: false,
    is_active: true,
    rating: 4.9,
    review_count: 115
  },
  {
    name: "ZEENE Avocado Split End Mender",
    price: 21.00,
    description: "Targeted treatment for split ends featuring avocado oil and keratin.",
    image_url: "https://images.unsplash.com/photo-1608248593883-7c30d939ccb8?auto=format&fit=crop&q=80&w=800",
    stock_quantity: 130,
    is_featured: false,
    is_active: true,
    rating: 4.5,
    review_count: 73
  },
  {
    name: "ZEENE Neem Anti-Dandruff Oil",
    price: 27.50,
    description: "Traditional neem oil blend. Naturally combats dandruff and dry scalp issues.",
    image_url: "https://images.unsplash.com/photo-1617897903206-25838561db3e?auto=format&fit=crop&q=80&w=800",
    stock_quantity: 95,
    is_featured: false,
    is_active: true,
    rating: 4.2,
    review_count: 48
  },
  {
    name: "ZEENE Hibiscus Color Protect",
    price: 33.00,
    description: "Color-protecting oil infused with hibiscus extract. Keeps color vibrant and hair soft.",
    image_url: "https://images.unsplash.com/photo-1556228722-1d5754025f19?auto=format&fit=crop&q=80&w=800",
    stock_quantity: 65,
    is_featured: true,
    is_active: true,
    rating: 4.6,
    review_count: 88
  },
  {
    name: "ZEENE Keratin Smoothing Drops",
    price: 41.00,
    description: "Concentrated keratin drops to smooth frizz and flyaways. Professional salon quality.",
    image_url: "https://images.unsplash.com/photo-1629198688402-9bc5053a47da?auto=format&fit=crop&q=80&w=800",
    stock_quantity: 45,
    is_featured: true,
    is_active: true,
    rating: 4.9,
    review_count: 201
  },
  {
    name: "ZEENE Baobab Revitalizing Elixir",
    price: 48.00,
    description: "The ultimate hair elixir with rare Baobab oil. Rejuvenates aging and brittle hair.",
    image_url: "https://images.unsplash.com/photo-1611078426034-7548d1eecbf3?auto=format&fit=crop&q=80&w=800",
    stock_quantity: 30,
    is_featured: true,
    is_active: true,
    rating: 5.0,
    review_count: 42
  },
  {
    name: "ZEENE Peppermint Cooling Tonic",
    price: 23.50,
    description: "Refreshing scalp tonic for post-workout or hot days. Invigorates and cleanses.",
    image_url: "https://images.unsplash.com/photo-1598440948480-1634b35520e5?auto=format&fit=crop&q=80&w=800",
    stock_quantity: 140,
    is_featured: false,
    is_active: true,
    rating: 4.4,
    review_count: 61
  },
  {
    name: "ZEENE Amla Strengthening Oil",
    price: 25.00,
    description: "Indian Gooseberry (Amla) oil to strengthen roots and prevent premature graying.",
    image_url: "https://images.unsplash.com/photo-1608282121379-3c99f36b6cb6?auto=format&fit=crop&q=80&w=800",
    stock_quantity: 115,
    is_featured: false,
    is_active: true,
    rating: 4.7,
    review_count: 134
  },
  {
    name: "ZEENE Signature Hair Perfume Oil",
    price: 55.00,
    description: "Luxurious hair fragrance and lightweight oil. Leaves a captivating scent trail.",
    image_url: "https://images.unsplash.com/photo-1599305090598-fe179d501227?auto=format&fit=crop&q=80&w=800",
    stock_quantity: 25,
    is_featured: true,
    is_active: true,
    rating: 4.8,
    review_count: 77
  }
];

async function seed() {
  console.log("Seeding 20 products to Supabase...");
  const { data, error } = await supabase.from('products').insert(products);
  
  if (error) {
    console.error("Error inserting products:", error);
  } else {
    console.log("Successfully inserted 20 products!");
  }
}

seed();
