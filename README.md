# ZEENE Hair Oil - E-commerce Application

A secure, production-ready Next.js e-commerce application for ZEENE Hair Oil products with admin dashboard, user authentication, and order management.

## 🚀 Features

### ✅ **Recently Fixed & Implemented**
- **Scrollable Add Product Modal**: Fixed modal overflow with proper scroll area implementation
- **Enhanced Security**: Comprehensive security hardening with CSP, rate limiting, and CSRF protection
- **Input Validation**: Robust validation and sanitization for all user inputs
- **Error Handling**: Professional error handling with logging system
- **Database Schema**: Updated schema with multiple image support
- **TypeScript**: Fixed all TypeScript errors and improved type safety

### 🔐 **Security Features**
- Content Security Policy (CSP) implementation
- Rate limiting on API endpoints (50 requests/minute)
- CSRF protection for state-changing requests
- Input validation and sanitization
- Secure environment variable handling
- XSS protection headers
- File upload validation (5MB limit, image types only)

### 🛍️ **E-commerce Features**
- Product catalog with multiple images
- Shopping cart functionality
- Order management system
- Admin dashboard for product/order management
- User authentication with role-based access
- WhatsApp integration for customer support

## 🛠️ **Tech Stack**

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **Validation**: Zod schema validation
- **Email**: Resend API integration
- **Security**: Custom middleware with rate limiting and CSRF protection

## 📋 **Prerequisites**

- Node.js 18+ and npm/pnpm
- Supabase account and project
- Resend account for email functionality

## 🚀 **Quick Start**

### 1. **Clone and Install**
```bash
git clone <repository-url>
cd zeene-hair-oil
npm install
```

### 2. **Environment Setup**
Create `.env.local` file:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Resend Configuration
RESEND_API_KEY=your_resend_api_key

# Contact Information
CONTACT_EMAIL=your_contact_email
WHATSAPP_NUMBER=your_whatsapp_number
NEXT_PUBLIC_WHATSAPP_NUMBER=your_whatsapp_number
```

### 3. **Database Setup**
Run the complete database setup script in your Supabase SQL Editor:
```sql
-- Copy and paste the contents of scripts/complete-database-setup.sql
```

This script will:
- Create all necessary tables (users, products, orders)
- Set up Row Level Security (RLS) policies
- Create storage bucket for product images
- Add sample products
- Set up triggers for automatic user creation

### 4. **Create Admin User**
After setting up the database, create an admin user:
```sql
-- Replace with your admin email
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'your-admin-email@example.com';
```

### 5. **Run the Application**
```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

## 📁 **Project Structure**

```
├── app/                    # Next.js app directory
│   ├── admin/             # Admin dashboard
│   ├── api/               # API routes
│   ├── login/             # Authentication pages
│   └── products/          # Product pages
├── components/            # Reusable components
│   └── ui/               # UI components (Radix UI)
├── contexts/             # React contexts
├── hooks/                # Custom hooks
├── lib/                  # Utility libraries
│   ├── supabase.ts       # Supabase client
│   ├── validation.ts     # Input validation
│   ├── logger.ts         # Logging system
│   └── env.ts           # Environment configuration
├── scripts/              # Database scripts
└── styles/              # Global styles
```

## 🔧 **Key Components**

### **Admin Dashboard** (`/admin`)
- Product management (CRUD operations)
- Order management (approve/reject)
- Multiple image upload support
- **Fixed**: Scrollable modal for long forms

### **Security Middleware**
- Rate limiting (50 requests/minute for API routes)
- CSRF protection
- Security headers (CSP, XSS protection, etc.)
- Request logging for security events

### **Validation System**
- Zod schema validation for all inputs
- File upload validation (type, size limits)
- Input sanitization to prevent XSS
- Comprehensive error handling

## 🛡️ **Security Measures**

### **Headers & CSP**
```javascript
// Implemented security headers
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Content-Security-Policy: [strict policy]
Strict-Transport-Security: max-age=31536000
```

### **Input Validation**
- Product names: alphanumeric + spaces/hyphens only
- Prices: positive numbers with 2 decimal places max
- Phone numbers: validated format
- File uploads: image types only, 5MB limit

### **Rate Limiting**
- API endpoints: 50 requests per minute per IP
- Automatic blocking of excessive requests
- Security event logging

## 📊 **Database Schema**

### **Users Table**
```sql
- id (UUID, references auth.users)
- email (TEXT, unique)
- role (TEXT, 'user' | 'admin')
- created_at (TIMESTAMP)
```

### **Products Table**
```sql
- id (UUID, primary key)
- name (TEXT, required)
- price (DECIMAL, required)
- description (TEXT, optional)
- image_url (TEXT, primary image)
- image_urls (TEXT[], multiple images)
- created_at, updated_at (TIMESTAMP)
```

### **Orders Table**
```sql
- id (UUID, primary key)
- user_id (UUID, foreign key)
- product_id (UUID, foreign key)
- customer_name, address, phone (TEXT, required)
- status ('pending' | 'approved' | 'rejected')
- created_at, updated_at (TIMESTAMP)
```

## 🚨 **Troubleshooting**

### **Common Issues**

1. **Build Errors**: Ensure all environment variables are set
2. **Database Connection**: Verify Supabase URL and keys
3. **Admin Access**: Make sure user role is set to 'admin' in database
4. **Image Upload**: Check storage bucket permissions in Supabase

### **Security Logs**
Monitor console for security events:
- Rate limiting violations
- CSRF attack attempts
- Validation failures
- Database errors

## 🔄 **Recent Updates**

### **Version 2.0 - Security & UX Improvements**
- ✅ Fixed scrollable add product modal
- ✅ Implemented comprehensive security measures
- ✅ Added input validation and sanitization
- ✅ Enhanced error handling and logging
- ✅ Updated database schema for multiple images
- ✅ Fixed TypeScript and ESLint configurations
- ✅ Added rate limiting and CSRF protection

## 📞 **Support**

For issues or questions:
- Check the troubleshooting section above
- Review security logs in browser console
- Verify database setup with provided scripts
- Ensure all environment variables are correctly set

## 🔐 **Production Deployment**

Before deploying to production:
1. ✅ Run `npm run build` to ensure no errors
2. ✅ Verify all environment variables are set
3. ✅ Run database setup script in production Supabase
4. ✅ Test admin functionality
5. ✅ Verify security headers are working
6. ✅ Test rate limiting functionality

The application is now production-ready with comprehensive security measures and proper error handling.