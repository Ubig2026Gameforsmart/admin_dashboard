---
name: Form Validation & UX Consistency
description: Standards for form handling, validation, and consistent UI/UX feedback.
---

# Form Validation & UX Consistency

Follow these rules to satisfy "Konsistensi UI/UX" and "Validasi Form" requirements.

## 1. Form Validation with Zod
Use `react-hook-form` with `zod` for strictly typed validation.

```tsx
const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  fee: z.number().min(0, "Fee cannot be negative"),
});

// Component
const { register, formState: { errors } } = useForm({
  resolver: zodResolver(schema)
});
```

## 2. In-line Error Feedback
Always show error messages directly below the input field in red (`text-destructive`).

## 3. Consistent Spacing (The 4px Rule)
Use Tailwind spacing classes consistently:
- **Small spacing**: `gap-2` (8px), `p-2`
- **Medium spacing**: `gap-4` (16px), `p-4`
- **Large spacing**: `gap-8` (32px), `p-8`

## 4. State Feedback
Every action (Save, Delete, Update) must have:
- **Loading State**: Disable button and show a spinner.
- **Success State**: Show a `Sonner` or `Toast` notification.
- **Error State**: Show a clear explanation of why it failed.

## 5. Mobile Responsiveness
Always use a mobile-first approach. Test layouts using `flex-col md:flex-row`.

## 6. Internationalization (i18n) First
Never hardcode strings directly in the components.
- **Rule**: All user-facing text must use the `useTranslation` hook and be stored in the appropriate JSON locale files.
- **Example**: `t("common.save")` instead of `"Save"`.

