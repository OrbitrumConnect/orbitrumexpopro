// Fonte única para "é admin?" — por papel/admin_level, não por e-mail fixo.
// Mantém o e-mail legado como fallback para não quebrar contas antigas.
export function isAdminUser(u: any): boolean {
  if (!u) return false;
  return u.isAdmin === true
    || (u.admin_level ?? 0) >= 1
    || u.user_type === 'admin'
    || u.email === 'passosmir4@gmail.com';
}
