---
name: Project Structure & Organization
description: Guidelines for a clean, modular, and scalable folder structure in a Next.js + Supabase project.
---

# Project Structure & Organization

Follow this structure to ensure the project remains "Clean, Modular, and Easy to Understand" (Poin 1 & 2 of the Briefing).

## 1. High-Level Folder Overview

```txt
├── app/                  # Routing, Layouts, and Page components
├── components/           # UI and Feature-specific components
├── lib/                  # Core logic, services, and shared utilities
├── hooks/                # Global reusable React hooks
├── types/                # Global TypeScript interfaces/types
├── public/               # Static assets (images, icons, WebP)
└── styles/               # Global CSS and Tailwind theme configs
```

## 2. The `app/` Directory (App Router)
Use **Colocation**. If a component or hook is ONLY used in one route, put it inside an `_components` or `_hooks` folder within that route.

```txt
app/(dashboard)/receptionist/
├── page.tsx              # Main Page
├── _components/          # Private components (e.g., QRScanner)
└── [id]/                 # Nested Route
    └── page.tsx
```

## 3. The `lib/` Directory (The Logic Hub)
Avoid putting business logic in the `app/` directory.

- **`lib/services/`**: Centralized data fetching (Supabase queries).
- **`lib/utils.ts`**: Helper functions (date formatting, currency, etc.).
- **`lib/supabase/`**: Supabase client configurations (browser/server).
- **`lib/i18n/`**: Localization setup.

## 4. The `components/` Directory
Follow the Atomic/Layered approach:

- **`components/ui/`**: Base Shadcn components.
- **`components/dashboard/`**: Reusable dashboard-specific elements (e.g. `DataTable`, `Sidebar`).
- **`components/shared/`**: Generic reusable UI (e.g. `ConfirmDialog`, `LoadingSpinner`).

## 5. Metadata & SEO
Every page in `app/` should have a `metadata` object or a `generateMetadata` function for SEO and browser titles.

## 6. Naming Conventions
- **Files**: Use kebab-case (e.g., `manage-competitions.tsx`) or PascalCase for components (e.g., `DataTable.tsx`). Be consistent.
- **Directories**: Always use kebab-case (e.g., `competition-detail`).
- **Private Folders**: Prefix with an underscore (e.g., `_components`) to signal they are not routes.
