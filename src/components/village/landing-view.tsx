import type { LandingBlueprint, LandingSection } from "@/lib/types";

/**
 * 랜딩 blueprint 렌더러.
 * 참조 디자인에서 추출한 palette·layout·섹션 순서를 그대로 반영한다.
 * 색은 동적 HEX 이므로 Tailwind 유틸 대신 인라인 style 로 적용한다.
 */
export function LandingView({ blueprint }: { blueprint: LandingBlueprint }) {
  const { palette, sections } = blueprint;
  return (
    <main
      style={{ backgroundColor: palette.bg, color: palette.text }}
      className="min-h-screen w-full overflow-x-hidden"
    >
      {sections.map((s, i) => (
        <Section key={i} section={s} blueprint={blueprint} />
      ))}
    </main>
  );
}

function Section({
  section,
  blueprint,
}: {
  section: LandingSection;
  blueprint: LandingBlueprint;
}) {
  const { palette } = blueprint;
  const bg = section.bgColor ?? undefined;
  const text = section.textColor ?? undefined;
  const wrap = "w-full px-6 py-16 md:px-12 md:py-24";
  const inner = "mx-auto max-w-6xl";
  const align =
    section.align === "center"
      ? "text-center items-center"
      : section.align === "right"
        ? "text-right items-end"
        : "text-left items-start";

  switch (section.type) {
    case "hero":
      return (
        <section
          className="relative flex min-h-[70vh] w-full items-center justify-center overflow-hidden"
          style={{ backgroundColor: bg ?? palette.primary, color: text ?? "#fff" }}
        >
          {section.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={section.imageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-black/35" />
          <div
            className={`relative z-10 flex max-w-3xl flex-col gap-4 px-6 ${align}`}
          >
            {section.heading && (
              <h1 className="text-4xl font-extrabold leading-tight md:text-6xl">
                {section.heading}
              </h1>
            )}
            {section.subheading && (
              <p className="text-lg opacity-95 md:text-2xl">{section.subheading}</p>
            )}
            {section.ctaLabel && (
              <a
                href={section.ctaHref || "#"}
                className="mt-4 inline-block w-fit rounded-full px-7 py-3 text-base font-semibold shadow-lg"
                style={{ backgroundColor: palette.accent, color: "#fff" }}
              >
                {section.ctaLabel}
              </a>
            )}
          </div>
        </section>
      );

    case "features":
      return (
        <section className={wrap} style={{ backgroundColor: bg, color: text }}>
          <div className={inner}>
            <Header section={section} accent={palette.accent} />
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {(section.items ?? []).map((it, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-black/5 bg-white/60 p-6 shadow-sm backdrop-blur"
                >
                  {it.icon && (
                    <div
                      className="mb-3 text-2xl"
                      style={{ color: palette.accent }}
                    >
                      {it.icon}
                    </div>
                  )}
                  {it.title && (
                    <h3 className="text-lg font-bold">{it.title}</h3>
                  )}
                  {it.body && (
                    <p className="mt-2 text-sm opacity-80">{it.body}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case "story":
      return (
        <section className={wrap} style={{ backgroundColor: bg, color: text }}>
          <div
            className={`${inner} grid grid-cols-1 items-center gap-10 md:grid-cols-2`}
          >
            {section.imageUrl && (
              <div className="overflow-hidden rounded-3xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={section.imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <div className={`flex flex-col gap-4 ${align}`}>
              {section.heading && (
                <h2 className="text-3xl font-bold md:text-4xl">
                  {section.heading}
                </h2>
              )}
              {section.body && (
                <p className="text-base leading-relaxed opacity-85">
                  {section.body}
                </p>
              )}
            </div>
          </div>
        </section>
      );

    case "gallery":
      return (
        <section className={wrap} style={{ backgroundColor: bg, color: text }}>
          <div className={inner}>
            <Header section={section} accent={palette.accent} />
            <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {(section.items ?? [])
                .filter((it) => it.imageUrl)
                .map((it, i) => (
                  <div
                    key={i}
                    className="aspect-square overflow-hidden rounded-xl"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={it.imageUrl}
                      alt={it.title ?? ""}
                      className="h-full w-full object-cover transition hover:scale-105"
                    />
                  </div>
                ))}
            </div>
          </div>
        </section>
      );

    case "stats":
      return (
        <section
          className={wrap}
          style={{ backgroundColor: bg ?? palette.primary, color: text ?? "#fff" }}
        >
          <div
            className={`${inner} grid grid-cols-2 gap-8 text-center md:grid-cols-4`}
          >
            {(section.items ?? []).map((it, i) => (
              <div key={i}>
                <div className="text-3xl font-extrabold md:text-5xl">
                  {it.value ?? it.title}
                </div>
                {it.body && (
                  <div className="mt-2 text-sm opacity-85">{it.body}</div>
                )}
              </div>
            ))}
          </div>
        </section>
      );

    case "testimonial":
      return (
        <section className={wrap} style={{ backgroundColor: bg, color: text }}>
          <div className={inner}>
            <Header section={section} accent={palette.accent} />
            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
              {(section.items ?? []).map((it, i) => (
                <blockquote
                  key={i}
                  className="rounded-2xl bg-white/60 p-6 shadow-sm backdrop-blur"
                >
                  {it.body && (
                    <p className="text-base italic opacity-90">“{it.body}”</p>
                  )}
                  {it.title && (
                    <footer
                      className="mt-3 text-sm font-semibold"
                      style={{ color: palette.accent }}
                    >
                      — {it.title}
                    </footer>
                  )}
                </blockquote>
              ))}
            </div>
          </div>
        </section>
      );

    case "cta":
      return (
        <section
          className="w-full px-6 py-20 text-center"
          style={{ backgroundColor: bg ?? palette.accent, color: text ?? "#fff" }}
        >
          <div className="mx-auto max-w-2xl">
            {section.heading && (
              <h2 className="text-3xl font-bold md:text-4xl">
                {section.heading}
              </h2>
            )}
            {section.subheading && (
              <p className="mt-3 text-lg opacity-95">{section.subheading}</p>
            )}
            <a
              href={section.ctaHref || "#"}
              className="mt-8 inline-block rounded-full bg-white px-8 py-3 text-base font-bold shadow-lg"
              style={{ color: palette.accent }}
            >
              {section.ctaLabel || "자세히 보기"}
            </a>
          </div>
        </section>
      );

    case "footer":
      return (
        <footer
          className="w-full px-6 py-12 text-center"
          style={{
            backgroundColor: bg ?? "#111",
            color: text ?? "rgba(255,255,255,0.75)",
          }}
        >
          {section.heading && (
            <div className="text-xl font-bold text-white">{section.heading}</div>
          )}
          {section.subheading && (
            <div className="mt-2 text-sm">{section.subheading}</div>
          )}
        </footer>
      );

    default:
      return null;
  }
}

function Header({
  section,
  accent,
}: {
  section: LandingSection;
  accent: string;
}) {
  if (!section.heading && !section.subheading) return null;
  return (
    <div className="text-center">
      {section.heading && (
        <h2 className="text-3xl font-bold md:text-4xl">{section.heading}</h2>
      )}
      {section.subheading && (
        <p className="mt-3 text-base opacity-70">{section.subheading}</p>
      )}
      <div
        className="mx-auto mt-5 h-1 w-16 rounded-full"
        style={{ backgroundColor: accent }}
      />
    </div>
  );
}
