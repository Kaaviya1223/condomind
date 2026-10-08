"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireResident } from "@/lib/auth";
import { fail, optionalText, text, uuidField } from "@/lib/form";

export async function submitRequest(formData: FormData) {
  const { supabase } = await requireResident();
  const unitId = uuidField(formData, "unit_id");
  const title = text(formData, "title");
  const description = optionalText(formData, "description");

  if (!unitId) fail("/requests", "Choose your unit.");
  if (!title) fail("/requests", "Please give the request a short title.");
  if (title.length > 200) fail("/requests", "The title must be 200 characters or fewer.");
  if (description && description.length > 5000) {
    fail("/requests", "The description must be 5000 characters or fewer.");
  }

  const { data, error } = await supabase
    .from("maintenance_requests")
    .insert({ unit_id: unitId, title, description })
    .select("id")
    .single();

  if (error || !data) {
    fail("/requests", error?.message ?? "Could not submit the request.");
  }

  revalidatePath("/requests");
  redirect(`/requests/${data.id}?message=${encodeURIComponent("Request submitted. Your building manager will review it.")}`);
}
