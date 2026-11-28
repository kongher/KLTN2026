import { useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from "react";

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoComplete?: string;
};

const LENGTH = 6;

export default function OtpInput({
  value,
  onChange,
  disabled = false,
  autoComplete = "one-time-code",
}: OtpInputProps) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: LENGTH }, (_, index) => value[index] || "");

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  function updateAt(index: number, char: string) {
    const next = digits.slice();
    next[index] = char;
    onChange(next.join("").slice(0, LENGTH));
  }

  function handleChange(index: number, raw: string) {
    const cleaned = raw.replace(/\D/g, "");
    if (!cleaned) {
      updateAt(index, "");
      return;
    }

    if (cleaned.length === 1) {
      updateAt(index, cleaned);
      if (index < LENGTH - 1) {
        inputsRef.current[index + 1]?.focus();
      }
      return;
    }

    const merged = (digits.slice(0, index).join("") + cleaned).slice(0, LENGTH);
    onChange(merged);
    const focusIndex = Math.min(merged.length, LENGTH - 1);
    inputsRef.current[focusIndex]?.focus();
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
      updateAt(index - 1, "");
      event.preventDefault();
    }

    if (event.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
      event.preventDefault();
    }

    if (event.key === "ArrowRight" && index < LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
      event.preventDefault();
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const text = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, LENGTH);
    if (!text) return;
    onChange(text);
    const focusIndex = Math.min(text.length, LENGTH - 1);
    inputsRef.current[focusIndex]?.focus();
  }

  return (
    <div className="flex justify-center gap-2 sm:gap-3">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            inputsRef.current[index] = element;
          }}
          inputMode="numeric"
          autoComplete={index === 0 ? autoComplete : "off"}
          aria-label={`Chữ số OTP ${index + 1}`}
          className="h-12 w-10 rounded-xl border border-stone-300 text-center text-lg font-semibold text-stone-900 outline-none transition focus:border-[#C9A46C] focus:ring-2 focus:ring-[#C9A46C]/30 sm:h-14 sm:w-12"
          maxLength={index === 0 ? LENGTH : 1}
          value={digit}
          disabled={disabled}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={index === 0 ? handlePaste : undefined}
        />
      ))}
    </div>
  );
}