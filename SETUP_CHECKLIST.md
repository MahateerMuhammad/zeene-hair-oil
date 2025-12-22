# ✅ E-Commerce Setup Checklist

## 🚀 Quick Start (Follow in Order)

### Step 1: Database Migration
- [ ] Open Supabase Dashboard
- [ ] Go to SQL Editor
- [ ] Copy contents of `/scripts/ecommerce-enhancement.sql`
- [ ] Execute the script
- [ ] Verify tables created (categories, product_reviews, wishlists, etc.)

### Step 2: Add Categories
Run this in Supabase SQL Editor:

```sql
-- Verify categories were created
SELECT * FROM categories;

-- If empty, they should have been inserted. If not, run:
INSERT INTO categories (name, slug, description, display_order) VALUES
  ('Hair Care', 'hair-care', 'Hair oils, shampoos, conditioners and treatments', 1),
  ('Skin Care', 'skin-care', 'Natural skincare products for all skin types', 2),
  ('Body Care', 'body-care', 'Body oils, lotions and wellness products', 3),
  ('Wellness', 'wellness', 'Health and wellness supplements', 4),
  ('Gift Sets', 'gift-sets', 'Curated gift sets for every occasion', 5)
ON CONFLICT (slug) DO NOTHING;
```

### Step 3: Update Existing Products
Add categories and stock to your existing products:

```sql
-- Check current products
SELECT id, name, category_id, stock_quantity FROM products;

-- Example: Update your hair oil product
UPDATE products 
SET 
  category_id = (SELECT id FROM categories WHERE slug = 'hair-care'),
  stock_quantity = 100,
  sku = 'ZEENE-HAIROIL-001',
  is_featured = TRUE
WHERE name ILIKE '%hair oil%';

-- Update all products with default stock if null
UPDATE products 
SET stock_quantity = 50 
WHERE stock_quantity IS NULL;
```

### Step 4: Test New Features

#### Test Categories Filter
- [ ] Go to `/products`
- [ ] See category filter on left (desktop) or filter button (mobile)
- [ ] Click different categories
- [ ] Verify products filter correctly

#### Test Reviews
- [ ] Go to any product detail page
- [ ] Click "Reviews" tab
- [ ] Click "Write a Review"
- [ ] Submit a test review
- [ ] Check review in database (unapproved)
- [ ] Approve it manually:
```sql
UPDATE product_reviews SET is_approved = TRUE;
```
- [ ] Refresh page, see review appear

#### Test Wishlist
- [ ] Login to an account
- [ ] Click heart icon on any product
- [ ] Go to `/profile`
- [ ] Click "Wishlist" tab
- [ ] See product in wishlist

#### Test Profile
- [ ] Login to an account
- [ ] Go to `/profile`
- [ ] Check all tabs work:
  - [ ] Orders tab
  - [ ] Wishlist tab
  - [ ] Addresses tab
  - [ ] Profile tab

### Step 5: Verify Stock Management
- [ ] Set a product stock to 0
```sql
UPDATE products SET stock_quantity = 0 WHERE id = 'some-product-id';
```
- [ ] Go to product page
- [ ] Verify "Out of Stock" badge shows
- [ ] Verify "Add to Cart" is disabled

- [ ] Set stock to 3 (low stock)
```sql
UPDATE products SET stock_quantity = 3 WHERE id = 'some-product-id';
```
- [ ] Verify "Only 3 left!" badge shows

### Step 6: Admin Access
- [ ] Login as admin
- [ ] Go to `/admin`
- [ ] Verify you can:
  - [ ] See orders
  - [ ] Approve/reject orders
  - [ ] Add new products
  - [ ] Edit products
  - [ ] Delete products

---

## 🎯 Post-Setup Tasks

### Add More Products
1. Go to `/admin`
2. Click "Add Product"
3. Fill in all details:
   - Name
   - Price
   - Description
   - **Category** (select from dropdown)
   - **Stock Quantity**
   - SKU (optional)
   - Sale price (optional)
   - Upload images
4. Click "Add Product"

### Customize Categories
Add your own categories:

```sql
INSERT INTO categories (name, slug, description, display_order, image_url)
VALUES 
  ('Category Name', 'category-slug', 'Description here', 6, 'https://your-image-url.com/image.jpg');
```

### Set Featured Products
Highlight products on homepage:

```sql
UPDATE products 
SET is_featured = TRUE 
WHERE id IN ('product-id-1', 'product-id-2', 'product-id-3');
```

### Moderate Reviews
Check pending reviews:

```sql
-- See unapproved reviews
SELECT * FROM product_reviews WHERE is_approved = FALSE;

-- Approve a review
UPDATE product_reviews SET is_approved = TRUE WHERE id = 'review-id';

-- Reject (delete) a review
DELETE FROM product_reviews WHERE id = 'review-id';
```

---

## 🔍 Verification Queries

Run these to verify everything is set up correctly:

```sql
-- Check all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'categories', 
  'product_reviews', 
  'wishlists', 
  'customer_addresses', 
  'order_items', 
  'coupons'
);

-- Check products have categories and stock
SELECT 
  name, 
  category_id, 
  stock_quantity, 
  rating, 
  review_count 
FROM products;

-- Check categories
SELECT * FROM categories ORDER BY display_order;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'categories', 
  'product_reviews', 
  'wishlists', 
  'customer_addresses'
);
```

---

## ⚠️ Common Issues

### Issue: Categories not showing
**Solution**: Run the category insert script above

### Issue: Products page shows errors
**Solution**: Check browser console, likely missing category_id on products

### Issue: Can't add to wishlist
**Solution**: Make sure you're logged in

### Issue: Reviews don't appear
**Solution**: Reviews need admin approval. Run:
```sql
UPDATE product_reviews SET is_approved = TRUE;
```

### Issue: Out of stock doesn't show
**Solution**: Make sure stock_quantity is set:
```sql
UPDATE products SET stock_quantity = 0 WHERE id = 'product-id';
```

---

## 📱 Mobile Testing

Test these screens on mobile:
- [ ] Homepage
- [ ] Products page (filter drawer)
- [ ] Product detail page
- [ ] Cart sheet
- [ ] Checkout page
- [ ] Profile page
- [ ] Wishlist
- [ ] Navigation menu

---

## 🎨 Customization

### Update Colors
Colors are in Tailwind classes:
- Primary: `[#1F8D9D]` (teal)
- Secondary: `[#3E7346]` (green)
- Accent: `[#FDBA2D]` (yellow)

Find and replace these colors throughout the codebase.

### Update Text
Update homepage text in `/app/page.tsx`:
- Hero section
- Features section
- CTA section

Update meta tags in `/app/layout.tsx` for SEO.

---

## ✅ Final Checklist

Before going live:
- [ ] All products have categories
- [ ] All products have stock quantities
- [ ] At least 5 categories created
- [ ] Test order flow end-to-end
- [ ] Test review submission and approval
- [ ] Test wishlist functionality
- [ ] Test profile/account features
- [ ] Mobile responsive check
- [ ] Admin dashboard tested
- [ ] Email notifications working
- [ ] Backup database
- [ ] SSL certificate active
- [ ] Domain configured

---

## 🎉 You're Ready!

Once all boxes are checked, your e-commerce store is ready to accept orders!

**Next Steps:**
1. Add your products with categories
2. Set stock quantities
3. Add product images
4. Write compelling descriptions
5. Invite beta testers
6. Launch!

---

*For detailed documentation, see `ECOMMERCE_GUIDE.md`*
