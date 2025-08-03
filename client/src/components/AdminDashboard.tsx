import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  user_type: 'client' | 'professional' | 'admin';
  tokens: number;
  created_at: string;
}

interface Professional {
  id: string;
  name: string;
  category: string;
  rating: number;
  status: 'active' | 'inactive';
}

export function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Fetch professionals
      const { data: professionalsData, error: professionalsError } = await supabase
        .from('professionals')
        .select('*')
        .order('name');

      if (professionalsError) throw professionalsError;

      setUsers(usersData || []);
      setProfessionals(professionalsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: 'activate' | 'deactivate') => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: action === 'activate' ? 'active' : 'inactive' })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Usuário ${action === 'activate' ? 'ativado' : 'desativado'} com sucesso`
      });

      fetchData();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao executar ação",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard Administrativo</h1>
        <p className="text-muted-foreground">Gerencie usuários e profissionais</p>
      </div>

      <div className="grid gap-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profissionais Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {professionals.filter(p => p.status === 'active').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Tokens</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.reduce((sum, user) => sum + (user.tokens || 0), 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="professionals">Profissionais</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{user.email}</div>
                      <div className="text-sm text-muted-foreground">
                        Tipo: {user.user_type} | Tokens: {user.tokens?.toLocaleString() || 0}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={user.user_type === 'admin' ? 'default' : 'secondary'}>
                        {user.user_type}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUserAction(user.id, 'activate')}
                      >
                        Ativar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="professionals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profissionais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {professionals.map((professional) => (
                  <div key={professional.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{professional.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Categoria: {professional.category} | Avaliação: {professional.rating}/5
                      </div>
                    </div>
                    <Badge variant={professional.status === 'active' ? 'default' : 'secondary'}>
                      {professional.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}