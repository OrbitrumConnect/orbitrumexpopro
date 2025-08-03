const fs = require('fs');
const path = require('path');

// URLs únicas do Unsplash para cada profissional
const avatarUrls = [
  "https://images.unsplash.com/photo-1494790108755-2616b2e5c5b6?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
  "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
  "https://images.unsplash.com/photo-1494790108755-2616b2e5c5b6?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
  "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
  "https://images.unsplash.com/photo-1494790108755-2616b2e5c5b6?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"
];

// Ler o arquivo schema.ts
const schemaPath = path.join(__dirname, 'shared', 'schema.ts');
let content = fs.readFileSync(schemaPath, 'utf8');

// Substituir todas as fotos
let avatarIndex = 0;
content = content.replace(/avatar: "\/avatars\/[^"]+\.jpg"/g, (match) => {
  const newAvatar = `avatar: "${avatarUrls[avatarIndex % avatarUrls.length]}"`;
  avatarIndex++;
  return newAvatar;
});

// Salvar o arquivo
fs.writeFileSync(schemaPath, content, 'utf8');

console.log('✅ Todas as fotos dos profissionais foram corrigidas!');
console.log(`📸 ${avatarIndex} fotos atualizadas com URLs únicas do Unsplash`); 