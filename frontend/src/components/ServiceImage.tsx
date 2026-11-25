import { useState } from "react";
import { FALLBACK_SERVICE_IMAGE } from "../utils/format";

type Props = {
  src?: string | null;
  alt: string;
  className?: string;
};

export default function ServiceImage({ src, alt, className }: Props) {
  const [failed, setFailed] = useState(false);
  const imageSrc = !src || failed ? FALLBACK_SERVICE_IMAGE : src;

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
