---
name: Clarion Vision
colors:
  surface: '#f9f9ff'
  surface-dim: '#dad9df'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f9'
  surface-container: '#eeedf3'
  surface-container-high: '#e8e7ee'
  surface-container-highest: '#e2e2e8'
  on-surface: '#1a1c20'
  on-surface-variant: '#434750'
  inverse-surface: '#2f3035'
  inverse-on-surface: '#f1f0f6'
  outline: '#737781'
  outline-variant: '#c3c6d2'
  surface-tint: '#365e9e'
  primary: '#0d3f7e'
  on-primary: '#ffffff'
  primary-container: '#2e5797'
  on-primary-container: '#b7ceff'
  inverse-primary: '#abc7ff'
  secondary: '#006c4e'
  on-secondary: '#ffffff'
  secondary-container: '#83f5c6'
  on-secondary-container: '#007151'
  tertiary: '#5f3700'
  on-tertiary: '#ffffff'
  tertiary-container: '#804b00'
  on-tertiary-container: '#ffc284'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d7e3ff'
  primary-fixed-dim: '#abc7ff'
  on-primary-fixed: '#001b3f'
  on-primary-fixed-variant: '#184685'
  secondary-fixed: '#86f8c9'
  secondary-fixed-dim: '#68dbae'
  on-secondary-fixed: '#002115'
  on-secondary-fixed-variant: '#00513a'
  tertiary-fixed: '#ffdcbd'
  tertiary-fixed-dim: '#ffb86d'
  on-tertiary-fixed: '#2c1600'
  on-tertiary-fixed-variant: '#683c00'
  background: '#f9f9ff'
  on-background: '#1a1c20'
  surface-variant: '#e2e2e8'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
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
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  container-padding: 20px
  grid-gutter: 16px
---

## Brand & Style

The design system focuses on clarity, intention, and progress. It is built for a goal-oriented audience that values mental space and organized visualization. The brand personality is encouraging yet disciplined, utilizing a **Minimalist** design style to reduce cognitive load.

The UI evokes a sense of "digital zen" through heavy use of whitespace, a restricted color palette, and soft, tactile elements. By removing unnecessary ornamentation, the system ensures that user-generated content (images, goals, and dreams) remains the focal point while the interface provides a supportive, high-quality framework.

## Colors

The palette is rooted in stability and growth. 
- **Primary Blue (#2E5797)** is used for core actions, navigation states, and primary progress indicators, representing focus and reliability.
- **Secondary Green (#1D9E75)** is reserved for success states, completed milestones, and positive reinforcement.
- **Surface Gray (#F3F4F6)** provides a subtle distinction between the canvas and interactive containers, preventing the interface from feeling "flat" while maintaining high brightness.
- **Neutral Scales** rely on a range of grays to establish hierarchy, with pure white used exclusively for the most elevated card surfaces.

## Typography

This design system utilizes **Inter** for its systematic, utilitarian nature. It scales perfectly from dense data views to large, emotive headings.

- **Headlines:** Use SemiBold (600) or Bold (700) weights with slightly tightened letter-spacing to create a strong visual anchor for cards and sections.
- **Body Text:** Standardized at 16px for readability, using the Regular (400) weight. 
- **Labels:** Use Medium (500) or SemiBold (600) weights at smaller sizes (12px-14px) for category chips and navigation labels to ensure legibility against colored backgrounds.

## Layout & Spacing

The layout follows a **Fluid Grid** model optimized for mobile constraints. 

- **Margins:** A standard 20px "Safe Area" margin is applied to the left and right of all screens.
- **Grid:** Content is organized in a 2-column grid for vision board items, using a 16px gutter. Stats and detailed views transition to a single-column stack.
- **Rhythm:** An 8pt linear scale is used for all spatial relationships. Use 16px (md) for padding within cards and 24px (lg) for vertical spacing between distinct content groups.

## Elevation & Depth

This design system uses **Tonal Layering** combined with **Ambient Shadows** to create a soft, approachable depth.

1.  **Level 0 (Background):** Pure #FFFFFF or #F3F4F6.
2.  **Level 1 (Cards/Floating Elements):** Pure #FFFFFF with a 10% opacity shadow (0px 4px 20px rgba(0,0,0,0.06)).
3.  **Active State:** When a card is pressed, it should subtly scale down (98%) rather than increasing shadow, maintaining the "flat-soft" aesthetic.

Shadows should never be harsh; they act as a "glow" of negative space to lift elements off the surface gray background.

## Shapes

The shape language is defined by a consistent **16px (1rem) corner radius** for all primary containers (Cards, Modals, Input Fields). 

- **Small Components:** Chips and buttons use a fully rounded "Pill" shape to contrast against the softer, rectangular cards.
- **Progress Bars:** These should use a 4px radius for the track and the fill to maintain a clean, modern look without becoming overly "bubbly."

## Components

### Cards
Cards are the primary vehicle for vision board items. They feature a 1:1 or 4:5 aspect ratio image at the top, followed by a title and a linear **Progress Bar**. The progress bar should use a #F3F4F6 track color with a #2E5797 fill.

### Category Chips
Chips are used for filtering and tagging.
- **Unselected:** Gray background (#F3F4F6), dark text.
- **Selected:** Primary Blue (#2E5797) background, white text.

### Bottom Navigation
A fixed-position bar with 4 tabs: **Board, Stats, Badges, Profile**.
- Use 24px line-style icons.
- Active state: Icon and Label colored in #2E5797.
- Inactive state: Icon and Label in #9CA3AF.

### Buttons
- **Primary:** Solid #2E5797 with white text, pill-shaped.
- **Secondary:** Outlined with 1.5px border in #2E5797, pill-shaped.

### Input Fields
Soft #F3F4F6 background with 16px rounded corners. No border by default, moving to a 1.5px #2E5797 border on focus.