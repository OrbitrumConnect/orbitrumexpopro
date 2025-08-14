import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { createClient, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuração do Supabase
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://gnvxnsgewhjucdhwrrdi.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdudnhuc2dld2hqdWNkaHdycmRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2Nzk1NDAsImV4cCI6MjA2ODI1NTU0MH0.p0LjK34rpLRVnG0F002PL5MbqSJOvyUebUBWAruMpi0';

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

  useEffect(() => {
    checkAuth();
  }, []);

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
    } catch (error: any) {
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
    } catch (error: any) {
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
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>🚀 Orbitrum Connect</Text>
          <Text style={styles.subtitle}>SDK 53 - Funcionando!</Text>
        </View>

        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            {user ? `✅ Logado como: ${user.email || 'Usuário anônimo'}` : '❌ Não logado'}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          {!user ? (
            <TouchableOpacity style={styles.button} onPress={signInAnonymously}>
              <Text style={styles.buttonText}>🔐 Login Anônimo</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.button} onPress={signOut}>
              <Text style={styles.buttonText}>🚪 Logout</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>📱 App funcionando perfeitamente!</Text>
          <Text style={styles.infoText}>🎯 SDK 53 compatível</Text>
          <Text style={styles.infoText}>🔗 Supabase conectado</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
  },
  statusContainer: {
    backgroundColor: '#111',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoContainer: {
    backgroundColor: '#111',
    padding: 20,
    borderRadius: 10,
  },
  infoText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 5,
  },
});
