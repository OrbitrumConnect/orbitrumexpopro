import { C } from '@/lib/theme';

export default function NavyChip({ label }: { label: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: C.ink,
      background: `${C.blue}14`, border: `1px solid ${C.border}`, borderRadius: 11, padding: '2px 8px',
    }}>
      <span style={{ color: C.cyan }}>✓</span>{label}
    </span>
  );
}
