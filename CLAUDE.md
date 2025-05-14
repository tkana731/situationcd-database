# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js application that serves as a database for situation CDs (voice dramas), primarily built with:

- Next.js (App Router)
- Firebase/Firestore
- TailwindCSS
- React

The site allows users to browse and search for voice drama products, view product details, and filter by tags, voice actors, or release year. An admin section provides functionality for managing products and bonuses.

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
  - `/admin` - Admin-specific components (forms, selectors)
  - `/layout` - Global layout components (Header, Footer)
  - `/ui` - Shared UI components (ProductCard, SearchBox, etc.)
- `/src/lib/firebase` - Firebase configuration and data access functions
- `/public` - Static assets

### Firebase Integration

- `config.js` - Firebase initialization
- `products.js` - Functions for product data access
- `bonuses.js` - Functions for bonus data access
- Data models use Firestore collections for: products, bonuses, actors, and tags

### Authentication

Admin routes (`/admin/*`) are protected with Firebase Authentication.

### Core Features

1. **Product Browsing**
   - List products with filtering by year, tag, or voice actor
   - Search functionality across product titles, makers, and cast
   - Detailed product view showing related bonuses

2. **Admin Dashboard**
   - Product management (add/edit/delete)
   - Bonus management (add/edit/delete)
   - CSV import tool for bulk product additions
   - Migration utilities for URL handling

## Important Patterns

### Data Fetching

- Server-side rendering for public pages
- Client-side fetching for admin pages
- Firestore queries in `/src/lib/firebase/*.js` files

### Forms

- Form components in `/src/app/components/admin/`
- Form state management with React useState/useEffect
- Firebase operations for saving data

### SEO and Metadata

- Schema.org structured data in SchemaOrg.js
- Metadata fields in page.js components

## Notes for Development

- Environment variables for Firebase should be set in `.env.local` file
- Firebase rules are defined in `firestore.rules`
- The app uses both static and dynamic routes (see Next.js app router pattern)
- Admin functionality requires proper Firebase Authentication credentials