// Test script to verify Supabase Storage setup
// Run with: node test-storage.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testStorageSetup() {
  console.log('🧪 Testing Supabase Storage setup...\n');

  try {
    // Test 1: Check if bucket exists
    console.log('1️⃣ Checking if product-images bucket exists...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError.message);
      return;
    }

    const productImagesBucket = buckets.find(bucket => bucket.id === 'product-images');
    
    if (!productImagesBucket) {
      console.error('❌ product-images bucket not found!');
      console.log('📋 Available buckets:', buckets.map(b => b.id).join(', ') || 'None');
      console.log('\n🔧 To fix this:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Navigate to Storage');
      console.log('3. Create a new bucket named "product-images"');
      console.log('4. Make sure it\'s set to public');
      return;
    }

    console.log('✅ product-images bucket found');
    console.log(`   - Public: ${productImagesBucket.public ? 'Yes' : 'No'}`);
    console.log(`   - Created: ${productImagesBucket.created_at}`);

    if (!productImagesBucket.public) {
      console.warn('⚠️  Bucket is not public - images may not be accessible');
    }

    // Test 2: Check bucket permissions
    console.log('\n2️⃣ Testing bucket permissions...');
    
    // Try to list files (should work even if empty)
    const { data: files, error: listError } = await supabase.storage
      .from('product-images')
      .list('products', { limit: 1 });

    if (listError) {
      console.error('❌ Error listing files:', listError.message);
      if (listError.message.includes('row-level security')) {
        console.log('\n🔧 RLS Policy issue detected!');
        console.log('Run the SQL script: fix-storage-policies.sql');
        console.log('Or go to Authentication > Policies in Supabase Dashboard');
        console.log('and create policies for storage.objects table');
      }
      return;
    }

    // Test 2b: Check RLS policies
    console.log('\n2️⃣b Testing RLS policies...');
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('policyname, cmd, roles')
      .eq('tablename', 'objects')
      .eq('schemaname', 'storage');

    if (!policiesError && policies) {
      console.log('✅ Found RLS policies:');
      policies.forEach(policy => {
        console.log(`   - ${policy.policyname} (${policy.cmd}) for ${policy.roles}`);
      });
    } else {
      console.log('⚠️  Could not check RLS policies (this is normal)');
    }

    console.log('✅ Bucket permissions working');
    console.log(`   - Files in products folder: ${files ? files.length : 0}`);

    // Test 3: Test public URL generation
    console.log('\n3️⃣ Testing public URL generation...');
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl('products/test.jpg');

    if (urlData.publicUrl) {
      console.log('✅ Public URL generation working');
      console.log(`   - Sample URL: ${urlData.publicUrl}`);
    } else {
      console.error('❌ Failed to generate public URL');
      return;
    }

    // Test 4: Check authentication (optional)
    console.log('\n4️⃣ Checking authentication status...');
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      console.log('✅ User authenticated');
      console.log(`   - User ID: ${user.id}`);
      console.log(`   - Email: ${user.email}`);
    } else {
      console.log('ℹ️  No user authenticated (this is normal for testing)');
    }

    console.log('\n🎉 Storage setup test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ product-images bucket exists');
    console.log('✅ Bucket permissions working');
    console.log('✅ Public URL generation working');
    console.log(`✅ Bucket is ${productImagesBucket.public ? 'public' : 'private'}`);
    
    console.log('\n🚀 Your image upload system should work correctly!');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your .env.local file has correct Supabase credentials');
    console.log('2. Verify your Supabase project is active');
    console.log('3. Make sure you have internet connection');
  }
}

// Run the test
testStorageSetup();