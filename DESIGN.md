---
name: Xtatistix
colors:
  surface: "#f5f5f4"
  surface-dim: "#e5e5e5"
  surface-bright: "#ffffff"
  surface-container-lowest: "#ffffff"
  surface-container-low: "#f9fafb"
  surface-container: "#f5f5f4"
  surface-container-high: "#e5e7eb"
  surface-container-highest: "#d4d4d8"
  on-surface: "#18181b"
  on-surface-variant: "#71717a"
  inverse-surface: "#262624"
  inverse-on-surface: "#ffffff"
  outline: "#d4d4d8"
  outline-variant: "#e5e5e5"
  surface-tint: "#003CBD"
  primary: "#003CBD"
  on-primary: "#ffffff"
  primary-container: "#EBF2FF"
  on-primary-container: "#1E3A8A"
  inverse-primary: "#93C5FD"
  secondary: "#19C480"
  on-secondary: "#ffffff"
  secondary-container: "#EBF7F2"
  on-secondary-container: "#0A7C5C"
  tertiary: "#3a3a38"
  on-tertiary: "#ffffff"
  tertiary-container: "#d4d4d8"
  on-tertiary-container: "#18181b"
  error: "#FD2C30"
  on-error: "#ffffff"
  error-container: "#FFF5F5"
  on-error-container: "#B80D10"
  background: "#f5f5f4"
  on-background: "#18181b"
  surface-variant: "#f3f4f6"
typography:
  display:
    fontFamily: "Inter"
    fontSize: "24px"
    fontWeight: "700"
    lineHeight: "32px"
  headline-lg:
    fontFamily: "Inter"
    fontSize: "20px"
    fontWeight: "700"
    lineHeight: "28px"
  headline-md:
    fontFamily: "Inter"
    fontSize: "18px"
    fontWeight: "700"
    lineHeight: "22px"
  body-lg:
    fontFamily: "Inter"
    fontSize: "14px"
    fontWeight: "400"
    lineHeight: "22px"
  body-md:
    fontFamily: "Inter"
    fontSize: "13px"
    fontWeight: "400"
    lineHeight: "21px"
  label-md:
    fontFamily: "Inter"
    fontSize: "12px"
    fontWeight: "500"
    lineHeight: "16px"
  label-sm:
    fontFamily: "Inter"
    fontSize: "11px"
    fontWeight: "500"
    lineHeight: "14px"
rounded:
  sm: "0.25rem"
  DEFAULT: "0.5rem"
  md: "0.375rem"
  lg: "0.5rem"
  xl: "0.75rem"
  3xl: "1.5rem"
  full: "9999px"
spacing:
  base: "8px"
  xs: "4px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.lg}"
    padding: "{spacing.sm}"
  button-secondary-blue:
    backgroundColor: "{colors.primary-container}"
    textColor: "{colors.primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.lg}"
    padding: "{spacing.sm}"
  button-secondary-green:
    backgroundColor: "{colors.secondary-container}"
    textColor: "{colors.secondary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.lg}"
    padding: "{spacing.sm}"
  badge-blue:
    backgroundColor: "{colors.primary-container}"
    textColor: "{colors.primary}"
    rounded: "{rounded.lg}"
    padding: "2px 10px"
    typography: "{typography.label-sm}"
  badge-green:
    backgroundColor: "{colors.secondary-container}"
    textColor: "{colors.secondary}"
    rounded: "{rounded.lg}"
    padding: "2px 10px"
    typography: "{typography.label-sm}"
  sidebar:
    backgroundColor: "{colors.on-primary-container}"
    textColor: "{colors.on-primary}"
---

## Brand & Style
The **Xtatistix** design system balances a highly functional, data-dense interface with a premium, focused aesthetic. The interface is meticulously structured to handle complex statistics and lists without looking cluttered. 

The aesthetic leverages structured components tailored for data tables (e.g. Handsontable), analytical dashboards, and administrative sidebars. By standardizing component radii, a consistent set of grays, and precise brand blues and greens, the application commands trust and signals professional-grade reliability. Dynamic elements like pulsing skeletons and animated badge shines provide subtle interactivity.

## Colors
The app utilizes a dual-theme strategy combining carefully crafted neutrals with vibrant semantic accents. Dark mode is treated as a first-class citizen, featuring an overarching `#262624` primary background.

- **Brand Blue:** The core identity color (`#003CBD`). Used for primary actions, sidebar menus, and active states. It offers a soft container tint (`#EBF2FF`) used throughout for backgrounds on secondary blue actions.
- **Brand Green:** Used for secondary positive confirmations (`#19C480`), creating an association with success and balance.
- **Neutrals for Data:** A refined set of grayscale variables manages surfaces from the deepest background (`#f5f5f4`) to white focal-point cards (`#ffffff`).
- **Dark Mode Reversals:** Specific classes and tokens handle dark mode elegantly, swapping `bg-primary` for deep gray (`#262624`) and elevating panels using step-ups in lightness (`#30302e` & `#3a3a38`).

## Typography
The system employs the **Inter** font family, optimizing legibility for highly detailed tabular data and administrative interfaces. 

- **Dynamic Scales:** Core font sizes (`heading` and `body`) utilize CSS clamps to smoothly adapt between screen widths. This ensures that data visualization charts and data tables retain structural integrity across platforms. 
- **Distinct Weights:** A strong `700` font weight separates headings from the standard data records, preventing the user eye from getting lost in large tables.
- **Information Hierarchy:** Smaller, muted labels (e.g., `text-muted` or `text-tertiary`) consistently demote metadata to allow primary cell contents or names to shine.

## Layout & Spacing
A 16-column underlying grid logic with strict spacing limits informs all screen division.

- **Sidebars & Panels:** Fixed widths on primary structural elements (like the `280px` Admin Sidebar) establish rigid zones, while central areas are flexible. 
- **Density Controls:** Padding within `primary-blue-button` or `secondary-blue-button` is responsive (`px-2.5 sm:px-3.5`), scaling the interface up gracefully on larger screens while preserving compact heights necessary for data entry on laptops. 

## Elevation & Depth
Elevation is primarily conveyed through container color contrast and moderate shadows rather than extreme layering.

- **Modal Depth:** Dark and light mode modals leverage strong background contrast (`bg-secondary` vs page `bg-primary`) to create spatial focus. Modals carry a `shadow-lg` and sometimes introduce a dark or translucent overlay backdrop (`--wrap-surface`).
- **Surface Transitions:** Instead of massive drop shadows, tables and data views differentiate rows with slight background tonal shifts (`bg-tertiary` for hovers, zebra lines in `handsontable`), avoiding unnecessary visual noise.

## Shapes
Corners are notably rounded, keeping the dense statistical data from looking too rigid or hostile.

- **Buttons & Core Inputs:** Standardized to a friendly `rounded-lg` (`0.5rem`).
- **Floating Indicators:** Badges (`.app-badge--float`) and circular pills are strictly `rounded-full` (`9999px`) to pop out from the grid structure.
- **Major Cards:** Large focal content blocks or dashboard metric cards adopt expansive `rounded-3xl` (`1.5rem`) corners to mark the boundaries of independent micro-applications or widgets on the page. 
- **Micro-Interactions:** Custom badge shapes combined with complex layered gradients and inner shines simulate premium, "jewelry-like" visual markers indicating premium or special-test statuses.
