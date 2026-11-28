import { useCallback, useEffect, useMemo, useState } from "react";
import type { HomeBannerSlide } from "../types/home";

type HeroBannerCarouselProps = {
  slides: HomeBannerSlide[];
  intervalMs?: number;
};

export default function HeroBannerCarousel({ slides, intervalMs = 2000 }: HeroBannerCarouselProps) {
  const sorted = useMemo(
    () => [...slides].sort((a, b) => a.sortOrder - b.sortOrder),
    [slides]
  );
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback(
    (next: number) => {
      if (sorted.length === 0) return;
      const wrapped = (next + sorted.length) % sorted.length;
      setIndex(wrapped);
    },
    [sorted.length]
  );

  useEffect(() => {
    setIndex(0);
  }, [sorted]);

  useEffect(() => {
    if (sorted.length <= 1 || paused) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % sorted.length);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [sorted.length, paused, intervalMs]);

  if (sorted.length === 0) return null;

  return (
    <div
      className="absolute inset-0 h-full w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {sorted.map((slide, slideIndex) => (
        <img
          key={slide.id}
          src={slide.image}
          alt={slide.alt || "Banner Lumina Spa"}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in-out ${
            slideIndex === index ? "opacity-100" : "opacity-0"
          }`}
          loading={slideIndex === 0 ? "eager" : "lazy"}
        />
      ))}

      {sorted.length > 1 ? (
        <>
          <button
            type="button"
            aria-label="Ảnh trước"
            onClick={() => goTo(index - 1)}
            className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm hover:bg-black/50 sm:left-5"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Ảnh sau"
            onClick={() => goTo(index + 1)}
            className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm hover:bg-black/50 sm:right-5"
          >
            ›
          </button>
          <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
            {sorted.map((slide, dotIndex) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`Chuyển tới ảnh ${dotIndex + 1}`}
                onClick={() => goTo(dotIndex)}
                className={`h-2.5 rounded-full transition-all ${
                  dotIndex === index ? "w-8 bg-spa-accent" : "w-2.5 bg-white/55 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}