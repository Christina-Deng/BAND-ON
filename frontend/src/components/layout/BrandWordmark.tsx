interface Props {
  className?: string;
}

/** Visual rebrand preview: BAND·ON wordmark (internal keys still use bandmate). */
export function BrandWordmark({ className = '' }: Props) {
  return (
    <span className={`font-display-heavy tracking-widest text-accent-600 ${className}`.trim()}>
      BAND<span className="opacity-75" aria-hidden="true">
        ·
      </span>
      ON
    </span>
  );
}
