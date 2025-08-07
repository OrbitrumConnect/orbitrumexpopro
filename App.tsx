import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { createClient, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuração do Supabase - SUBSTITUA PELAS SUAS CREDENCIAIS
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://seu-projeto.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sua-chave-anonima';

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

  useEffect(() => {
    checkConnection();
    checkAuth();
  }, []);

  const checkConnection = async () => {
    try {
      // Testar conexão com Supabase
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      if (error) {
        setConnectionStatus('Erro: ' + error.message);
      } else {
        setConnectionStatus('✅ Conectado ao Supabase');
      }
    } catch (error) {
      setConnectionStatus('❌ Erro de conexão');
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
          <Text style={styles.statusText}>{connectionStatus}</Text>
        </View>

        <View style={styles.content}>
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

          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>🏗️ Arquitetura</Text>
            
            <View style={styles.featureCard}>
              <Text style={styles.featureTitle}>📱 Frontend</Text>
              <Text style={styles.featureDescription}>
                React Native + Expo
              </Text>
            </View>

            <View style={styles.featureCard}>
              <Text style={styles.featureTitle}>🌐 Backend</Text>
              <Text style={styles.featureDescription}>
                Node.js + Express (Railway)
              </Text>
            </View>

            <View style={styles.featureCard}>
              <Text style={styles.featureTitle}>🗄️ Database</Text>
              <Text style={styles.featureDescription}>
                Supabase (PostgreSQL)
              </Text>
            </View>
          </View>

          <View style={styles.configSection}>
            <Text style={styles.sectionTitle}>⚙️ Configuração</Text>
            <Text style={styles.configText}>
              Para configurar completamente:
            </Text>
            <Text style={styles.configText}>
              1. Crie projeto no Supabase
            </Text>
            <Text style={styles.configText}>
              2. Configure as credenciais no .env
            </Text>
            <Text style={styles.configText}>
              3. Deploy o backend no Railway
            </Text>
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
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
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
  configSection: {
    marginTop: 20,
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 8,
  },
  configText: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 5,
  },
});
