<div align="center">

# 🌿 ZEENE Hair Oil

### *Premium Natural Hair Care E-commerce Platform*

[![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

*A secure, production-ready e-commerce application built with modern web technologies*

[🚀 Live Demo](#) • [📖 Documentation](#-documentation) • [🛠️ Installation](#-installation) • [🤝 Contributing](#-contributing)

</div>

---

## ✨ Features

### 🛍️ **E-commerce Core**
- 🏪 **Product Catalog** - Beautiful product showcase with multiple image support
- 🛒 **Shopping Cart** - Seamless cart functionality with real-time updates
- 📦 **Order Management** - Complete order lifecycle from placement to fulfillment
- 👤 **User Authentication** - Secure login/signup with role-based access control
- 📱 **WhatsApp Integration** - Direct customer support via WhatsApp

### 🔐 **Security & Performance**
- 🛡️ **Enterprise Security** - CSP, rate limiting, CSRF protection, XSS prevention
- ⚡ **Optimized Performance** - Server-side rendering, image optimization, caching
- 📊 **Comprehensive Logging** - Advanced logging system with security event tracking
- ✅ **Input Validation** - Robust Zod schema validation for all user inputs
- 🔒 **File Upload Security** - Secure image uploads with type and size validation

### 👨‍💼 **Admin Dashboard**
- 📈 **Product Management** - Full CRUD operations with bulk actions
- 📋 **Order Processing** - Approve, reject, and track orders efficiently
- 🖼️ **Media Management** - Multiple image upload with drag-and-drop interface
- 📊 **Analytics Dashboard** - Sales insights and performance metrics
- 🔧 **System Configuration** - Environment and security settings management

---

## 🎯 **Tech Stack**

<div align="center">

| Category | Technologies |
|----------|-------------|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS |
| **UI Components** | Radix UI, Framer Motion, Lucide Icons |
| **Backend** | Supabase (PostgreSQL, Auth, Storage) |
| **Validation** | Zod Schema Validation |
| **Email** | Resend API Integration |
| **Security** | Custom Middleware, Rate Limiting, CSRF Protection |
| **Development** | ESLint, TypeScript, PostCSS |

</div>

---

## 🚀 **Quick Start**

### Prerequisites

- **Node.js** 18+ and npm/pnpm/yarn
- **Supabase** account and project
- **Resend** account for email functionality

### 1. **Clone & Install**

```bash
# Clone the repository
git clone https://github.com/your-username/zeene-hair-oil.git
cd zeene-hair-oil

# Install dependencies
npm install
# or
pnpm install
# or
yarn install
```

### 2. **Environment Configuration**

Create a `.env.local` file in the root directory:

```env
# 🔗 Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# 📧 Email Configuration
RESEND_API_KEY=your_resend_api_key

# 📞 Contact Information
CONTACT_EMAIL=your_contact_email
WHATSAPP_NUMBER=your_whatsapp_number
NEXT_PUBLIC_WHATSAPP_NUMBER=your_whatsapp_number

# 🔒 Security (Optional)
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

### 3. **Database Setup**

Execute the complete database setup in your Supabase SQL Editor:

```sql
-- Copy and paste the contents of scripts/complete-database-setup.sql
-- This will create all tables, policies, and sample data
```

### 4. **Create Admin User**

```sql
-- Replace with your admin email
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'your-admin-email@example.com';
```

### 5. **Launch Application**

```bash
# Development mode
npm run dev

# Production build
npm run build && npm start

# Development with optimization
npm run dev:optimize
```

Visit `http://localhost:3000` to see your application! 🎉

---

## 📁 **Project Architecture**

```
zeene-hair-oil/
├── 📱 app/                    # Next.js App Router
│   ├── 🏪 admin/             # Admin dashboard pages
│   ├── 🔌 api/               # API routes & endpoints
│   ├── 🔐 auth/              # Authentication pages
│   ├── 🛍️ products/          # Product catalog pages
│   └── 📄 (other pages)      # Login, signup, contact, etc.
├── 🧩 components/            # Reusable React components
│   └── 🎨 ui/               # UI component library (Radix UI)
├── 🔄 contexts/             # React context providers
├── 🪝 hooks/                # Custom React hooks
├── 📚 lib/                  # Utility libraries & configurations
│   ├── 🗄️ supabase.ts       # Database client
│   ├── ✅ validation.ts     # Input validation schemas
│   ├── 📝 logger.ts         # Logging system
│   └── 🔧 utils.ts          # Helper functions
├── 📜 scripts/              # Database & deployment scripts
├── 🎨 styles/               # Global CSS styles
└── 📧 email-templates/      # Email template files
```

---

## 🛡️ **Security Features**

### **Headers & CSP**
```javascript
✅ X-Frame-Options: DENY
✅ X-Content-Type-Options: nosniff  
✅ X-XSS-Protection: 1; mode=block
✅ Content-Security-Policy: [strict policy]
✅ Strict-Transport-Security: max-age=31536000
```

### **Input Validation & Sanitization**
- 🔤 **Product Names**: Alphanumeric + spaces/hyphens only
- 💰 **Prices**: Positive numbers with 2 decimal places max
- 📞 **Phone Numbers**: International format validation
- 📁 **File Uploads**: Image types only, 5MB limit, malware scanning

### **Rate Limiting & Protection**
- 🚦 **API Endpoints**: 50 requests per minute per IP
- 🚫 **Automatic Blocking**: Excessive request protection
- 📊 **Security Logging**: Real-time threat monitoring
- 🔐 **CSRF Protection**: State-changing request validation

---

## 📊 **Database Schema**

<details>
<summary><strong>🗄️ Click to view database structure</strong></summary>

### **Users Table**
```sql
CREATE TABLE public.users (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Products Table**
```sql
CREATE TABLE public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  image_url TEXT,
  image_urls TEXT[],
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Orders Table**
```sql
CREATE TABLE public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  product_id UUID REFERENCES public.products(id),
  quantity INTEGER DEFAULT 1,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

</details>

---

## 🔧 **Available Scripts**

| Command | Description |
|---------|-------------|
| `npm run dev` | 🚀 Start development server |
| `npm run build` | 🏗️ Build for production |
| `npm run start` | ▶️ Start production server |
| `npm run lint` | 🔍 Run ESLint |
| `npm run lint:fix` | 🔧 Fix ESLint issues |
| `npm run type-check` | ✅ TypeScript type checking |
| `npm run security-audit` | 🛡️ Security vulnerability scan |
| `npm run clean` | 🧹 Clean build cache |

---

## 🚨 **Troubleshooting**

<details>
<summary><strong>🔧 Common Issues & Solutions</strong></summary>

### **Build Errors**
```bash
# Clear cache and reinstall
npm run clean:full

# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
```

### **Database Connection Issues**
- ✅ Verify Supabase URL and API keys
- ✅ Check database setup script execution
- ✅ Ensure RLS policies are properly configured

### **Admin Access Problems**
```sql
-- Verify admin role assignment
SELECT email, role FROM public.users WHERE role = 'admin';
```

### **Image Upload Issues**
- ✅ Check Supabase storage bucket permissions
- ✅ Verify file size limits (5MB max)
- ✅ Ensure proper CORS configuration

</details>

---

## 📈 **Performance Optimizations**

- ⚡ **Server-Side Rendering** - Fast initial page loads
- 🖼️ **Image Optimization** - Next.js automatic image optimization
- 📦 **Code Splitting** - Automatic bundle splitting
- 🗄️ **Database Indexing** - Optimized query performance
- 🔄 **Caching Strategy** - Redis-like caching with Supabase
- 📱 **Mobile Optimization** - Responsive design with mobile-first approach

---

## 🤝 **Contributing**

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### **Development Workflow**

1. 🍴 Fork the repository
2. 🌿 Create a feature branch (`git checkout -b feature/amazing-feature`)
3. 💾 Commit your changes (`git commit -m 'Add amazing feature'`)
4. 📤 Push to the branch (`git push origin feature/amazing-feature`)
5. 🔄 Open a Pull Request

---

## 📞 **Support & Contact**

<div align="center">

### **Get in Touch**

[![Email](https://img.shields.io/badge/Email-zeene.contact@gmail.com-red?style=for-the-badge&logo=gmail)](mailto:zeene.contact@gmail.com)
[![WhatsApp](https://img.shields.io/badge/WhatsApp-+92_324_1715470-25D366?style=for-the-badge&logo=whatsapp)](https://wa.me/923241715470)
[![Instagram](https://img.shields.io/badge/Instagram-@zeene.store-E4405F?style=for-the-badge&logo=instagram)](https://www.instagram.com/zeene.store?igsh=c2J0a20zMDM4bmI1)

**Business Hours:** Monday-Friday 9AM-6PM, Saturday 10AM-4PM (PKT)

</div>

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 **Acknowledgments**

- 🎨 **UI Components**: [Radix UI](https://www.radix-ui.com/) for accessible components
- 🎭 **Animations**: [Framer Motion](https://www.framer.com/motion/) for smooth animations
- 🗄️ **Backend**: [Supabase](https://supabase.com/) for database and authentication
- 📧 **Email**: [Resend](https://resend.com/) for transactional emails
- 🎨 **Styling**: [Tailwind CSS](https://tailwindcss.com/) for utility-first CSS

---

<div align="center">

### **⭐ Star this repository if you found it helpful!**

**Made with ❤️ for the ZEENE Hair Oil community**

*Transform your hair, transform your confidence* 🌟

</div>