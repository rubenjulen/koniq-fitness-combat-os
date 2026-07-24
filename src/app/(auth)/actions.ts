"use server";
import { redirect } from "next/navigation";
import { login, logout } from "@/lib/auth";

export async function loginAction(_prev: unknown, formData: FormData): Promise<{ error?: string }> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const res = await login(email, password);
  if (!res.ok) return { error: res.error };
  redirect("/app");
}

export async function logoutAction() {
  await logout();
  redirect("/login");
}
