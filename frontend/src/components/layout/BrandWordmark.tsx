interface Props {
  className?: string;
}

/** BAND·ON wordmark — product display name; internal infra may still use legacy hostnames. */
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
