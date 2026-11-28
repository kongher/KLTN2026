import { useEffect, useState } from "react";

type TypewriterTextProps = {
  text: string;
  charDelayMs?: number;
  pauseMs?: number;
  className?: string;
};

export default function TypewriterText({
  text,
  charDelayMs = 55,
  pauseMs = 2000,
  className,
}: TypewriterTextProps) {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    if (!text) {
      setDisplay("");
      return;
    }

    let cancelled = false;
    let index = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const typeNext = () => {
      if (cancelled) return;
      if (index < text.length) {
        index += 1;
        setDisplay(text.slice(0, index));
        timer = setTimeout(typeNext, charDelayMs);
        return;
      }
      timer = setTimeout(() => {
        if (cancelled) return;
        index = 0;
        setDisplay("");
        timer = setTimeout(typeNext, charDelayMs);
      }, pauseMs);
    };

    setDisplay("");
    timer = setTimeout(typeNext, charDelayMs);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [text, charDelayMs, pauseMs]);

  return (
    <p className={className} aria-live="polite">
      {display}
    </p>
  );
}