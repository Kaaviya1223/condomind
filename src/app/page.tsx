import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { data, error } = await supabase
    .from("buildings")
    .select("id, name, address");

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">CondoMind</h1>
      {error && <p className="text-red-600">Error: {error.message}</p>}
      <ul className="mt-4 space-y-2">
        {data?.map((b) => (
          <li key={b.id}>
            {b.name} ({b.address})
          </li>
        ))}
      </ul>
    </main>
  );
}