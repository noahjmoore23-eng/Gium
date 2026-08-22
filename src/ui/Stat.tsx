interface StatProps {
  label: string;
  value: string;
  unit?: string;
}

export function Stat({ label, value, unit }: StatProps) {
  return (
    <div className="stat">
      <dt>{label}</dt>
      <dd>
        {value}
        {unit ? <small> {unit}</small> : null}
      </dd>
    </div>
  );
}
