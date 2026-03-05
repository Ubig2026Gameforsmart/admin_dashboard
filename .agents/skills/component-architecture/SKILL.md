---
name: Component Architecture & Reusability
description: Standards for building modular, reusable, and atomic components based on Shadcn UI patterns.
---

# Component Architecture & Reusability

Follow these patterns to ensure our UI components are consistent, modular, and easy to maintain.

## 1. Atomic Component Structure

Divide components into logical layers to avoid "Mega-Files":

- **`components/ui/`**: Base primitive components (mostly from Shadcn). These should be logic-less and purely for styling/accessibility.
- **`components/shared/`**: Reusable business-logic components used across multiple features (e.g., `DataTable`, `FileUpload`, `StatusBadge`).
- **`components/features/[feature-name]/`**: Components specific to a single business domain (e.g., `CompetitionBracket`, `ParticipantCard`).

## 2. The Project Pattern (Colocation)

Keep code close to where it's used.

```txt
app/(dashboard)/competitions/
├── page.tsx            # Server Component (Data fetching)
├── layout.tsx
├── _components/        # Private components for this route only
│   ├── competition-table.tsx
│   └── competition-card.tsx
└── _hooks/             # Private hooks
    └── use-competition-filter.ts
```

## 3. Reusable Component Pattern

### Generic Props Interface
Always extend the base HTML element props to allow standard attributes like `className`, `id`, or `style`.

```tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  isLoading?: boolean;
}

export const MyButton = ({ className, isLoading, children, ...props }: ButtonProps) => {
  return (
    <button className={cn("base-styles", className)} {...props}>
      {isLoading ? <Spinner /> : children}
    </button>
  );
};
```

## 4. Abstracting Business Logic (Hooks)

Never put complex logic inside the UI component. Abstract it into a custom hook.

- **Bad**: `CompetitionTable.tsx` has 200 lines of filtering and sorting logic.
- **Good**: `CompetitionTable.tsx` calls `const { sortedData, filter } = useCompetitionLogic(data)`.

## 5. Composition over Configuration

Instead of creating one component with 50 props, use **Composition** (Compound Components).

```tsx
// Better than <Card title="..." footer="..." />
<Card>
  <CardHeader title="Title" />
  <CardContent>Content</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>
```

## 6. Icon Consistency
Use `lucide-react` for all icons. Wrap them in a consistent size wrapper if used in tables or buttons (usually `h-4 w-4`).
