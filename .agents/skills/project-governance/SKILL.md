---
name: Project Governance & Safety
description: Guidelines for Strict Typing (TypeScript) and Security (RBAC) to ensure a bug-free production environment.
---

# Project Governance & Safety

These rules are designed to satisfy Poin 1 (Zero Critical Bugs) and Poin 7 (Target Kompetensi) of the Briefing.

## 1. Strict TypeScript (No `any`)
Using `any` is strictly prohibited. It bypasses the safety nets that prevent production crashes.

- **Rule**: Every data object from Supabase or any external API must have a corresponding `interface` or `type`.
- **Pattern**: Store shared types in `types/[domain].ts`.
- **Example**:
```tsx
interface Competition {
  id: string;
  title: string;
  status: 'published' | 'draft' | 'completed';
}
```

## 2. Guarding against `null` and `undefined`
Never assume data exists. Always use optional chaining (`?.`) or nullish coalescing (`??`).

## 3. Role-Based Access Control (RBAC)
The UI must reflect the user's permissions.

- **Rule**: Wrap administrative actions (Delete, Edit Category, etc.) in a permission check.
- **Why**: Prevent unauthorized users from seeing or triggering actions they shouldn't have access to.

## 4. Production Readiness (Zero Critical Bugs)
- **Error Boundaries**: Wrap major feature sections in Error Boundaries to prevent a single component crash from taking down the entire page.
- **Linting**: Always respect and fix linting errors before considering a task "done".
