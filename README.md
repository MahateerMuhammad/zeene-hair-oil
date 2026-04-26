<div align="center">
<img src="public/zeene-new-logo.png" alt="Zeene Logo" width="200"/>

# 🌿 ZEENE

### *A Curated E-Commerce Platform for Modern Lifestyle Essentials*

[![Next.js](https://img.shields.io/badge/Next.js-^16.1.1-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-^19-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-^5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-^3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

*A production-ready, secure, and performant e-commerce application built with a modern web stack.*

</div>

---

This project is a full-featured e-commerce platform designed for curated lifestyle products. It includes a complete customer-facing storefront, a comprehensive admin dashboard for managing products and orders, and robust security features.

## ✨ Features

### 🛍️ E-commerce Core
- **Product Catalog:** Dynamic product listings with categories, filtering, and search.
- **Customer Profiles:** User accounts with order history, wishlists, and profile management.
- **Shopping Cart & Wishlist:** Persistent cart and wishlist functionality.
- **Product Reviews:** Customers can leave reviews and ratings on products.

### 👨‍💼 Admin Dashboard (`/admin`)
- **Product Management:** Full CRUD (Create, Read, Update, Delete) for products, including image uploads.
- **Order Management:** View, approve, and manage customer orders.
- **Category Management:** Organize products into categories.
- **Analytics:** Insights into sales and product performance.

### 🔐 Security & Performance
- **Authentication:** Secure user sign-up and login with Supabase Auth (including magic links).
- **Authorization:** Row-Level Security (RLS) to protect user data.
- **Performance:** Optimized for speed with Next.js SSR, Image Optimization, and code splitting.
- **Input Validation:** Using Zod for robust schema validation.

## 🎯 Tech Stack

| Category | Technologies |
|----------|-------------|
| **Framework** | Next.js 16 |
| **Language** | TypeScript 5 |
| **UI Library** | React 19 |
| **Styling** | Tailwind CSS, Framer Motion |
| **Backend** | Supabase (PostgreSQL, Auth, Storage) |
| **Email** | Resend |
| **Validation** | Zod |
| **UI Components** | shadcn/ui, Radix UI, Lucide Icons |

## 🚀 Quick Start

### 1. Prerequisites
- Node.js (v18 or newer)
- A Supabase account and project
- A Resend account for transactional emails

### 2. Clone & Install Dependencies
```bash
git clone <your-repository-url>
cd zeene-hair-oil
pnpm install
```

### 3. Environment Configuration
Create a `.env.local` file in the root of the project and add your credentials.

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Email Configuration
RESEND_API_KEY=your_resend_api_key

# Contact Information
NEXT_PUBLIC_WHATSAPP_NUMBER=your_whatsapp_number
```

### 4. Database Setup
Go to the SQL Editor in your Supabase project and execute the contents of `scripts/ecommerce-enhancement.sql` to set up the necessary tables and policies.

### 5. Run the Development Server
```bash
pnpm dev
```
The application will be available at `http://localhost:3000`.

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start the development server. |
| `pnpm dev:turbo` | Start the development server with Turbopack. |
| `pnpm build` | Build the application for production. |
| `pnpm start` | Start the production server. |
| `pnpm lint` | Run ESLint to check for code quality issues. |
| `pnpm type-check` | Run the TypeScript compiler to check for type errors. |
| `pnpm security-audit` | Run `npm audit` to check for vulnerabilities. |