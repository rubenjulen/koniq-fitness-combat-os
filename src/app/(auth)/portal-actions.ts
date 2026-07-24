"use server";
import { redirect } from "next/navigation";
import { memberLogin, memberLogout } from "@/lib/portal-auth";

export async function memberLoginAction(_prev: unknown, formData: FormData): Promise<{ error?: string }> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const res = await memberLogin(email, password);
  if (!res.ok) return { error: res.error };
  redirect("/portal");
}

export async function memberLogoutAction() {
  await memberLogout();
  redirect("/portal/login");
}
