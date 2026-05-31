# Refactor Homepage Product Showcase Section

This plan details the implementation of a new interactive Product Showcase section on the Homepage, featuring category tabs, Montserrat typography, and a premium product card layout utilizing the new Supabase database structure.

## Proposed Changes

### 1. Update Product Types

#### [MODIFY] [product-card.tsx](file:///d:/dev/VF-%C3%94%20t%C3%B4/VinfastXanhMekong/components/client/product-card.tsx)
- Update `ProductDisplay` interface to support the new database fields:
  ```typescript
  tagline?: string | null;
  homepage_specs?: {
      range?: string;
      charge_time?: string;
      segment?: string;
  } | null;
  sale_status?: 'available' | 'booking' | 'coming_soon' | null;
  ```

### 2. Create the Interactive Product Showcase Component

#### [NEW] [product-showcase.tsx](file:///d:/dev/VF-%C3%94%20t%C3%B4/VinfastXanhMekong/components/client/product-showcase.tsx)
- A client-side component (`'use client';`) that receives all products as a prop.
- Filters products into two lists:
  - **Dòng xe tư nhân**: Products where `category === 'dong_co_dien'`
  - **Dòng xe dịch vụ**: Products where `category === 'dich_vu'`
- **Interactive Tabs UI:**
  - Tab 1: **DÒNG XE TƯ NHÂN**
  - Tab 2: **DÒNG XE DỊCH VỤ**
  - Styled with Montserrat font, uppercase, active tab has VinFast Blue (`bg-vinfast-blue`) with white text, and a smooth animation transition on switch.
- **Premium Card Grid:**
  - Responsive grid layout: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8` (full responsiveness).
  - Premium cards containing:
    - **Top Badge:** Displays `sale_status` text dynamically with soft backgrounds:
      - `available`: Green background with green text ("Sẵn sàng bàn giao")
      - `booking`: Amber background with amber text ("Đặt cọc trước")
      - `coming_soon`: Gray background with gray text ("Sắp ra mắt")
    - **Image:** Dynamic loading with CSS hover zoom (`hover:scale-105 transition-transform duration-500`).
    - **Name & Tagline:** Name in Montserrat bold font; tagline in a lighter, italic, gray color.
    - **Specs Highlight Grid (2 Columns):** Minimalist icons (using Lucide-React like `Zap`/`MapPin`/`Compass` etc.) displaying `homepage_specs.range` and `homepage_specs.segment`.
    - **CTA Buttons:** Side-by-side buttons:
      - "Xem chi tiết": Outline styled link to `/products/[slug]`.
      - "Nhận báo giá": Solid styled button that triggers the Lead Form / callback action.

### 3. Update Homepage Server Fetching

#### [MODIFY] [page.tsx](file:///d:/dev/VF-%C3%94%20t%C3%B4/VinfastXanhMekong/app/%28client%29/%28home%29/page.tsx)
- Update the Supabase select query to fetch `tagline`, `homepage_specs`, `sale_status`.
- Fetch all active products in a single database query.
- Import the new `<ProductShowcase products={products} />` component.
- Replace the three old `<ProductSection />` sections on the Homepage.

## Verification Plan

### Automated Build Verification
- Proactively run `npm run build` to verify compiling integrity.

### Manual Verification
- Access the homepage, verify the tabs switch between Private and Service vehicles cleanly.
- Verify typography styles, CTA hover states, and card image zoom transitions.
