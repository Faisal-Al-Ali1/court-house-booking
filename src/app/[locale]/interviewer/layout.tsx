import type { ReactNode } from "react";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Backdrop } from "@/core/new-components/common/backdrop";
import { routing } from "@/core/i18n/routing";
import { SignInForm } from "./components";
import { isSignedIn } from "./utils/is-signed-in";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function InterviewerLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  if (!(await isSignedIn())) {
    return (
      <>
        <Backdrop />
        <SignInForm locale={locale} />
      </>
    );
  }

  return children;
}
