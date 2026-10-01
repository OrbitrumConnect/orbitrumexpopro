// Função para forçar logout completo
export function forceLogout() {
  // Limpar localStorage
  localStorage.removeItem("orbtrum_auth");
  localStorage.clear();
  
  // Limpar sessionStorage
  sessionStorage.clear();
  
  // Limpar cookies do domínio
  document.cookie.split(";").forEach(function(c) { 
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
  });
  
  // Recarregar página para aplicar mudanças
  window.location.reload();
}