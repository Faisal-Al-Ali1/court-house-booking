import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("common");

  return (
    <main className="px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">{t("siteName")}</h1>
    </main>
  );
}
