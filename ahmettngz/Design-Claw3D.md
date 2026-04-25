# Design.md

## 1. Project Overview
Claw3D is a gateway-first Next.js application designed to visualize and operate AI agents in a 3D environment. It serves as the visualization and interaction layer for AI systems like OpenClaw or Hermes.

## 2. Design System / UI Framework
*   **Core Framework:** React 19 integrated within Next.js (App Router).
*   **3D Engine:** Three.js, specifically utilized through React Three Fiber (`@react-three/fiber`) and Drei (`@react-three/drei`) for declarative 3D scene construction.
*   **2D Interactivity / Builders:** Phaser is used for specific interactive surfaces, such as the office builder UI.
*   **UI Components:** The project utilizes a modular UI component approach, relying on atomic components managed via `components.json` (typical of a shadcn/ui or similar tailored component library setup).

## 3. Styling Language / CSS Strategy
*   **Utility-First CSS:** Tailwind CSS v4 is the primary styling engine.
*   **Class Management:** `class-variance-authority` (CVA) is used alongside `clsx` and `tailwind-merge` to handle component state variations and prevent class collisions seamlessly.
*   **Animations:** `tw-animate-css` for tailored, utility-driven animations.
*   **Iconography:** `lucide-react` is used consistently across the UI for lightweight, scalable vector icons.

## 4. Component Architecture
The architecture follows a strict **Feature-First Organization** rather than a flat component structure:
*   **`src/features/agents`**: Handles the standard 2D UI for agent workspaces, chat interfaces, settings, and runtime monitoring.
*   **`src/features/office`**: Manages the office screens, side panels, and the Phaser-based builder UI.
*   **`src/features/retro-office`**: Encapsulates the 3D WebGL context, actors, navigation meshes, and rendering logic.
*   **Separation of Concerns:** A clear boundary exists between the 2D DOM layer (Tailwind UI) and the 3D WebGL layer (React Three Fiber). The 2D UI components often act as contextual overlays on top of the 3D canvas.

## 5. Color Palette / Typography
*   **Theming Strategy:** Custom themes managed via Tailwind CSS (`app/globals.css` and PostCSS configuration).
*   **Typography:** Modern sans-serif stack, primarily relying on browser defaults customized via Tailwind's typography tokens.
*   **Aesthetics:** The design leans towards a "retro office" aesthetic with dynamic 3D elements combined with clean, modern UI panels for chat and settings.

## 6. Execution & State Management Design
*   **Gateway-Derived State:** The UI actively avoids creating its own parallel state. Instead, views (both 2D UI and 3D animations) are derived directly from real-time events streamed from the upstream WebSocket gateway.
*   **Local UI Preferences:** Studio-level settings (like layout preferences or focused agents) are strictly kept local and managed via Next.js server APIs.
