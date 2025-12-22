# 🎯 Quick Reference - Daily Operations

## 🚀 Getting Started (First Time)

1. **Run Database Migration** (ONE TIME ONLY)
```bash
# Go to Supabase SQL Editor and run:
scripts/ecommerce-enhancement.sql
```

2. **Start Development**
```bash
pnpm install
pnpm dev
```

3. **Open Browser**
```
http://localhost:3000
```

---

## 🔑 Admin Quick Access

- **Admin Dashboard**: `http://localhost:3000/admin`
- **Products Management**: Admin → Products Tab
- **Orders Management**: Admin → Orders Tab

---

## 📝 Common SQL Queries

### Products

```sql
-- View all products with categories
SELECT p.name, c.name as category, p.stock_quantity, p.price
FROM products p
LEFT JOIN categories c ON p.category_id = c.id;

-- Add stock to a product
UPDATE products 
SET stock_quantity = 100 
WHERE name = 'Product Name';

-- Set product as featured
UPDATE products 
SET is_featured = TRUE 
WHERE name = 'Product Name';

-- Add category to product
UPDATE products 
SET category_id = (SELECT id FROM categories WHERE slug = 'hair-care')
WHERE name = 'Product Name';
```

### Categories

```sql
-- View all categories
SELECT * FROM categories ORDER BY display_order;

-- Add new category
INSERT INTO categories (name, slug, description, display_order)
VALUES ('New Category', 'new-category', 'Description', 6);
```

### Reviews

```sql
-- View pending reviews
SELECT pr.*, u.email, p.name as product_name
FROM product_reviews pr
JOIN users u ON pr.user_id = u.id
JOIN products p ON pr.product_id = p.id
WHERE pr.is_approved = FALSE;

-- Approve all pending reviews
UPDATE product_reviews SET is_approved = TRUE WHERE is_approved = FALSE;

-- Approve specific review
UPDATE product_reviews SET is_approved = TRUE WHERE id = 'review-id';

-- Delete spam review
DELETE FROM product_reviews WHERE id = 'review-id';
```

### Orders

```sql
-- View recent orders
SELECT * FROM orders ORDER BY created_at DESC LIMIT 10;

-- View pending orders
SELECT * FROM orders WHERE status = 'pending';

-- View order details with customer info
SELECT o.*, u.email, p.name as product_name
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
JOIN products p ON o.product_id = p.id
ORDER BY o.created_at DESC;
```

### Customers

```sql
-- View customers with order count
SELECT u.email, u.full_name, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.email, u.full_name
ORDER BY order_count DESC;

-- View customer wishlists
SELECT u.email, p.name as product_name
FROM wishlists w
JOIN users u ON w.user_id = u.id
JOIN products p ON w.product_id = p.id;
```

---

## 🎨 Common Admin Tasks

### Add New Product
1. Login as admin
2. Go to `/admin`
3. Click "Add Product"
4. Fill in:
   - Name
   - Price
   - Description
   - **Category** (important!)
   - **Stock Quantity**
   - SKU (optional)
   - Sale price (optional)
5. Upload images
6. Click "Add Product"

### Approve Order
1. Go to `/admin`
2. Find order in "Orders" tab
3. Click "Approve" (green checkmark)
4. Customer gets email automatically

### Moderate Review
```sql
-- View review
SELECT * FROM product_reviews WHERE id = 'review-id';

-- Approve
UPDATE product_reviews SET is_approved = TRUE WHERE id = 'review-id';

-- Reject (delete)
DELETE FROM product_reviews WHERE id = 'review-id';
```

### Update Stock
```sql
-- Set specific amount
UPDATE products SET stock_quantity = 50 WHERE id = 'product-id';

-- Decrease stock (after sale)
UPDATE products 
SET stock_quantity = stock_quantity - 1 
WHERE id = 'product-id';

-- View low stock products
SELECT name, stock_quantity 
FROM products 
WHERE stock_quantity < 5 AND stock_quantity > 0;
```

---

## 📊 Analytics Queries

### Sales Overview
```sql
-- Total orders
SELECT COUNT(*) as total_orders FROM orders;

-- Orders by status
SELECT status, COUNT(*) as count FROM orders GROUP BY status;

-- Total revenue (approved orders only)
SELECT SUM(total_amount) as total_revenue 
FROM orders 
WHERE status = 'approved';
```

### Product Performance
```sql
-- Most ordered products
SELECT p.name, COUNT(o.id) as order_count
FROM products p
LEFT JOIN orders o ON p.id = o.product_id
GROUP BY p.id, p.name
ORDER BY order_count DESC
LIMIT 10;

-- Products with most reviews
SELECT name, review_count, rating
FROM products
WHERE review_count > 0
ORDER BY review_count DESC;

-- Top rated products
SELECT name, rating, review_count
FROM products
WHERE rating IS NOT NULL
ORDER BY rating DESC, review_count DESC;
```

### Customer Insights
```sql
-- New customers this month
SELECT COUNT(*) 
FROM users 
WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE);

-- Most active customers
SELECT u.email, COUNT(o.id) as orders
FROM users u
JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.email
ORDER BY orders DESC
LIMIT 10;
```

---

## 🔧 Troubleshooting

### Product Not Showing in Category
```sql
-- Check product's category
SELECT name, category_id FROM products WHERE name = 'Product Name';

-- Fix it
UPDATE products 
SET category_id = (SELECT id FROM categories WHERE slug = 'category-slug')
WHERE name = 'Product Name';
```

### Reviews Not Appearing
```sql
-- Check if approved
SELECT * FROM product_reviews WHERE product_id = 'product-id';

-- Approve them
UPDATE product_reviews 
SET is_approved = TRUE 
WHERE product_id = 'product-id';
```

### Wishlist Not Working
- Make sure user is logged in
- Check browser console for errors
- Verify wishlists table exists:
```sql
SELECT * FROM wishlists LIMIT 1;
```

### Stock Always Shows 0
```sql
-- Set default stock for all products
UPDATE products SET stock_quantity = 100 WHERE stock_quantity IS NULL;
```

---

## 🎯 Daily Checklist

Morning:
- [ ] Check pending orders (`SELECT * FROM orders WHERE status = 'pending'`)
- [ ] Approve legitimate orders
- [ ] Check low stock (`SELECT name FROM products WHERE stock_quantity < 5`)
- [ ] Review new customer reviews

Throughout Day:
- [ ] Monitor order notifications
- [ ] Respond to customer inquiries
- [ ] Update product stock as needed

Evening:
- [ ] Review day's sales
- [ ] Check for spam reviews
- [ ] Plan restocking

---

## 📱 Mobile Testing URLs

- Homepage: `http://localhost:3000`
- Products: `http://localhost:3000/products`
- Product Detail: `http://localhost:3000/products/[id]`
- Cart: Click cart icon
- Checkout: `http://localhost:3000/checkout`
- Profile: `http://localhost:3000/profile`
- Admin: `http://localhost:3000/admin`

---

## 🚨 Emergency Fixes

### Reset All Stock to 100
```sql
UPDATE products SET stock_quantity = 100;
```

### Approve All Reviews
```sql
UPDATE product_reviews SET is_approved = TRUE;
```

### Clear All Wishlists
```sql
TRUNCATE wishlists;
```

### Delete Test Orders
```sql
DELETE FROM orders WHERE customer_name LIKE '%test%';
```

---

## 📞 Quick Links

- **Supabase Dashboard**: https://app.supabase.com
- **SQL Editor**: Supabase → SQL Editor
- **Storage**: Supabase → Storage → product-images
- **Auth Users**: Supabase → Authentication → Users
- **Database**: Supabase → Database → Tables

---

## 💡 Pro Tips

1. **Bulk Stock Update**: Use CSV import in Supabase
2. **Featured Products**: Show on homepage by setting `is_featured = TRUE`
3. **Sale Products**: Set `is_on_sale = TRUE` and `sale_price`
4. **Category Order**: Change `display_order` to rearrange
5. **Email Testing**: Use `/api/test-email` endpoint

---

## 🔐 Security Notes

- Never share Supabase keys
- Use environment variables
- Regular database backups
- Monitor RLS policies
- Check auth logs weekly

---

*Keep this file handy for daily operations!*

**Hotkeys:**
- `Cmd/Ctrl + K` → Command palette
- `Cmd/Ctrl + /` → Toggle comment
- `Cmd/Ctrl + P` → Quick file open
