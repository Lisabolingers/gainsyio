# Gainsy.io - Product Requirements Document (PRD)

## 1. Introduction
Gainsy.io is a modern e-commerce management platform designed for users who sell on multiple marketplaces like Etsy, Shopify, Amazon, eBay, and Wallart. It centralizes processes such as product listing, design creation, SEO optimization, multi-store monitoring, and AI-assisted automation into a single interface.

## 2. Target Audience
- Individual or small business owners actively selling on platforms like Etsy, Shopify, Amazon, eBay, and Wallart
- Especially those managing multiple stores or selling personalized products

## 3. Problem
Sellers currently rely on a variety of separate tools to manage their products, create mockups, generate SEO content, and monitor store performance. This results in time loss, data fragmentation, and management complexity.

## 4. Solution
Gainsy.io brings all operations into a single panel, saving time, reducing error rates, and letting users focus on their creative output. It emphasizes AI-driven automation and modern UI.

## 5. Product Features

### Dashboard
- Primary panel after login showing store performance
- Displays sales, orders, top products, SEO status, and activity logs based on selected store

### Store
- Connect/manage marketplaces: Etsy, Shopify, Amazon, eBay, Wallart
- Add/remove stores and view store-specific configurations

### Products
- Display product lists based on the selected store
- Enable filtering and keyword-based search

### Analytics
- In-depth statistics per product
- Metrics: views, sales, favorites, conversion rates

### Templates (5 sections in one page)
1. **Listing Templates** - Import and edit an Etsy product as a reusable listing template
2. **Mockup Templates** - Upload a mockup and define text/design areas
3. **Auto Text to Image** - Define visual style for dynamic text placeholders (includes font selection)
4. **Update Templates** - Predefined structures for product descriptions and variations
5. **Store Images** - Upload standard store visuals that auto-apply during product creation

### Listing
- Enter a search term → fetch top 5 most-favorited Etsy listings
- For each:
  - Title (H1 input)
  - Tags (H3 input)
  - Store selection → links to store's mockup/store images
  - Template selection
  - **Auto Design**: use auto text-to-image templates, save result to Temporary Files (24h lifespan)
  - **Upload Design**: manually upload black/white design files (not saved)
- Final screen includes:
  - Mockup/store image previews (10 slots)
  - AI-generated titles and tags
  - Selected listing template
  - Etsy send button

### My Fonts
- Upload custom fonts (e.g., .ttf, .otf)
- Fonts available in dropdown menus across platform
- Page includes: font search, A–Z sort, Add Font button, delete option

### Temporary Files
- AI-generated visual files stored temporarily for 24 hours

### Library, Personalize, Transfer
- Modules under development, to be defined in future releases

## 6. Technical Requirements

### Tech Stack
- **Frontend**: React + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Hosting**: Netlify or Vercel (frontend), optional Flask API (DigitalOcean)
- **AI**: OpenAI GPT-4 & DALL·E via Make.com integration

### Libraries
- Zustand, react-hook-form, zod, lucide-react, axios
- html-to-image, konva, svg.js, uuid, date-fns

### Project Structure
src/
├── components/
├── pages/
├── features/
│   ├── dashboard/
│   ├── store/
│   ├── listing/
│   ├── templates/
│   └── fonts/
├── context/
├── hooks/
├── lib/
├── types/
├── utils/
└── styles/

### Security
- Supabase RLS must be active
- Font/mockup uploads should validate type/size
- Temporary files should auto-delete after 24h

## 7. Success Metrics
- Number of active users
- Average session duration
- Number of listings sent to Etsy
- CTR on AI-generated titles

## 8. Roadmap
- Define and implement Library, Personalize, Transfer modules
- Expand integrations beyond Etsy
- Automate listing & SEO scoring using AI
