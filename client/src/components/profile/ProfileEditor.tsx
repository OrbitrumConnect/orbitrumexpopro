import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Camera, X, Check, MapPin, Phone, Briefcase } from "lucide-react";

const C = {
  bg: '#020914', card: 'rgba(3,18,32,0.92)', surface: '#0A1929',
  cyan: '#00E5FF', blue: '#00AEEF', ink: '#F4FAFF', ink2: '#91A9BD', ink3: '#5b7a90',
  border: 'rgba(0,190,255,0.18)', borderHot: 'rgba(0,190,255,0.4)',
  green: '#24F0C7', orange: '#FF9F43',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 10,
  background: C.surface, border: `1px solid ${C.border}`, color: C.ink,
  fontSize: 14, outline: 'none', fontFamily: 'inherit',
};

const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 500, color: C.ink2, marginBottom: 4, display: 'block',
};

const CATEGORIAS = [
  'Pedreiro', 'Pintor', 'Eletricista', 'Encanador', 'Marceneiro', 'Serralheiro',
  'Diarista', 'Babá', 'Cuidadora de Idosos', 'Jardineiro', 'Passeador de Cães',
  'Cabeleireira', 'Barbeiro', 'Manicure', 'Maquiador', 'Esteticista',
  'Técnico em Informática', 'Técnico em Ar Condicionado', 'Técnico em Celulares',
  'Personal Trainer', 'Nutricionista', 'Fisioterapeuta', 'Psicólogo',
  'Dentista', 'Médico', 'Enfermeiro', 'Veterinário',
  'Professor Particular', 'Músico', 'Fotógrafo', 'Designer Gráfico',
  'Advogado', 'Contador', 'Consultor', 'Mecânico', 'Chaveiro', 'Dedetizador',
  'Costureira', 'Chef de Cozinha', 'Motorista Particular', 'Segurança',
];

interface ProfileEditorProps {
  userType: 'client' | 'professional';
}

export default function ProfileEditor({ userType }: ProfileEditorProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profileImage, setProfileImage] = useState('');
  const [form, setForm] = useState({
    displayName: '', bio: '', phone: '', city: '', state: '',
    profession: '', hourlyRate: 0, availability: 'disponivel' as string,
    skills: [] as string[], experience: '',
  });
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/profile/${userType}/${user.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(p => {
        if (p) {
          setForm({
            displayName: p.displayName || user.fullName || user.username || '',
            bio: p.bio || '', phone: p.phone || user.phone || '',
            city: p.city || '', state: p.state || '',
            profession: p.profession || '', hourlyRate: p.hourlyRate || 0,
            availability: p.availability || 'disponivel',
            skills: p.skills || [], experience: p.experience || '',
          });
          if (p.profileImage) setProfileImage(p.profileImage);
        } else {
          setForm(f => ({
            ...f,
            displayName: user.fullName || user.username || '',
            phone: user.phone || '',
          }));
        }
      })
      .catch(() => {});
  }, [user?.id, userType]);

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => setProfileImage(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!user?.id || !form.displayName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/profile/${userType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, userId: user.id, profileImage }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {}
    setSaving(false);
  };

  const addSkill = () => {
    const s = newSkill.trim();
    if (s && !form.skills.includes(s)) {
      setForm({ ...form, skills: [...form.skills, s] });
      setNewSkill('');
    }
  };

  const completion = (() => {
    const fields = [form.displayName, form.bio, form.phone, form.city, profileImage,
      userType === 'professional' ? form.profession : 'ok',
      userType === 'professional' ? (form.hourlyRate > 0 ? 'ok' : '') : 'ok'];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  })();

  const mobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: mobile ? 16 : 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ color: C.cyan, fontSize: 18, fontWeight: 600, margin: 0 }}>
            {userType === 'professional' ? 'Perfil Profissional' : 'Meu Perfil'}
          </h2>
          <p style={{ color: C.ink3, fontSize: 12, margin: '4px 0 0' }}>
            {completion}% completo — {completion < 100 ? 'complete para aparecer melhor nas buscas' : 'perfil completo'}
          </p>
        </div>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: `conic-gradient(${C.cyan} ${completion * 3.6}deg, ${C.surface} 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: C.cyan }}>{completion}%</div>
        </div>
      </div>

      {/* Barra de progresso */}
      <div style={{ height: 3, background: C.surface, borderRadius: 2, marginBottom: 24 }}>
        <div style={{ height: 3, borderRadius: 2, background: `linear-gradient(90deg, ${C.cyan}, ${C.blue})`, width: `${completion}%`, transition: 'width 0.3s' }} />
      </div>

      {/* Foto */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ position: 'relative' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: C.surface, border: `2px solid ${C.border}`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {profileImage
              ? <img src={profileImage} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 28, color: C.ink3 }}>{(form.displayName || 'U')[0].toUpperCase()}</span>
            }
          </div>
          <button onClick={() => fileInputRef.current?.click()}
            style={{ position: 'absolute', bottom: -4, right: -4, width: 28, height: 28, borderRadius: '50%', background: C.cyan, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Camera size={14} color="#020914" />
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />
        <p style={{ fontSize: 11, color: C.ink3, marginTop: 8 }}>
          {userType === 'professional' ? 'Foto profissional aumenta suas chances' : 'Adicione uma foto'}
        </p>
      </div>

      {/* Nome + Telefone */}
      <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <label style={labelStyle}>Nome Completo *</label>
          <input style={inputStyle} value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })} />
        </div>
        <div>
          <label style={labelStyle}><Phone size={12} style={{ display: 'inline', marginRight: 4 }} />Telefone</label>
          <input style={inputStyle} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(21) 99999-9999" />
        </div>
      </div>

      {/* Cidade + Estado */}
      <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <label style={labelStyle}><MapPin size={12} style={{ display: 'inline', marginRight: 4 }} />Cidade</label>
          <input style={inputStyle} value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
        </div>
        <div>
          <label style={labelStyle}>Estado</label>
          <input style={inputStyle} value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} placeholder="RJ" />
        </div>
      </div>

      {/* Bio */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>{userType === 'professional' ? 'Apresentação Profissional' : 'Sobre Você'}</label>
        <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} value={form.bio}
          onChange={e => setForm({ ...form, bio: e.target.value })}
          placeholder={userType === 'professional' ? 'Descreva sua experiência e especialidades...' : 'Conte um pouco sobre você...'} />
        <p style={{ fontSize: 10, color: C.ink3, marginTop: 2, textAlign: 'right' }}>{form.bio.length}/500</p>
      </div>

      {/* Campos profissionais */}
      {userType === 'professional' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}><Briefcase size={12} style={{ display: 'inline', marginRight: 4 }} />Categoria *</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.profession}
                onChange={e => setForm({ ...form, profession: e.target.value })}>
                <option value="">Selecione...</option>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Valor/hora (R$)</label>
              <input style={inputStyle} type="number" min="0" value={form.hourlyRate}
                onChange={e => setForm({ ...form, hourlyRate: parseInt(e.target.value) || 0 })} />
            </div>
          </div>

          {/* Disponibilidade */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Status</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['disponivel', 'ocupado', 'offline'] as const).map(s => (
                <button key={s} onClick={() => setForm({ ...form, availability: s })}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: `1px solid ${form.availability === s ? C.borderHot : C.border}`,
                    background: form.availability === s ? `${C.cyan}15` : 'transparent', color: form.availability === s ? C.cyan : C.ink3,
                    cursor: 'pointer', fontSize: 13, fontWeight: form.availability === s ? 600 : 400, fontFamily: 'inherit' }}>
                  {s === 'disponivel' ? '● Disponível' : s === 'ocupado' ? '● Ocupado' : '○ Offline'}
                </button>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Serviços / Habilidades</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input style={{ ...inputStyle, flex: 1 }} value={newSkill} placeholder="Ex: Pintura residencial"
                onChange={e => setNewSkill(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); }}} />
              <button onClick={addSkill} style={{ padding: '8px 16px', borderRadius: 10, background: C.cyan, border: 'none', color: C.bg, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>+</button>
            </div>
            {form.skills.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {form.skills.map(s => (
                  <span key={s} onClick={() => setForm({ ...form, skills: form.skills.filter(x => x !== s) })}
                    style={{ padding: '4px 10px', borderRadius: 16, background: `${C.cyan}18`, border: `1px solid ${C.border}`,
                      color: C.cyan, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {s} <X size={10} />
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Experiência */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Anos de Experiência</label>
            <input style={inputStyle} value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })} placeholder="Ex: 8 anos em pintura residencial" />
          </div>
        </>
      )}

      {/* Botão salvar */}
      <button onClick={handleSave} disabled={saving || !form.displayName.trim()}
        style={{ width: '100%', padding: '12px 0', borderRadius: 12, border: 'none', fontFamily: 'inherit',
          background: saved ? C.green : `linear-gradient(135deg, ${C.cyan}, ${C.blue})`,
          color: C.bg, fontSize: 15, fontWeight: 600, cursor: saving ? 'wait' : 'pointer',
          opacity: !form.displayName.trim() ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        {saved ? <><Check size={16} /> Salvo</> : saving ? 'Salvando...' : 'Salvar Perfil'}
      </button>
    </div>
  );
}
