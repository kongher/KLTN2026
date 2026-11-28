type StarRatingInputProps = {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
};

export default function StarRatingInput({ value, onChange, disabled }: StarRatingInputProps) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          aria-label={`${star} sao`}
          onClick={() => onChange(star)}
          className={`text-2xl transition ${disabled ? "opacity-50" : "hover:scale-110"} ${
            star <= value ? "text-[#C9A46C]" : "text-stone-300"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}