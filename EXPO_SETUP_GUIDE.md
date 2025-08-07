# 🚀 Configuração do Projeto no Expo.dev

## 📋 Status Atual
- ✅ Logado no Expo como: `obritrum`
- ❌ Projeto não configurado no EAS
- ❌ Sem builds criados

## 🔧 Passo a Passo para Configurar

### 1. Acessar Expo.dev
1. Vá para: https://expo.dev/accounts/obritrum/projects
2. Clique em **"Create a project"**
3. Configure:
   - **Name**: `orbitrum-connect`
   - **Type**: `Blank`
   - **Platform**: `All platforms`

### 2. Obter Project ID
Após criar o projeto, você receberá um **Project ID** como:
```
projectId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### 3. Atualizar app.json
Substitua no seu `app.json`:
```json
{
  "expo": {
    "name": "Orbitrum Connect",
    "slug": "orbitrum-connect",
    "version": "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "light",
    "splash": {
      "resizeMode": "contain",
      "backgroundColor": "#000000"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.orbitrumconnect.app",
      "buildNumber": "1.0.0"
    },
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#000000"
      },
      "package": "com.orbitrumconnect.app",
      "versionCode": 1
    },
    "web": {
      "bundler": "metro"
    },
    "plugins": [
      "expo-router"
    ],
    "scheme": "orbitrum-connect",
    "extra": {
      "router": {
        "origin": false
      },
      "eas": {
        "projectId": "SEU_PROJECT_ID_AQUI"
      }
    }
  }
}
```

### 4. Configurar EAS Build
```bash
# Após atualizar o projectId
npx eas build:configure
```

### 5. Criar Primeiro Build
```bash
# Build para desenvolvimento
npx eas build --platform android --profile development

# Ou build para produção
npx eas build --platform android --profile production
```

## 📱 URLs Importantes

### Expo Dashboard
- **Projetos**: https://expo.dev/accounts/obritrum/projects
- **Builds**: https://expo.dev/accounts/obritrum/projects/orbitrum-connect/builds
- **Updates**: https://expo.dev/accounts/obritrum/projects/orbitrum-connect/updates

### Desenvolvimento Local
- **Web**: http://localhost:8081
- **QR Code**: Aparece no terminal quando roda `npx expo start`

## 🔄 Próximos Passos

1. **Criar projeto no Expo.dev** ✅
2. **Atualizar projectId no app.json** ✅
3. **Configurar EAS Build** ✅
4. **Criar primeiro build** ✅
5. **Testar no dispositivo** ✅

## 🎯 Resultado Final

Após completar esses passos, você terá:
- ✅ Projeto configurado no Expo.dev
- ✅ Builds funcionando
- ✅ App disponível para download
- ✅ Atualizações OTA funcionando

---

**Arquitetura: Expo + Railway + Supabase** 🚀
