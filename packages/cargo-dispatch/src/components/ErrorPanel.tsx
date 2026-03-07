interface ErrorPanelProps {
  errors: string[];
}

export function ErrorPanel({ errors }: ErrorPanelProps) {
  if (errors.length === 0) return null;

  return (
    <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 font-mono text-red-800 text-xs">
      {errors.map((e, i) => (
        <div key={i}>{e}</div>
      ))}
    </div>
  );
}
