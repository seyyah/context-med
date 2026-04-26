export function Icon({ name, filled = false, className = '' }) {
  const style = filled
    ? { fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24" }
    : undefined;

  return (
    <span className={`material-symbols-outlined ${className}`.trim()} style={style} aria-hidden="true">
      {name}
    </span>
  );
}
