import "../tailwind.css";
import { ReactNode } from "react";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getLangDir } from "rtl-detect";
import type { Metadata } from "next";
import { routing } from "@/core/i18n/routing";
import { cairo, livvic } from "@/core/config/fonts";
import { SITE_URL } from "@/core/constants/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "common" });

  return {
    metadataBase: new URL(SITE_URL),
    title: t("siteName"),
    description: t("siteDescription"),
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
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
  const dir = getLangDir(locale);
  const htmlFonts =
    locale === "ar" ? cairo.variable : `${livvic.variable} ${cairo.variable}`;
  const bodyFont = locale === "ar" ? "font-sans" : "font-latin";

  return (
    <html lang={locale} dir={dir} className={htmlFonts}>
      <body className={`bg-ground ${bodyFont} text-ink antialiased`}>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
