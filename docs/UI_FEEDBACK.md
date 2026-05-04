# UI/UX Feedback Implementation Rules

These rules are extracted from current design reviews and must be followed by all agents working on the frontend.

## 1. Navigation & Discoverability
- Implement a **top-line navigation menu** with anchor links (Plan, Roadmap, Dashboard, etc.).
- The menu should help users discover sections below the fold.

## 2. Selection & Progress Tracking
- **Checkboxes**: Use explicit checkboxes for selecting courses. Do not use low-contrast background changes alone.
- **Progress Tracker**: Implement a sticky footer toolbar or a sidebar showing:
    - Count of selected courses.
    - Status of the planner (e.g., "Ready to build").
    - Optional: expandable summary of selected courses by semester.

## 3. Component Styling
- **Course Cards**: Must have a **unified height** to ensure grid stability.
- **Select Menus**: Ensure right-margin spacing for icons inside dropdowns.
- **Selected State**: Course cards must be visually distinct when selected (e.g., `#FFDD2D` border or distinct background).

## 4. Smart Interactions
- **Alert Resolution**: If a course in the Planner shows a "missing prerequisite" alert, provide a "Fix" button to add the prerequisite directly.
- **Auto-placement**: Added prerequisites should be automatically placed into the earliest available valid semester.
