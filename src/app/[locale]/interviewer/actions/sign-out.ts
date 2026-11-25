"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/core/i18n/routing";
import { INTERVIEWER_COOKIE } from "@/lib/interviewer-session";

export async function signOut(locale: string): Promise<void> {
  const jar = await cookies();
  jar.delete(INTERVIEWER_COOKIE);

  const target = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;
  redirect(`/${target}/interviewer`);
}
