"use client";

const page = {
  margin: 0,
  backgroundColor: "#ffffff",
  color: "#3f3f3d",
  fontFamily: "system-ui, sans-serif",
  lineHeight: 1.6,
};

const frame = {
  marginInline: "auto",
  maxInlineSize: "36rem",
  paddingInline: "1rem",
  paddingBlock: "3rem",
};

const button = {
  marginBlockStart: "1.5rem",
  minBlockSize: "3rem",
  paddingInline: "1.5rem",
  paddingBlock: "0.75rem",
  border: "none",
  borderRadius: "0.375rem",
  backgroundColor: "#a32731",
  color: "#ffffff",
  fontSize: "1rem",
  fontWeight: 600,
  fontFamily: "inherit",
  cursor: "pointer",
};

const secondary = {
  marginBlockStart: "1.5rem",
  color: "#6b6b68",
};

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="ar" dir="rtl">
      <body style={page}>
        <main style={frame}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            حدث خطأ غير متوقع
          </h1>
          <p>
            لم نتمكن من عرض هذه الصفحة. لم تفقد أي بيانات أدخلتها، ويمكنك
            المحاولة مرة أخرى.
          </p>
          <button type="button" onClick={reset} style={button}>
            أعد المحاولة
          </button>
          <p lang="en" dir="ltr" style={secondary}>
            Something went wrong and this page could not be shown. Nothing you
            entered has been lost. Use the button above to try again.
          </p>
        </main>
      </body>
    </html>
  );
}
