---
name: Sistem Informasi Pendapatan Wisata Daerah
colors:
  surface: '#f7f9fc'
  surface-dim: '#d8dadd'
  surface-bright: '#f7f9fc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f7'
  surface-container: '#eceef1'
  surface-container-high: '#e6e8eb'
  surface-container-highest: '#e0e3e6'
  on-surface: '#191c1e'
  on-surface-variant: '#43474d'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f4'
  outline: '#74777e'
  outline-variant: '#c3c6ce'
  surface-tint: '#466080'
  primary: '#001d37'
  on-primary: '#ffffff'
  primary-container: '#16324f'
  on-primary-container: '#809abd'
  inverse-primary: '#aec9ed'
  secondary: '#0051d5'
  on-secondary: '#ffffff'
  secondary-container: '#316bf3'
  on-secondary-container: '#fefcff'
  tertiary: '#00201d'
  on-tertiary: '#ffffff'
  tertiary-container: '#003733'
  on-tertiary-container: '#4fa69d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d2e4ff'
  primary-fixed-dim: '#aec9ed'
  on-primary-fixed: '#001d37'
  on-primary-fixed-variant: '#2e4867'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#9cf2e8'
  tertiary-fixed-dim: '#80d5cb'
  on-tertiary-fixed: '#00201d'
  on-tertiary-fixed-variant: '#00504a'
  background: '#f7f9fc'
  on-background: '#191c1e'
  surface-variant: '#e0e3e6'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.04em
  metric-display:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

The design system establishes a high-integrity, institutional digital standard for civic maritime management and revenue intelligence in South Lampung. Designed for administrative governance, regional tourism operators, and executive oversight, the aesthetic blends authoritative maritime heritage with state-of-the-art analytical rigor.

### Personality & Tone
- **Authoritative & Trustworthy:** Built upon deep maritime navy tones that command respect, civic legitimacy, and accountability.
- **Data-Driven & Sharp:** Precision-first visual rhythm designed to present regional taxation, real-time ticket auditing, and venue performance metrics with zero ambiguity.
- **Oceanic Modernity:** Modern public-sector clarity infusing subtle coastal accents (coastal teal and crisp atmospheric slate) without sacrificing governmental dignity.

### Aesthetic Movement
Modern Institutional / Analytic Minimalism. The UI avoids decorative coastal tropes (no illustrative shells or casual beach waves) in favor of high-density tabular modules, high-contrast metric indicators, precision-milled borders, and structural hierarchy tailored for civic auditing operations.

## Colors

The palette leverages strict public-sector role division to guarantee accessibility and effortless situational awareness.

### Role Architecture
- **Primary (`#16324F`):** Institutional Deep Navy. Reserved for global navigation panels, top-level headers, primary table headers, and sovereign branding elements.
- **Secondary / Action (`#2563EB`):** Interactive High-Utility Blue. Applied to primary transactional triggers, data download confirmations, and active navigational items. Hover transitions to `#1D4ED8`.
- **Tertiary / Maritime Accent (`#0F766E`):** Coastal Teal. Signifies fiscal projections, environmental/destination performance metrics, and secondary analytical callouts.
- **Canvas Neutral (`#F5F7FA`):** Low-strain, neutral slate background providing optical separation for pure white content cards (`#FFFFFF`) bordered by `#E2E8F0`.

### Regulatory Status Colors
Operational statuses follow explicit background-to-ink pairings to meet WCAG AA requirements:
- **Sukses (Settled / Verified):** Ink `#16A34A` on Surface `#DCFCE7`
- **Peringatan (Threshold / Caution):** Ink `#D97706` on Surface `#FEF3C7`
- **Menunggu (Pending / In-Review):** Ink `#F59E0B` on Surface `#FEF9C3`
- **Galat (Rejected / Deficit):** Ink `#DC2626` on Surface `#FEE2E2`
- **Info (Informational / Synchronizing):** Ink `#0284C7` on Surface `#E0F2FE`

## Typography

The typography couples the modern, authoritative geometry of **Plus Jakarta Sans** for headlines and high-level fiscal figures with the clinical legibility of **Inter** for audit trails, tabular registers, and interactive fields.

### Regional Data Formatting Rules
- **Monetary Values (IDR):** Prefixed with standard currency syntax followed by a non-breaking space and full-stop thousands grouping (e.g., `Rp 15.000` or `Rp 245.850.000`). Displayed using tabular numerals (`tnum`) in Inter or bold Plus Jakarta Sans.
- **Date Standards:** Standard civic Indonesian formatting `DD/MM/YYYY` (e.g., `28/10/2025`).
- **Timestamp Conventions:** Strict 24-hour notation with localized indicator (e.g., `14:30 WIB`).

## Layout & Spacing

The system enforces a 12-column analytical desktop layout with structured collapsing for fieldwork tablets and mobile inspections.

### Breakpoints & Structure
- **Desktop (≥ 1280px):** Fixed 260px administrative primary sidebar paired with a 12-column fluid grid. Gutters are locked to `1.5rem` (24px) with `2rem` (32px) margins around metric cards.
- **Tablet (768px - 1279px):** Collapsed 72px icon-only navigation rail. Grid condenses to 6 columns with `1rem` (16px) gutters.
- **Mobile (< 768px):** Off-canvas slideover navigation drawer. Grid adapts to single-column or 2-column KPI blocks with `1rem` margins.

### Spatial Rhythms
Metric cards and analytics widgets adhere strictly to vertical increments of 8px (`0.5rem`, `1rem`, `1.5rem`, `2rem`), establishing consistent tabular baselines and clean data alignments.

## Elevation & Depth

Visual hierarchy relies on structural borders reinforced with restrained, tinted ambient shadows that reflect the maritime navy palette. Heavy blurs and floating neomorphic shadows are strictly disallowed in favor of crisp administrative discipline.

### Depth Scales
- **Base Level (Canvas):** Flat `#F5F7FA` foundation with no shadow.
- **Card Tier 1 (Metrics, Data Tables, Charts):** Solid `#FFFFFF` fill with a `1px` structural outline in `#E2E8F0` and an ambient tint:
  `box-shadow: 0 4px 12px rgba(22, 50, 79, 0.05);`
- **Interactive Hover Tier:** Elevation subtly lifts card boundaries on interactive rows:
  `box-shadow: 0 6px 16px rgba(22, 50, 79, 0.08);`
- **Overlay Tier (Modals, Fiscal Drawers, Filter Dropdowns):** Maximum operational focus:
  `box-shadow: 0 12px 32px rgba(22, 50, 79, 0.12);` border: `1px solid #CBD5E1`.

## Shapes

The design uses balanced, modern radii to project administrative reliability without visual harshness.

### Curvature Guidelines
- **Analytics Cards & Containers:** Standardized at `0.75rem` to `0.875rem` (12px to 14px) for metric blocks, charting enclosures, and dashboard sections.
- **Input Fields & Action Controls:** Set to `0.5rem` (8px) for buttons, select dropdowns, search bars, and date pickers.
- **Status Badges & Chips:** Rendered as full pills (`9999px`) to immediately distinguish transient metadata from static card perimeters.

## Components

### Buttons
- **Primary:** Background `#2563EB`, text `#FFFFFF`, radius `8px`, typography `label-lg`. Hover: `#1D4ED8`. Active: `#1E40AF`.
- **Secondary / Outline:** Background `transparent`, border `1px solid #E2E8F0`, text `#16324F`. Hover: Background `#F8FAFC`, border `#CBD5E1`.
- **GovTech Export / Utility:** Background `#0F766E`, text `#FFFFFF`. Used specifically for official ledger downloads and fiscal reports.

### Status Badges & Pills
Pill shape (`rounded-full`), padding `0.25rem 0.75rem`, typography `label-sm` with tabular positioning:
- **Verified / Settled:** Text `#16A34A`, background `#DCFCE7`, subtle border `1px solid #BBF7D0`.
- **Threshold / Warning:** Text `#D97706`, background `#FEF3C7`, subtle border `1px solid #FDE68A`.
- **Pending Reconciliation:** Text `#F59E0B`, background `#FEF9C3`, subtle border `1px solid #FEF08A`.
- **Deficit / Discrepancy:** Text `#DC2626`, background `#FEE2E2`, subtle border `1px solid #FECACA`.

### Metric Summary Cards (KPIs)
Pure white `#FFFFFF` surface, `1px solid #E2E8F0` border, `12px` roundedness, `1.5rem` internal padding. Top row contains the operational label (`label-md` in `#64748B`) and status pill. Center hosts the large numeric value in `metric-display` with currency formatting. Bottom row highlights comparative deltas versus the previous cycle.

### Data Tables
- **Header:** Background `#16324F`, text `#FFFFFF`, typography `label-md` uppercase, letter spacing `0.05em`.
- **Rows:** Alternating borders with `#F1F5F9`. Cell padding `1rem 1.25rem`. Alternating row hover state `#F8FAFC`.
- **Numeric Columns:** Strict right-alignment with tabular figures (`font-variant-numeric: tabular-nums`).

### Input Fields & Controls
Height `42px`, border `1px solid #CBD5E1`, border-radius `8px`, background `#FFFFFF`. Placeholder text in `#94A3B8`. Focus state applies a crisp ring: `2px solid #2563EB` with `0` offset.