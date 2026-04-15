import { CategoryService } from "@/lib/services/category-service";
import { CategoryTable } from "./_components/category-table";

export const metadata = {
  title: "Categories | Admin Dashboard",
};

export default async function CategoryPage() {
  const { data, error } = await CategoryService.fetchCategories();

  if (error) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-destructive">
        <p>Failed to load categories: {error}</p>
      </div>
    );
  }

  return <CategoryTable initialData={data} />;
}
