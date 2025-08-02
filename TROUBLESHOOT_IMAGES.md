# 🔧 Image Upload Troubleshooting Guide

## 🚨 **Current Issue**: Images upload to storage but still show default image

This means the upload is working but there's a disconnect between storage and display.

## 🔍 **Step-by-Step Debugging**

### **Step 1: Run Debug Script**
```bash
node debug-images.js
```

This will show you:
- ✅ What products are in the database
- ✅ What image URLs are stored in database  
- ✅ What files are in Supabase Storage
- ✅ If URLs match between database and storage

### **Step 2: Check Browser Console**

1. **Open your admin dashboard**
2. **Press F12 to open Developer Tools**
3. **Go to Console tab**
4. **Try uploading a product with image**
5. **Look for these messages**:
   - `"Starting image upload for: [filename]"`
   - `"Upload successful: [data]"`
   - `"Public URL generated: [URL]"`
   - `"Product data to save: [object]"`
   - `"Final image URL: [URL]"`

### **Step 3: Check Products Page Console**

1. **Go to your products page**
2. **Open Developer Tools (F12)**
3. **Look for these messages**:
   - `"Fetched products: [array]"`
   - `"Product: [name], Image URL: [URL]"`

## 🎯 **Common Issues & Solutions**

### **Issue 1: Image URL is NULL in database**
**Symptoms**: Debug script shows `Image URL: NULL`
**Cause**: Upload succeeds but URL not saved to database
**Solution**: 
```javascript
// Check if this line in admin page is working:
console.log('Final image URL:', imageUrl)
// Should show a Supabase storage URL, not null
```

### **Issue 2: Image URL is wrong format**
**Symptoms**: URL doesn't contain `supabase` or `storage`
**Cause**: URL generation failed
**Solution**: Check Supabase project URL and bucket settings

### **Issue 3: Images upload but URLs not accessible**
**Symptoms**: URLs exist but images don't load
**Cause**: Bucket not public or RLS blocking access
**Solution**: 
1. Make sure bucket is **public**
2. Run the RLS policy fix script

### **Issue 4: Browser caching old images**
**Symptoms**: Changes not visible immediately
**Solution**: 
1. Hard refresh (Ctrl+F5)
2. Clear browser cache
3. Open in incognito mode

## 🔧 **Quick Fixes to Try**

### **Fix 1: Verify Bucket is Public**
```sql
-- Run in Supabase SQL Editor
SELECT id, name, public FROM storage.buckets WHERE id = 'product-images';
-- Should show: public = true
```

### **Fix 2: Test Direct Storage Access**
1. Go to Supabase Dashboard > Storage > product-images
2. Click on any uploaded image
3. Copy the public URL
4. Open URL in new browser tab
5. Should show the image directly

### **Fix 3: Clear and Re-upload**
1. Delete a test product
2. Create new product with image
3. Check if new image displays

### **Fix 4: Check Network Tab**
1. Open Developer Tools > Network tab
2. Reload products page
3. Look for image requests
4. Check if any image URLs return 404 or 403 errors

## 📋 **Debugging Checklist**

Run through this checklist:

- [ ] **Storage bucket exists**: `product-images` bucket created
- [ ] **Bucket is public**: Can access images via direct URL
- [ ] **RLS policies set**: Upload and read permissions working
- [ ] **Images uploading**: Files appear in storage bucket
- [ ] **URLs generating**: Public URLs created successfully
- [ ] **URLs saving**: Database contains correct image URLs
- [ ] **URLs loading**: Images display when accessed directly
- [ ] **Frontend fetching**: Products page gets correct URLs
- [ ] **No caching issues**: Hard refresh shows new images

## 🚀 **Expected Debug Output**

### **Successful Upload Console Output**:
```
Starting image upload for: myimage.jpg
Upload successful: { path: "products/1703123456-abc123.jpg" }
Public URL generated: https://[project].supabase.co/storage/v1/object/public/product-images/products/1703123456-abc123.jpg
Product data to save: { name: "Test Product", image_url: "https://...", ... }
Final image URL: https://[project].supabase.co/storage/v1/object/public/product-images/products/1703123456-abc123.jpg
```

### **Successful Products Page Output**:
```
Fetched products: [{ id: "123", name: "Test Product", image_url: "https://..." }]
Product: Test Product, Image URL: https://[project].supabase.co/storage/v1/object/public/product-images/products/1703123456-abc123.jpg
```

## 🎯 **Most Likely Causes**

Based on "images upload but don't display":

1. **🥇 Most Likely**: Bucket not public or RLS blocking read access
2. **🥈 Second**: Image URLs not being saved to database correctly  
3. **🥉 Third**: Browser caching old version of page
4. **Fourth**: Frontend not fetching/displaying URLs correctly

## 📞 **Next Steps**

1. **Run the debug script**: `node debug-images.js`
2. **Check browser console** during upload and page load
3. **Share the output** so I can see exactly what's happening

The debug information will tell us exactly where the issue is!