---
name: Supabase Data Fetching & Error Handling
description: Guidelines for secure, performant, and robust data fetching using Supabase JS client.
---

# Supabase Data Fetching & Error Handling

Follow these patterns to satisfy the "Best Practice & Error Handling" requirement from the Project Manager briefing.

## 1. Service Layer Pattern (Centralized Fetching)
Never perform direct `supabase.from()` calls inside components. Extract all data logic into service files under `lib/services/` or `services/`.

- **Why**: Centralizes logic, makes it reusable, easier to debug, and separates concerns from the UI.
- **Location**: Use `lib/services/[domain]-service.ts`.

```tsx
// Example: lib/services/competition-service.ts
export const competitionService = {
  getAll: async () => {
    const { data, error } = await supabase.from('competitions').select('id, title');
    if (error) throw error;
    return data;
  },
  getById: async (id: string) => { /* logic */ }
};
```

## 2. Unified Request Pattern
Every data fetching operation must handle three states: **Loading**, **Success**, and **Error**.

```tsx
const [data, setData] = useState<T[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

const fetchData = async () => {
  setIsLoading(true);
  setError(null);
  
  const { data, error } = await supabase.from('table').select('*');
  
  if (error) {
    setError(error.message);
    toast.error("Failed to load data");
  } else {
    setData(data);
  }
  setIsLoading(false);
};
```

## 2. Query Optimization
- **Select only needed columns**: Avoid `select('*')`. Use `select('id, title, status')`.
- **Pagination**: Always paginate large datasets using `.range(from, to)`.
- **Filtering**: Apply filters at the database level, not in JavaScript.

## 3. Real-time Subscriptions
Use sparingly. Always clean up subscriptions in `useEffect` return.

## 4. Error Handling Standards
- Log errors to a service (or console in dev) with context.
- Show user-friendly error messages (e.g., "Connection lost" vs "PostgREST 404").
- Provide a "Retry" mechanism for critical data.

## 5. Security (RLS)
- Never assume the client-side query is secure. 
- Always verify that Row Level Security (RLS) is enabled on the table.
- Use `supabase.auth.getUser()` to verify user identity before performing mutations.
