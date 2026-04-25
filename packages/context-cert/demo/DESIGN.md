---
name: Clinical Excellence
colors:
  surface: '#fcf8fa'
  surface-dim: '#dcd9db'
  surface-bright: '#fcf8fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f5'
  surface-container: '#f0edef'
  surface-container-high: '#eae7e9'
  surface-container-highest: '#e4e2e4'
  on-surface: '#1b1b1d'
  on-surface-variant: '#45464d'
  inverse-surface: '#303032'
  inverse-on-surface: '#f3f0f2'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#006398'
  on-secondary: '#ffffff'
  secondary-container: '#5bb8fe'
  on-secondary-container: '#00476e'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#191c1e'
  on-tertiary-container: '#818486'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#cce5ff'
  secondary-fixed-dim: '#93ccff'
  on-secondary-fixed: '#001d31'
  on-secondary-fixed-variant: '#004b73'
  tertiary-fixed: '#e0e3e5'
  tertiary-fixed-dim: '#c4c7c9'
  on-tertiary-fixed: '#191c1e'
  on-tertiary-fixed-variant: '#444749'
  background: '#fcf8fa'
  on-background: '#1b1b1d'
  surface-variant: '#e4e2e4'
typography:
  h1:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h2:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  h3:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: '0'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  label-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0.02em
  label-xs:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  container-max: 1280px
  gutter: 24px
---

## Brand & Style

The visual identity of this design system is rooted in the concepts of **precision, authority, and clarity**. As a medical certification platform, the aesthetic must transcend simple utility to establish a "High-Trust" environment. The style is categorized as **Corporate / Modern**, leaning heavily into clinical minimalism to reduce cognitive load during complex examinations and administrative tasks.

The UI should feel institutional yet contemporary—avoiding the dated look of legacy medical software while maintaining the gravitas required for professional licensure. Every element is designed to feel intentional and stable, utilizing a cold-to-neutral color temperature that evokes a sterile, high-standard medical environment.

## Colors

The palette is anchored by **Deep Medical Blue**, used for headers, primary navigation, and high-level structural elements to project authority. **Clean Whites** and very light cool-greys form the canvas, ensuring that the "clinical" feel is maintained through high-contrast legibility.

Action colors are purposeful and restrained:
- **Primary Action:** A dependable medium blue for standard interactions.
- **Success (Approved):** A desaturated, professional forest green that signals validation without being neon or distracting.
- **Error (Rejected):** A muted crimson used sparingly for critical alerts and rejection statuses.
- **Surface Neutrals:** A range of slate-tinted greys used to differentiate dashboard panels from the main background.

## Typography

This design system utilizes **Inter** across all levels. Inter was chosen for its exceptional tall x-height and geometric clarity, which are essential for reading dense medical questions and data tables. 

**Headlines** use a tighter letter-spacing and heavier weights to command attention in administrative contexts. **Body text** utilizes a generous line height (1.6) to ensure long-form medical case studies remain readable. **Labels** (used in badges and metadata) are often presented in Medium or Semi-Bold weights to ensure they are distinct from surrounding body copy, even at small sizes.

## Layout & Spacing

The layout philosophy follows a **Fixed Grid** model for administrative dashboards to maintain consistency across different screen sizes, while exam interfaces use a centered, focused column. 

A 12-column system is used for the dashboard, with 24px gutters. Margin and padding follow a strict 4px / 8px incremental scale. High-trust design requires "breathability"—avoid crowding components. Use the `xl` (48px) spacing unit to separate major logical sections, such as the transition from a certification header to the question modules.

## Elevation & Depth

To maintain a "clinical" and "flat" aesthetic, this design system avoids heavy, dark shadows. Instead, it employs **Tonal Layering** and **Low-Contrast Outlines**.

1.  **Level 0 (Background):** The base color of the application (#F8FAFC).
2.  **Level 1 (Cards/Panels):** Pure white (#FFFFFF) with a 1px border in a light slate gray.
3.  **Level 2 (Active Elements/Popovers):** A very soft, diffused ambient shadow (Color: Primary Blue at 5% opacity, Blur: 12px) to indicate interaction or focus.

Interactive elements like "Question Cards" should feel like physical sheets of paper—defined by their edges rather than their depth.

## Shapes

The shape language of this design system is **Soft**. A 4px (0.25rem) corner radius is the standard for buttons, input fields, and small cards. This subtle rounding removes the aggressive sharpness of a strictly square "Brutalist" grid but retains a sense of precision and professional rigor.

Large containers like "Certification Previews" or "Dashboard Sections" may use a 0.5rem (rounded-lg) radius to create a slightly more modern, approachable feel for the user's primary workspace. Status badges (Approved/Rejected) utilize a full pill-shape to distinguish them from interactive buttons.

## Components

### Status Badges
Badges use a "Low-Saturation Fill" approach. 
- **Approved:** Light green background with dark green text.
- **Rejected:** Light red background with dark red text.
- **Draft:** Light gray background with slate text.
- *Styling:* Pill-shaped (fully rounded), uppercase label-xs typography.

### Question Cards
These are the primary interaction points for candidates. 
- **Header:** Contains the question number and "Flag for Review" action.
- **Content:** H3 for the question text, followed by body-md for clinical context.
- **Options:** Bordered containers with a 4px radius. On hover, the border shifts to Primary Blue. On select, the background becomes a faint tint of the primary color.

### Administrative Dashboards
Dashboards utilize a sidebar-heavy layout. 
- **Data Tables:** Use alternating row stripes (Zebra striping) in tertiary_color_hex for high-density data.
- **Action Buttons:** Primary buttons are solid Deep Blue; secondary buttons are outlined.

### Certification Previews
A specialized card component that mimics the final certificate. It should include a subtle watermark or faint organizational seal in the background and use H2 typography for the candidate's name to emphasize the gravity of the achievement.