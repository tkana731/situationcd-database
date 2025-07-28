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
  - `/ui` - Shared UI components (ProductCard, BlogCard, SearchBox, etc.)
- `/src/lib/firebase` - Firebase configuration and data access functions
- `/src/contexts` - React context providers (WishlistContext)
- `/src/hooks` - Custom React hooks (useWishlist)
- `/public` - Static assets

### Firebase Integration

- `config.js` - Firebase initialization
- `products.js` - Functions for product data access
- `bonuses.js` - Functions for bonus data access
- `blogs.js` - Functions for blog post data access
- Data models use Firestore collections for: products, bonuses, actors, tags, and blog-posts

### Header Navigation

The header contains the following navigation items (in order):
- **ホーム** (Home) - `/`
- **作品一覧** (Products) - `/products`
- **声優** (Voice Actors) - `/actors`
- **タグ** (Tags) - `/tags`
- **ブログ** (Blog) - `/blog`
- **発売日** (Release Date) - Dropdown menu with `/years` and individual year pages
- **お気に入り** (Wishlist) - `/wishlist`

Note: The "サイトについて" (About) link has been removed from the header to reduce menu crowding and is accessible via the footer instead.

### Core Features

1. **Product Browsing**
   - List products with filtering by year, tag, or voice actor
   - Search functionality across product titles, makers, and cast
   - Detailed product view showing related bonuses
   - Wishlist functionality to save favorite products
   - Homepage displays latest blog posts (top 3) and upcoming products
   - Recommended products section shown on wishlist page bottom

2. **Homepage Features**
   - Search box for quick product search
   - Upcoming products section (近日発売予定) showing 8 latest upcoming products
   - Latest blog posts section (ブログ新着記事) displaying top 3 recent posts
   - Popular tags section with top 10 tags
   - Popular voice actors section with top 10 actors
   - Site update history section (サイト更新履歴) using UpdateHistory component

3. **Blog System**
   - Blog post listing page (/blog) with WordPress-style horizontal layout
   - Individual blog post pages (/blog/[slug]) with comprehensive styling
   - Blog posts fetched from Firestore blog_posts collection
   - Support for categories, tags, thumbnails, and rich markdown content
   - Full markdown-to-HTML conversion with custom styling
   - SEO-optimized server-side rendering with proper heading hierarchy

4. **Navigation Pages**
   - Year-based browsing (/years, /year/[year])
   - Tag-based browsing (/tags, /tag/[tag])
   - Voice actor browsing (/actors, /actor/[name])
   - Product search page (/search)
   - Blog section (/blog, /blog/[slug])

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
- Blog posts with proper Open Graph metadata and structured markup

### Blog Content Styling

The blog system uses server-side markdown processing with comprehensive styling:

**Markdown Processing:**
- Uses `marked` library for markdown-to-HTML conversion
- Server-side styling injection for SEO optimization
- Custom HTML class injection for all markdown elements

**Typography Styling:**
- **Headings**: Hierarchical styling with pink underlines
  - H1: 2xl, thick pink-300 underline, large top margin (mt-12)
  - H2: xl, thick pink-200 underline, large top margin (mt-10)  
  - H3: lg, thin pink-200 underline, medium top margin (mt-8)
  - H4-H6: Progressively smaller with pink-100 underlines
- **Paragraphs**: Gray-700 text with relaxed leading and bottom margin
- **Links**: Pink-600 color matching site theme, hover effects
- **Lists**: Styled bullets/numbers with proper spacing
- **Code**: Inline code with pink-600 text and gray background
- **Blockquotes**: Left pink border with light background
- **Tables**: Full borders with gray styling and pink accents

**Layout Features:**
- Breadcrumb navigation with automatic home link
- Back-to-blog navigation links
- Responsive design with proper mobile support
- Tag display with hover effects
- Publication date and category badges

## Notes for Development

- Environment variables for Firebase should be set in `.env.local` file
- Firebase rules are defined in `firestore.rules`
- The app uses Static Site Generation (SSG) for all pages
- Admin functionality has been moved to a separate project
- The site is optimized for SEO with proper metadata and structured data