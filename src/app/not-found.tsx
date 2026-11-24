import "./tailwind.css";
import { cairo } from "@/core/config/fonts";
import { routing } from "@/core/i18n/routing";

export default function RootNotFound() {
  return (
    <html lang={routing.defaultLocale} dir="rtl" className={cairo.variable}>
      <body className="flex min-h-screen flex-col justify-center gap-5 border-t-4 border-accent bg-ground px-6 py-12 font-sans text-ink antialiased">
        <main className="flex flex-col gap-5">
          <p dir="ltr" className="text-5xl font-bold text-accent">
            404
          </p>
          <h1 className="text-3xl font-bold">الصفحة غير موجودة</h1>
          <p className="max-w-prose text-ink-muted">
            الصفحة المطلوبة غير موجودة أو تم نقلها.
          </p>
          <a
            href={`/${routing.defaultLocale}`}
            className="inline-flex min-h-12 w-fit items-center rounded-full bg-accent px-6 font-bold text-accent-ink"
          >
            العودة إلى الصفحة الرئيسية
          </a>
        </main>
      </body>
    </html>
  );
}
