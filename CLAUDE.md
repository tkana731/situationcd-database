# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js application that serves as a database for situation CDs (voice dramas), primarily built with:

- Next.js (App Router)
- Firebase/Firestore
- TailwindCSS
- React

The site allows users to browse and search for voice drama products, view product details, and filter by tags, voice actors, or release year.

## Commands

### Development

```bash
# Start the development server with Turbopack (recommended)
npm run dev

# Build for production
npm run build

# Start the production server
npm run start

# Run linting
npm run lint
```

### Deployment

The site is configured for deployment on Firebase Hosting:

```bash
# Build for production
npm run build

# Deploy to Firebase
firebase deploy
```

## Architecture

### Key Directories and Files

- `/src/app` - Next.js App Router structure with page components
- `/src/app/components` - Reusable components
  - `/layout` - Global layout components (Header, Footer)
  - `/ui` - Shared UI components (ProductCard, SearchBox, etc.)
- `/src/lib/firebase` - Firebase configuration and data access functions
- `/src/contexts` - React context providers (WishlistContext)
- `/src/hooks` - Custom React hooks (useWishlist)
- `/public` - Static assets

### Firebase Integration

- `config.js` - Firebase initialization
- `products.js` - Functions for product data access
- `bonuses.js` - Functions for bonus data access
- Data models use Firestore collections for: products, bonuses, actors, and tags


### Core Features

1. **Product Browsing**
   - List products with filtering by year, tag, or voice actor
   - Search functionality across product titles, makers, and cast
   - Detailed product view showing related bonuses
   - Wishlist functionality to save favorite products

2. **Navigation Pages**
   - Year-based browsing (/years, /year/[year])
   - Tag-based browsing (/tags, /tag/[tag])
   - Voice actor browsing (/actors, /actor/[name])
   - Product search page (/search)

## Important Patterns

### Data Fetching

- Server-side rendering for all pages (Static Site Generation)
- Firestore queries in `/src/lib/firebase/*.js` files
- generateStaticParams for dynamic routes

### State Management

- Wishlist state managed via React Context API
- Local storage persistence for wishlist items

### SEO and Metadata

- Schema.org structured data in SchemaOrg.js
- Metadata fields in page.js components

## Notes for Development

- Environment variables for Firebase should be set in `.env.local` file
- Firebase rules are defined in `firestore.rules`
- The app uses Static Site Generation (SSG) for all pages
- Admin functionality has been moved to a separate project
- The site is optimized for SEO with proper metadata and structured data