import Image from "next/image";

export function Backdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-field"
    >
      <div className="absolute inset-0 animate-kenburns">
        <Image
          src="/backdrop.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="scale-110 object-cover opacity-30 blur-[3px]"
        />
      </div>
      <div className="absolute inset-0 bg-linear-to-b from-field/85 via-field/55 to-field-deep" />
      <div className="absolute inset-0 bg-linear-to-t from-field-deep/90 via-transparent to-transparent" />
    </div>
  );
}
