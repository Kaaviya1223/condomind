"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/site-url";

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function loginRedirect(params: Record<string, string>): never {
  redirect(`/login?${new URLSearchParams(params)}`);
}

export async function login(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: field(formData, "email"),
    password: String(formData.get("password") ?? ""),
  });

  if (error) {
    loginRedirect({ error: error.message });
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signup(formData: FormData) {
  const fullName = field(formData, "full_name");
  if (!fullName) {
    loginRedirect({ mode: "signup", error: "Full name is required." });
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email: field(formData, "email"),
    password: String(formData.get("password") ?? ""),
    options: {
      data: { full_name: fullName },
      emailRedirectTo: siteUrl("/auth/confirm").toString(),
    },
  });

  if (error) {
    loginRedirect({ mode: "signup", error: error.message });
  }

  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/");
  }

  loginRedirect({ message: "Check your email to confirm your account, then log in." });
}
