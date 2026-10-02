import { C } from '@/lib/theme';

interface Props {
  src?: string | null;
  name: string;
  size?: number;
}

export default function NavyAvatar({ src, name, size = 38 }: Props) {
  if (src) {
    return (
      <img src={src} alt={name}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: `1px solid ${C.border}` }} />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `${C.blue}33`, border: `1px solid ${C.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: C.cyan, fontWeight: 700, fontSize: size * 0.38,
    }}>
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  );
}
