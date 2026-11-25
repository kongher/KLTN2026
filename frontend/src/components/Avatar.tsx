type Props = {
  name: string;
  src?: string | null;
  className?: string;
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export default function Avatar({ name, src, className = "h-10 w-10" }: Props) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${className} rounded-full object-cover`}
      />
    );
  }

  return (
    <span
      className={`${className} inline-flex items-center justify-center rounded-full bg-spa-primary/15 text-xs font-semibold text-spa-dark`}
    >
      {initials(name) || "NV"}
    </span>
  );
}
