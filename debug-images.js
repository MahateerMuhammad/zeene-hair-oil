// Debug script to check product images in database
// Run with: node debug-images.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment variables from .env.local
let supabaseUrl, supabaseKey;

try {
  const envPath = path.join(__dirname, '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key === 'NEXT_PUBLIC_SUPABASE_URL') {
      supabaseUrl = value;
    }
    if (key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') {
      supabaseKey = value;
    }
  });
} catch (error) {
  console.error('❌ Could not read .env.local file');
  console.log('Make sure .env.local exists in the project root');
  process.exit(1);
}

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugImages() {
  console.log('🔍 Debugging product images...\n');

  try {
    // 1. Check products in database
    console.log('1️⃣ Checking products in database...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, image_url, created_at')
      .order('created_at', { ascending: false });

    if (productsError) {
      console.error('❌ Error fetching products:', productsError.message);
      return;
    }

    if (!products || products.length === 0) {
      console.log('📦 No products found in database');
      return;
    }

    console.log(`✅ Found ${products.length} products:`);
    products.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name}`);
      console.log(`      ID: ${product.id}`);
      console.log(`      Image URL: ${product.image_url || 'NULL'}`);
      console.log(`      Created: ${product.created_at}`);
      console.log('');
    });

    // 2. Check storage bucket contents
    console.log('2️⃣ Checking storage bucket contents...');
    const { data: files, error: filesError } = await supabase.storage
      .from('product-images')
      .list('products', { limit: 100 });

    if (filesError) {
      console.error('❌ Error listing storage files:', filesError.message);
    } else {
      console.log(`✅ Found ${files ? files.length : 0} files in storage:`);
      if (files && files.length > 0) {
        files.forEach((file, index) => {
          console.log(`   ${index + 1}. ${file.name}`);
          console.log(`      Size: ${file.metadata?.size || 'unknown'} bytes`);
          console.log(`      Updated: ${file.updated_at}`);
          
          // Generate public URL
          const { data: urlData } = supabase.storage
            .from('product-images')
            .getPublicUrl(`products/${file.name}`);
          
          console.log(`      Public URL: ${urlData.publicUrl}`);
          console.log('');
        });
      }
    }

    // 3. Check for URL mismatches
    console.log('3️⃣ Checking for URL mismatches...');
    const productsWithImages = products.filter(p => p.image_url);
    
    if (productsWithImages.length === 0) {
      console.log('⚠️  No products have image URLs stored in database');
      console.log('   This means images are uploading to storage but URLs are not being saved');
    } else {
      console.log('✅ Products with image URLs:');
      productsWithImages.forEach(product => {
        console.log(`   - ${product.name}: ${product.image_url}`);
        
        // Check if URL is accessible
        if (product.image_url && product.image_url.includes('supabase')) {
          console.log(`     ✅ URL looks like Supabase storage URL`);
        } else {
          console.log(`     ⚠️  URL doesn't look like Supabase storage URL`);
        }
      });
    }

    // 4. Test a sample public URL
    if (files && files.length > 0) {
      console.log('4️⃣ Testing sample public URL...');
      const sampleFile = files[0];
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(`products/${sampleFile.name}`);
      
      console.log(`Sample URL: ${urlData.publicUrl}`);
      console.log('Try opening this URL in your browser to test if it works');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the debug
debugImages();