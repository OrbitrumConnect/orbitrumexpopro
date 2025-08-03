// Função para forçar logout completo
export function forceLogout() {
  console.log('🚪 Executando logout forçado...');
  
  // Limpar localStorage
  localStorage.removeItem("orbtrum_auth");
  localStorage.clear();
  
  // Limpar sessionStorage
  sessionStorage.clear();
  
  // Limpar cookies do domínio
  document.cookie.split(";").forEach(function(c) { 
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
  });
  
  console.log('✅ Todos os dados locais limpos');
  console.log('✅ Usuário deslogado completamente');
  
  // Recarregar página para aplicar mudanças
  window.location.reload();
}