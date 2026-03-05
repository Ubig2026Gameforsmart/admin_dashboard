---
name: Next.js App Router Best Practices
description: Guidelines for Data Fetching, Caching, and Server/Client Component Usage in Next.js 14+
---

# Next.js App Router Best Practices

Always follow these patterns for Next.js App Router to ensure performance, SEO, and consistency.

## 1. Data Fetching Patterns

### Server Components (Preferred)
Always fetch data in **Server Components** whenever possible. This reduces client-side JavaScript and improves SEO.

```tsx
// Pattern: Server Component Fetching
async function getCompetitions() {
  const res = await fetch('https://api.example.com/competitions', {
    next: { revalidate: 3600 } // Cache for 1 hour
  });
  if (!res.ok) throw new Error('Failed to fetch data');
  return res.json();
}

export default async function Page() {
  const data = await getCompetitions();
  return <CompetitionList data={data} />;
}
```

## 2. Caching Strategies

| Strategy | Usage | Implementation |
|---|---|---|
| **Static (SSG)** | Data that rarely changes | `fetch(url, { cache: 'force-cache' })` (Default) |
| **Dynamic (SSR)** | Data that must be fresh | `fetch(url, { cache: 'no-store' })` |
| **Revalidated (ISR)** | Data that changes periodically | `fetch(url, { next: { revalidate: 60 } })` |

## 3. Server vs Client Components

- **Server Components**: Use for data fetching, sensitive info (API keys), and large dependencies.
- **Client Components**: Use for Interactivity (`useState`, `useEffect`), Browser APIs, and Event Listeners (`onClick`).

**Golden Rule**: Keep Client Components at the "leaves" of your component tree.

## 4. Loading & Error States
- Use `loading.tsx` for instant loading UI with Suspense.
- Use `error.tsx` for graceful error handling.

## 5. Security
- Never expose `process.env` variables starting with `NEXT_PUBLIC_` unless they are intended for the client.
- Use `server-only` package to prevent server code from leaking to the client.

## 6. URL-Driven UI (State Persistence)
As per Project Manager Briefing (Poin 3), UI state like pagination, search, and filters **must** be stored in the URL query parameters.

- **Objective**: Ensure that refreshing the page or sharing the URL preserves the exact UI state.
- **Pattern**: Use `useSearchParams`, `usePathname`, and `useRouter` to synchronize UI state with the URL.
- **Rule**: Avoid keeping filtering state only in local `useState` if it affects the data list.

