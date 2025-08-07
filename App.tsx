import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { createClient, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuração do Supabase
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://gnvxnsgewhjucdhwrrdi.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdudnhuc2dld2hqdWNkaHdycmRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2Nzk1NDAsImV4cCI6MjA2ODI1NTU0MH0.p0LjK34rpLRVnG0F002PL5MbqSJOvyUebUBWAruMpi0';

// Configuração do Railway
const railwayApiUrl = process.env.EXPO_PUBLIC_RAILWAY_API_URL || 'https://orbitrumexpopro-production.up.railway.app';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('Verificando...');
  const [backendStatus, setBackendStatus] = useState('Verificando...');

  useEffect(() => {
    checkConnections();
    checkAuth();
  }, []);

  const checkConnections = async () => {
    // Testar Supabase
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      if (error) {
        setConnectionStatus('❌ Erro Supabase: ' + error.message);
      } else {
        setConnectionStatus('✅ Supabase Conectado');
      }
    } catch (error) {
      setConnectionStatus('❌ Erro de conexão Supabase');
    }

    // Testar Railway Backend
    try {
      const response = await fetch(`${railwayApiUrl}/api/health`);
      if (response.ok) {
        setBackendStatus('✅ Railway Backend Online');
      } else {
        setBackendStatus('⚠️ Railway Backend Iniciando...');
      }
    } catch (error) {
      setBackendStatus('❌ Railway Backend Offline');
    }
  };

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      setLoading(false);
    }
  };

  const signInAnonymously = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      Alert.alert('✅ Sucesso', 'Login anônimo realizado!');
      checkAuth();
    } catch (error) {
      Alert.alert('❌ Erro', error.message);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      Alert.alert('✅ Sucesso', 'Logout realizado!');
      checkAuth();
    } catch (error) {
      Alert.alert('❌ Erro', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando...</Text>
          <Text style={styles.statusText}>{connectionStatus}</Text>
          <Text style={styles.statusText}>{backendStatus}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>🚀 Orbitrum Connect</Text>
          <Text style={styles.subtitle}>Expo + Railway + Supabase</Text>
        </View>

        <View style={styles.content}>
          {/* Status das Conexões */}
          <View style={styles.statusSection}>
            <Text style={styles.sectionTitle}>🔗 Status das Conexões</Text>
            
            <View style={styles.statusCard}>
              <Text style={styles.statusTitle}>📱 Supabase</Text>
              <Text style={styles.statusText}>{connectionStatus}</Text>
            </View>

            <View style={styles.statusCard}>
              <Text style={styles.statusTitle}>🌐 Railway Backend</Text>
              <Text style={styles.statusText}>{backendStatus}</Text>
              <Text style={styles.urlText}>{railwayApiUrl}</Text>
            </View>
          </View>

          {/* Autenticação */}
          {user ? (
            <View style={styles.userSection}>
              <Text style={styles.welcomeText}>✅ Bem-vindo!</Text>
              <Text style={styles.userInfo}>ID: {user.id}</Text>
              <Text style={styles.userInfo}>Email: {user.email || 'Usuário anônimo'}</Text>
              <Text style={styles.userInfo}>Criado: {new Date(user.created_at).toLocaleDateString()}</Text>
              
              <TouchableOpacity style={styles.button} onPress={signOut}>
                <Text style={styles.buttonText}>Sair</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.authSection}>
              <Text style={styles.authText}>Faça login para continuar</Text>
              
              <TouchableOpacity style={styles.button} onPress={signInAnonymously}>
                <Text style={styles.buttonText}>Entrar Anonimamente</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Arquitetura */}
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>🏗️ Arquitetura Completa</Text>
            
            <View style={styles.featureCard}>
              <Text style={styles.featureTitle}>📱 Frontend (Expo)</Text>
              <Text style={styles.featureDescription}>
                React Native + Expo + TypeScript
              </Text>
            </View>

            <View style={styles.featureCard}>
              <Text style={styles.featureTitle}>🌐 Backend (Railway)</Text>
              <Text style={styles.featureDescription}>
                Node.js + Express + Drizzle ORM
              </Text>
            </View>

            <View style={styles.featureCard}>
              <Text style={styles.featureTitle}>🗄️ Database (Supabase)</Text>
              <Text style={styles.featureDescription}>
                PostgreSQL + Auth + Real-time
              </Text>
            </View>
          </View>

          {/* URLs */}
          <View style={styles.urlsSection}>
            <Text style={styles.sectionTitle}>🔗 URLs do Projeto</Text>
            
            <View style={styles.urlCard}>
              <Text style={styles.urlTitle}>Frontend (Expo)</Text>
              <Text style={styles.urlText}>expo.dev/accounts/obritrum/projects/orbitrum</Text>
            </View>

            <View style={styles.urlCard}>
              <Text style={styles.urlTitle}>Backend (Railway)</Text>
              <Text style={styles.urlText}>{railwayApiUrl}</Text>
            </View>

            <View style={styles.urlCard}>
              <Text style={styles.urlTitle}>Database (Supabase)</Text>
              <Text style={styles.urlText}>{supabaseUrl}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
      <StatusBar style="light" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 10,
  },
  statusText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 10,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  statusCard: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 5,
  },
  urlText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    fontFamily: 'monospace',
  },
  userSection: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  userInfo: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 5,
  },
  authSection: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  authText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  featuresSection: {
    marginBottom: 20,
  },
  featureCard: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 5,
  },
  featureDescription: {
    fontSize: 14,
    color: '#ccc',
  },
  urlsSection: {
    marginBottom: 20,
  },
  urlCard: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  urlTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 5,
  },
});
