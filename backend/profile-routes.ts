import { Request, Response } from 'express';
import { storage } from './storage';

// Interface para dados do perfil
interface ProfileData {
  userId: number;
  userType: 'client' | 'professional';
  displayName: string;
  bio?: string;
  phone?: string;
  city?: string;
  state?: string;
  profession?: string;
  experience?: string;
  skills?: string[];
  hourlyRate?: number;
  availability?: 'disponivel' | 'ocupado' | 'offline';
  profileImage?: string;
  completionPercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

// GET - Buscar perfil do usuário
export async function getProfile(req: Request, res: Response) {
  try {
    const { userType, userId } = req.params;
    
    if (!userType || !userId) {
      return res.status(400).json({ error: 'UserType e userId são obrigatórios' });
    }

    if (!['client', 'professional'].includes(userType)) {
      return res.status(400).json({ error: 'UserType deve ser client ou professional' });
    }

    const profile = await storage.getProfile(parseInt(userId), userType as 'client' | 'professional');
    
    if (!profile) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }

    res.json(profile);
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// POST - Salvar/atualizar perfil do usuário
export async function saveProfile(req: Request, res: Response) {
  try {
    const { userType } = req.params;
    const userEmail = req.headers['user-email'] as string;
    
    if (!userEmail) {
      return res.status(401).json({ error: 'Email do usuário é obrigatório' });
    }

    if (!userType || !['client', 'professional'].includes(userType)) {
      return res.status(400).json({ error: 'UserType deve ser client ou professional' });
    }

    // Buscar usuário pelo email
    const user = await storage.getUserByEmail(userEmail);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Validar dados obrigatórios
    const {
      displayName,
      bio,
      phone,
      city,
      state,
      profession,
      experience,
      skills,
      hourlyRate,
      availability,
      profileImage
    } = req.body;

    if (!displayName || displayName.trim().length < 2) {
      return res.status(400).json({ error: 'Nome deve ter pelo menos 2 caracteres' });
    }

    // Para profissionais, categoria é obrigatória
    if (userType === 'professional' && !profession) {
      return res.status(400).json({ error: 'Categoria profissional é obrigatória' });
    }

    // Calcular porcentagem de completude
    const requiredFields = [
      displayName,
      bio,
      phone,
      city,
      profileImage,
      userType === 'professional' ? profession : true,
      userType === 'professional' ? hourlyRate : true,
    ];
    const completedFields = requiredFields.filter(field => field && field !== '').length;
    const completionPercentage = Math.round((completedFields / requiredFields.length) * 100);

    const profileData: Partial<ProfileData> = {
      userId: user.id,
      userType: userType as 'client' | 'professional',
      displayName: displayName.trim(),
      bio: bio?.trim() || '',
      phone: phone?.trim() || '',
      city: city?.trim() || '',
      state: state?.trim() || '',
      profession: profession?.trim() || '',
      experience: experience?.trim() || '',
      skills: Array.isArray(skills) ? skills : [],
      hourlyRate: userType === 'professional' ? Number(hourlyRate) || 0 : undefined,
      availability: availability || 'disponivel',
      profileImage: profileImage || '',
      completionPercentage,
      updatedAt: new Date()
    };

    // Verificar se perfil já existe
    const existingProfile = await storage.getProfile(user.id, userType as 'client' | 'professional');
    
    let result;
    if (existingProfile) {
      result = await storage.updateProfile(user.id, userType as 'client' | 'professional', profileData);
    } else {
      profileData.createdAt = new Date();
      result = await storage.createProfile(profileData as ProfileData);
    }

    // Se for profissional, atualizar também a lista de profissionais
    if (userType === 'professional') {
      await storage.updateProfessionalFromProfile(user.id, profileData);
    }

    res.json({ 
      success: true, 
      profile: result,
      message: 'Perfil atualizado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao salvar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// GET - Buscar todos os perfis completos (para busca orbital)
export async function getCompletedProfiles(req: Request, res: Response) {
  try {
    const { userType = 'professional' } = req.query;
    
    if (!['client', 'professional'].includes(userType as string)) {
      return res.status(400).json({ error: 'UserType deve ser client ou professional' });
    }

    const profiles = await storage.getCompletedProfiles(userType as 'client' | 'professional');
    
    res.json(profiles);
  } catch (error) {
    console.error('Erro ao buscar perfis completos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}