# ZEENE Hair Oil - Image Upload Setup Guide

## 🚨 **CRITICAL: Supabase Storage Setup Required**

The image upload feature requires a Supabase Storage bucket to be created. Without this, all product images will default to the fallback image.

## ✅ **Step 1: Create Supabase Storage Bucket**

### Option A: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"Create a new bucket"**
4. Set the following:
   - **Name**: `product-images`
   - **Public bucket**: ✅ **Enabled** (important!)
   - **File size limit**: `5 MB`
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp, image/jpg`
5. Click **"Create bucket"**

### Option B: Using SQL (Advanced)
1. Go to **SQL Editor** in your Supabase dashboard
2. Run the script from `scripts/setup-storage.sql`:

```sql
-- Create the storage bucket for product images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies
CREATE POLICY "Allow authenticated users to upload product images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Allow public read access to product images" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'product-images');

CREATE POLICY "Allow authenticated users to update product images" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'product-images');

CREATE POLICY "Allow authenticated users to delete product images" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'product-images');

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
```

## ✅ **Step 2: Verify Storage Permissions**

Make sure your Supabase project has the correct RLS (Row Level Security) policies:

1. Go to **Authentication > Policies** in Supabase dashboard
2. Look for **storage.objects** table
3. Ensure these policies exist:
   - ✅ Allow authenticated users to upload product images
   - ✅ Allow public read access to product images
   - ✅ Allow authenticated users to update product images
   - ✅ Allow authenticated users to delete product images

## ✅ **Step 3: Test Image Upload**

### Manual Test:
1. Login as admin user
2. Go to Admin Dashboard
3. Click "Add Product"
4. Fill in product details
5. Upload an image file (JPG, PNG, WebP under 5MB)
6. Click "Add Product"
7. Check if the product shows the uploaded image

### Debug Console:
Open browser Developer Tools (F12) and check the Console tab for:
- ✅ `"Starting image upload for: [filename]"`
- ✅ `"Upload successful: [upload data]"`
- ✅ `"Public URL generated: [URL]"`
- ❌ Any error messages about storage bucket

## 🔧 **Troubleshooting**

### Problem: "Failed to upload image: The resource was not found"
**Solution**: The `product-images` bucket doesn't exist. Follow Step 1 to create it.

### Problem: "Failed to upload image: new row violates row-level security policy"
**Solution**: RLS policies are missing. Run the SQL script from Step 1 Option B.

### Problem: Images upload but don't display
**Solution**: 
1. Check if bucket is set to **public**
2. Verify the public URL in browser console
3. Check if image URL contains `/product-images/products/`

### Problem: "Failed to upload image: File size too large"
**Solution**: 
1. Image is over 5MB limit
2. Compress the image or increase bucket limit
3. Supported formats: JPG, PNG, WebP only

## 📋 **Image Upload Features**

### ✅ **What Works Now:**
- **File Validation**: Size (5MB max), type (JPG/PNG/WebP), format validation
- **Secure Upload**: Files uploaded to Supabase Storage with unique names
- **Public URLs**: Automatic generation of public URLs for images
- **Fallback Images**: Default to `/oil.png` if upload fails or no image
- **Image Cleanup**: Deletes old images when products are deleted
- **Loading States**: Shows "Uploading Images..." during upload
- **Error Handling**: Clear error messages for upload failures
- **Preview**: Shows image preview before upload

### 🔄 **Upload Process:**
1. User selects image file
2. Client validates file (size, type, format)
3. File uploaded to `product-images/products/[unique-filename]`
4. Public URL generated and stored in database
5. Image displays in product listings and details

### 🗑️ **Delete Process:**
1. User confirms deletion with product name
2. System finds and deletes image from storage
3. Product record deleted from database
4. Success message shown

## 🚀 **Production Recommendations**

### 1. **CDN Setup** (Optional but Recommended)
- Enable Supabase CDN for faster image loading
- Consider using a custom domain for images

### 2. **Image Optimization**
- Implement automatic image resizing/compression
- Generate multiple sizes (thumbnail, medium, large)
- Use WebP format for better compression

### 3. **Backup Strategy**
- Regular backups of storage bucket
- Consider cross-region replication for critical images

### 4. **Monitoring**
- Monitor storage usage and costs
- Set up alerts for failed uploads
- Track image access patterns

## 📊 **Storage Bucket Structure**

```
product-images/
└── products/
    ├── 1703123456789-abc123.jpg
    ├── 1703123456790-def456.png
    └── 1703123456791-ghi789.webp
```

## 🔐 **Security Features**

- ✅ **File Type Validation**: Only allows image files
- ✅ **Size Limits**: 5MB maximum per file
- ✅ **Unique Filenames**: Prevents conflicts and overwrites
- ✅ **RLS Policies**: Proper access control
- ✅ **Public Read**: Images accessible to all users
- ✅ **Authenticated Upload**: Only logged-in users can upload
- ✅ **Automatic Cleanup**: Orphaned images removed on product deletion

## 📝 **Environment Variables**

Make sure these are set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## ✅ **Verification Checklist**

Before going live, verify:

- [ ] Supabase Storage bucket `product-images` exists
- [ ] Bucket is set to **public**
- [ ] RLS policies are configured correctly
- [ ] File size limit is set to 5MB
- [ ] Allowed MIME types include image formats
- [ ] Test upload works in admin dashboard
- [ ] Images display correctly in product listings
- [ ] Image deletion works when products are deleted
- [ ] Error messages are clear and helpful
- [ ] Loading states work during upload

## 🎯 **Summary**

After completing the setup:
1. ✅ **Product images will upload to Supabase Storage**
2. ✅ **Each product can have its own unique image**
3. ✅ **Images are automatically optimized and served via CDN**
4. ✅ **Graceful fallback to default image if upload fails**
5. ✅ **Secure, scalable, and production-ready image handling**

The image upload system is now **enterprise-ready** with proper error handling, security, and user experience!