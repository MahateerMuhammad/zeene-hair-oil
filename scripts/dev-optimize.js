#!/usr/bin/env node

/**
 * Development Optimization Script
 * Helps identify and fix common localhost performance issues
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🚀 ZEENE Hair Oil - Development Optimization Tool')
console.log('================================================\n')

// Check Node.js version
function checkNodeVersion() {
  const nodeVersion = process.version
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0])
  
  console.log(`📋 Node.js Version: ${nodeVersion}`)
  
  if (majorVersion < 18) {
    console.log('⚠️  Warning: Node.js 18+ recommended for better performance')
    console.log('   Consider upgrading: https://nodejs.org/\n')
  } else {
    console.log('✅ Node.js version is good\n')
  }
}

// Check package.json scripts
function checkPackageScripts() {
  const packagePath = path.join(process.cwd(), 'package.json')
  
  if (!fs.existsSync(packagePath)) {
    console.log('❌ package.json not found')
    return
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
  
  console.log('📦 Package.json Analysis:')
  
  // Check for performance-related scripts
  const scripts = packageJson.scripts || {}
  
  if (scripts.dev && scripts.dev.includes('--turbo')) {
    console.log('✅ Turbopack enabled for faster development')
  } else {
    console.log('💡 Consider adding Turbopack: next dev --turbo')
  }
  
  if (scripts.build && scripts.build.includes('--experimental-build-mode')) {
    console.log('✅ Experimental build mode enabled')
  }
  
  console.log('')
}

// Check Next.js configuration
function checkNextConfig() {
  const nextConfigPath = path.join(process.cwd(), 'next.config.js')
  
  if (!fs.existsSync(nextConfigPath)) {
    console.log('❌ next.config.js not found')
    return
  }
  
  const configContent = fs.readFileSync(nextConfigPath, 'utf8')
  
  console.log('⚙️  Next.js Configuration Analysis:')
  
  if (configContent.includes('swcMinify: true')) {
    console.log('✅ SWC minification enabled')
  } else {
    console.log('💡 Consider enabling SWC minification for faster builds')
  }
  
  if (configContent.includes('compress: true')) {
    console.log('✅ Compression enabled')
  } else {
    console.log('💡 Consider enabling compression')
  }
  
  if (configContent.includes('poweredByHeader: false')) {
    console.log('✅ X-Powered-By header disabled (security)')
  }
  
  console.log('')
}

// Check environment variables
function checkEnvironment() {
  console.log('🌍 Environment Analysis:')
  
  const envLocalPath = path.join(process.cwd(), '.env.local')
  
  if (!fs.existsSync(envLocalPath)) {
    console.log('⚠️  .env.local not found')
    console.log('   Copy .env.local.example to .env.local for optimal performance')
  } else {
    console.log('✅ .env.local found')
    
    const envContent = fs.readFileSync(envLocalPath, 'utf8')
    
    if (envContent.includes('NEXT_TELEMETRY_DISABLED=1')) {
      console.log('✅ Next.js telemetry disabled')
    } else {
      console.log('💡 Consider disabling telemetry: NEXT_TELEMETRY_DISABLED=1')
    }
  }
  
  console.log('')
}

// Check for common performance issues
function checkPerformanceIssues() {
  console.log('🔍 Performance Issue Detection:')
  
  // Check for large node_modules
  const nodeModulesPath = path.join(process.cwd(), 'node_modules')
  if (fs.existsSync(nodeModulesPath)) {
    try {
      const stats = fs.statSync(nodeModulesPath)
      console.log('📁 node_modules exists (this is normal)')
      
      // Check for common problematic packages
      const problematicPackages = [
        'moment', // Large date library
        'lodash', // Large utility library (prefer lodash-es)
        '@babel/core' // Heavy if not needed
      ]
      
      problematicPackages.forEach(pkg => {
        const pkgPath = path.join(nodeModulesPath, pkg)
        if (fs.existsSync(pkgPath)) {
          console.log(`⚠️  Found ${pkg} - consider alternatives for better performance`)
        }
      })
      
    } catch (error) {
      console.log('❌ Could not analyze node_modules')
    }
  }
  
  // Check for TypeScript configuration
  const tsconfigPath = path.join(process.cwd(), 'tsconfig.json')
  if (fs.existsSync(tsconfigPath)) {
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'))
    
    if (tsconfig.compilerOptions?.incremental === true) {
      console.log('✅ TypeScript incremental compilation enabled')
    } else {
      console.log('💡 Consider enabling TypeScript incremental compilation')
    }
  }
  
  console.log('')
}

// Provide optimization recommendations
function provideRecommendations() {
  console.log('💡 Performance Optimization Recommendations:')
  console.log('==========================================')
  
  console.log('1. 🚀 Use Turbopack for development:')
  console.log('   npm run dev -- --turbo')
  console.log('')
  
  console.log('2. 🧹 Clear Next.js cache if experiencing issues:')
  console.log('   rm -rf .next')
  console.log('   npm run dev')
  console.log('')
  
  console.log('3. 📦 Optimize dependencies:')
  console.log('   npm audit')
  console.log('   npm update')
  console.log('')
  
  console.log('4. 🔧 Enable performance monitoring:')
  console.log('   Set NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true in .env.local')
  console.log('')
  
  console.log('5. 🖼️  Optimize images:')
  console.log('   - Use WebP/AVIF formats')
  console.log('   - Enable lazy loading')
  console.log('   - Use appropriate sizes')
  console.log('')
  
  console.log('6. 🌐 Network optimization:')
  console.log('   - Use localhost instead of 127.0.0.1')
  console.log('   - Disable unnecessary browser extensions')
  console.log('   - Check firewall/antivirus settings')
  console.log('')
}

// Main execution
function main() {
  try {
    checkNodeVersion()
    checkPackageScripts()
    checkNextConfig()
    checkEnvironment()
    checkPerformanceIssues()
    provideRecommendations()
    
    console.log('✨ Analysis complete! Apply the recommendations above for better performance.')
    
  } catch (error) {
    console.error('❌ Error during analysis:', error.message)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

module.exports = { main }