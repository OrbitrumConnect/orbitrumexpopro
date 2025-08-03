import { pgTable, text, varchar, serial, integer, boolean, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  emailVerificationToken: text("email_verification_token"),
  passwordHash: text("password_hash"), // Para autenticação local
  supabaseId: text("supabase_id").unique(), // ID do Supabase Auth
  // Campo para identificar tipo de usuário
  userType: text("user_type").notNull().default("client"), // client, professional, admin
  // Novos campos obrigatórios para clientes
  phone: text("phone"), // Telefone com DDD
  fullName: text("full_name"), // Nome completo
  profilePhoto: text("profile_photo"), // Foto de perfil (opcional)
  pixKey: text("pix_key"), // Chave Pix para receber cashback
  pixKeyValidated: boolean("pix_key_validated").notNull().default(false),
  termsAccepted: boolean("terms_accepted").notNull().default(false),
  termsAcceptedAt: timestamp("terms_accepted_at"),
  tokens: integer("tokens").notNull().default(20), // Manter compatibilidade
  plan: text("plan").notNull().default("free"), // free, freeOrbitrum, basic, pro, max
  planActivatedAt: timestamp("plan_activated_at"),
  planExpiryDate: timestamp("plan_expiry_date"),
  credits: integer("credits").notNull().default(20),
  maxCredits: integer("max_credits").notNull().default(20),
  gamesPlayedToday: integer("games_played_today").notNull().default(0),
  lastGameDate: text("last_game_date"),
  highScore: integer("high_score").notNull().default(0),
  // Novo sistema de tokens expandido
  tokensPlano: integer("tokens_plano").notNull().default(0),
  tokensGanhos: integer("tokens_ganhos").notNull().default(0),
  tokensComprados: integer("tokens_comprados").notNull().default(0),
  tokensUsados: integer("tokens_usados").notNull().default(0),
  creditosAcumulados: integer("creditos_acumulados").notNull().default(0),
  creditosSacados: integer("creditos_sacados").notNull().default(0),
  dataInicioPlano: text("data_inicio_plano"),
  ultimoSaque: timestamp("ultimo_saque"), // Controle do último saque
  saqueDisponivel: integer("saque_disponivel").notNull().default(0), // Valor disponível para saque no dia 3
  notificacaoSaque: boolean("notificacao_saque").default(true), // Se recebe notificações
  // Para administradores
  adminLevel: integer("admin_level").default(0), // 0=normal, 1=moderator, 2=admin, 3=super_admin
  adminPermissions: text("admin_permissions").array().default([]),
  // Verificação de documentos obrigatória
  documentsStatus: text("documents_status").notNull().default("pending"), // pending, submitted, approved, rejected
  documentsSubmittedAt: timestamp("documents_submitted_at"),
  documentsApprovedAt: timestamp("documents_approved_at"),
  canMakePurchases: boolean("can_make_purchases").notNull().default(false), // Só true após aprovação
  // Administração de usuários
  suspended: boolean("suspended").notNull().default(false),
  suspendedReason: text("suspended_reason"),
  suspendedAt: timestamp("suspended_at"),
  banned: boolean("banned").notNull().default(false),
  bannedReason: text("banned_reason"),
  bannedAt: timestamp("banned_at"),
  bannedUntil: timestamp("banned_until"),
  // Sistema de Referral Promocional
  isPromotionalUser: boolean("is_promotional_user").notNull().default(false),
  promotionalCode: text("promotional_code"), // Código único de referral
  referredBy: text("referred_by"), // Código de quem convidou
  referralCount: integer("referral_count").notNull().default(0), // Quantos convidou
  promotionalPlanExpiry: timestamp("promotional_plan_expiry"), // Expiry do plano promocional
  promotionalBonusMonths: integer("promotional_bonus_months").notNull().default(0), // Meses extras ganhos
  promotionalPhase: text("promotional_phase").default("active"), // active, expired, converted
  // Free Orbitrum Plan Limits
  freePlanMonthlyReset: text("free_plan_monthly_reset"), // Mês do último reset (YYYY-MM)
  freePlanAiSearches: integer("free_plan_ai_searches").notNull().default(10), // Buscas IA restantes
  freePlanPlanetViews: integer("free_plan_planet_views").notNull().default(2), // Visualizações planeta a cada 3 dias
  freePlanProfileViews: integer("free_plan_profile_views").notNull().default(1), // Visualizações perfil diárias
  freePlanMessages: integer("free_plan_messages").notNull().default(2), // Mensagens recebidas mensais
  freePlanLastDailyReset: text("free_plan_last_daily_reset"), // Data do último reset diário (YYYY-MM-DD)
  freePlanLastPlanetReset: text("free_plan_last_planet_reset") // Data do último reset de planetas (a cada 3 dias)
});

// Nova tabela para sistema de referral
export const referralCampaigns = pgTable("referral_campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // "Campanha 100 Clientes Iniciais"
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  maxParticipants: integer("max_participants").notNull().default(100),
  currentParticipants: integer("current_participants").notNull().default(0),
  requiredReferrals: integer("required_referrals").notNull().default(3), // Quantos precisa convidar
  bonusMonths: integer("bonus_months").notNull().default(1), // Meses extras por atingir meta
  planOffered: text("plan_offered").notNull().default("max"), // Plano oferecido
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow()
});

// Tabela para tracking de referrals
export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => referralCampaigns.id),
  referrerId: integer("referrer_id").notNull().references(() => users.id), // Quem convidou
  referredId: integer("referred_id").notNull().references(() => users.id), // Quem foi convidado
  referralCode: text("referral_code").notNull(), // Código usado
  referredType: text("referred_type").notNull(), // client ou professional
  status: text("status").notNull().default("pending"), // pending, confirmed, expired
  createdAt: timestamp("created_at").defaultNow(),
  confirmedAt: timestamp("confirmed_at"),
  bonusAppliedAt: timestamp("bonus_applied_at")
});

// Tabela para armazenar documentos dos usuários
export const userDocuments = pgTable("user_documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  documentType: text("document_type").notNull(), // selfie, id_document, proof_residence, professional_portfolio
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  rejectionReason: text("rejection_reason"),
  reviewedBy: integer("reviewed_by").references(() => users.id), // Admin que analisou
  reviewedAt: timestamp("reviewed_at"),
});

// Categorias profissionais disponíveis
export const professionalCategories = pgTable("professional_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  icon: text("icon"), // Lucide icon name
  color: text("color"), // Tailwind color class
  skills: text("skills").array().default([]), // Skills/services disponíveis
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const professionals = pgTable("professionals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // Link com usuário
  categoryId: integer("category_id").references(() => professionalCategories.id), // Categoria escolhida
  name: text("name").notNull(),
  title: text("title").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"), // Telefone com DDD
  // Dados obrigatórios conforme regras da plataforma
  cpf: text("cpf").notNull(), // CPF obrigatório
  cep: text("cep").notNull(), // CEP obrigatório  
  address: text("address"), // Endereço completo
  proofOfResidence: text("proof_of_residence"), // Comprovante de residência (URL)
  pixKey: text("pix_key").notNull(), // Chave Pix obrigatória
  pixKeyValidated: boolean("pix_key_validated").notNull().default(false),
  documentsValidated: boolean("documents_validated").notNull().default(false),
  termsAccepted: boolean("terms_accepted").notNull().default(false),
  termsAcceptedAt: timestamp("terms_accepted_at"),
  rating: real("rating").notNull().default(0),
  reviewCount: integer("review_count").notNull().default(0),
  avatar: text("avatar").notNull(),
  orbitRing: integer("orbit_ring").notNull(), // 1, 2, or 3
  orbitPosition: integer("orbit_position").notNull(), // position in ring
  services: text("services").array().notNull().default([]),
  servicesPricing: text("services_pricing").array().notNull().default([]), // Array de preços correspondentes
  hourlyRate: integer("hourly_rate").notNull(),
  available: boolean("available").notNull().default(true),
  // Sistema de tokens para profissionais
  tokensReceived: integer("tokens_received").notNull().default(0),
  tokensWithdrawn: integer("tokens_withdrawn").notNull().default(0),
  lastWithdrawal: timestamp("last_withdrawal"),
  // Status profissional
  verified: boolean("verified").notNull().default(false),
  suspended: boolean("suspended").notNull().default(false),
  suspensionReason: text("suspension_reason"),
  isDemo: boolean("is_demo").notNull().default(false), // Profissionais demonstrativos IA
  // Geolocalização para proximity matching
  latitude: real("latitude"), // Coordenada GPS latitude
  longitude: real("longitude"), // Coordenada GPS longitude
  city: text("city"), // Cidade extraída do CEP
  state: text("state"), // Estado (SP, RJ, MG...)
  country: text("country").default("Brasil"), // País
  workRadius: integer("work_radius").default(20), // Raio de atendimento em KM
  // IA Matching System 
  skills: text("skills").array().default([]), // Skills técnicas detalhadas
  experienceYears: integer("experience_years").default(0), // Anos de experiência
  completedProjects: integer("completed_projects").default(0), // Projetos finalizados
  responseTimeHours: integer("response_time_hours").default(24), // Tempo médio de resposta
  workPreferences: text("work_preferences").array().default([]), // ["presencial", "remoto", "hibrido"]
  specializations: text("specializations").array().default([]), // Especializações técnicas
  // Sistema de Auto-Aceitar Solicitações
  autoAcceptRequests: boolean("auto_accept_requests").notNull().default(false), // Liga/desliga auto-aceitar
  autoAcceptEnabled: boolean("auto_accept_enabled").notNull().default(false), // Status atual
  autoAcceptTimeoutHours: integer("auto_accept_timeout_hours").notNull().default(1), // Prazo em horas (padrão 1h)
  autoAcceptLastUsed: timestamp("auto_accept_last_used"), // Última vez que foi usado
  autoAcceptCount: integer("auto_accept_count").notNull().default(0), // Contador de usos
  portfolioUrl: text("portfolio_url"), // URL do portfólio
  linkedinUrl: text("linkedin_url"), // URL do LinkedIn
  // Algoritmo IA Score
  aiMatchScore: real("ai_match_score").default(0), // Score calculado pela IA 0-100
  personalityType: text("personality_type"), // DISC, Myers-Briggs etc
  communicationStyle: text("communication_style"), // "formal", "casual", "técnico"
  workMethodology: text("work_methodology"), // "agile", "waterfall", "kanban"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela de serviços oferecidos pelos profissionais com preços em tokens
export const professionalServices = pgTable("professional_services", {
  id: serial("id").primaryKey(),
  professionalId: integer("professional_id").notNull().references(() => professionals.id),
  serviceName: text("service_name").notNull(), // "Consultoria Inicial", "Desenvolvimento Web", etc
  description: text("description"), // Descrição detalhada do serviço
  tokenPrice: integer("token_price").notNull(), // Preço em tokens (1500, 2000, 2500, 3000)
  estimatedDuration: text("estimated_duration"), // "1-2 horas", "1 semana", etc
  serviceType: text("service_type").notNull(), // "consultation", "development", "design", etc
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProfessionalServiceSchema = createInsertSchema(professionalServices).omit({
  id: true,
  createdAt: true,
});

export const gameScores = pgTable("game_scores", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  score: integer("score").notNull(),
  tokensEarned: real("tokens_earned").notNull(),
  duration: integer("duration").notNull(), // in seconds
  createdAt: text("created_at").notNull(),
});

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  professionalIds: text("professional_ids").array().notNull().default([]),
  totalCost: integer("total_cost").default(0), // Custo total sem desconto
  discountPercentage: integer("discount_percentage").default(0), // 15% ou 20%
  finalCost: integer("final_cost").default(0), // Custo final com desconto
  memberCount: integer("member_count").default(0), // Número de profissionais
  createdAt: text("created_at").notNull(),
});

// Tabela de contratações de equipes com preços e descontos
export const teamHiring = pgTable("team_hiring", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teams.id),
  userId: integer("user_id").notNull(), // Cliente que está contratando
  professionals: text("professionals").array().notNull().default([]), // IDs dos profissionais selecionados
  totalTokens: integer("total_tokens").notNull(), // Custo total sem desconto
  discountPercentage: integer("discount_percentage").default(0), // 15% (5+) ou 20% (10+)
  finalTokens: integer("final_tokens").notNull(), // Custo final com desconto
  status: text("status").notNull().default("pending"), // "pending", "paid", "active", "completed"
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTeamHiringSchema = createInsertSchema(teamHiring).omit({
  id: true,
  createdAt: true,
});

// Tabela de solicitações de equipe enviadas pelos clientes aos profissionais
export const teamRequests = pgTable("team_requests", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(), // ID do cliente que fez a solicitação
  professionalId: integer("professional_id").notNull(), // ID do profissional solicitado
  teamId: integer("team_id").notNull(), // ID da equipe do cliente
  projectTitle: varchar("project_title", { length: 255 }).notNull(),
  projectDescription: text("project_description").notNull(),
  estimatedBudget: integer("estimated_budget"), // Em centavos
  estimatedDuration: varchar("estimated_duration", { length: 100 }), // "2 semanas", "1 mês", etc.
  urgency: varchar("urgency", { length: 50 }).notNull().default("normal"), // "baixa", "normal", "alta", "urgente"
  status: varchar("status", { length: 50 }).notNull().default("pending"), // "pending", "accepted", "rejected", "completed", "trashed"
  professionalResponse: text("professional_response"), // Resposta do profissional
  contactInfo: text("contact_info"), // Info de contato após aceitar
  trashedAt: timestamp("trashed_at"), // Quando foi movido para lixeira
  expiresAt: timestamp("expires_at"), // Quando expira da lixeira (5 minutos após trashedAt)
  createdAt: timestamp("created_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
});

// Tabela de conversas entre cliente e profissional após aceitar solicitação
export const teamMessages = pgTable("team_messages", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull(), // ID da solicitação da equipe
  senderId: integer("sender_id").notNull(), // ID de quem enviou (cliente ou profissional)
  senderType: varchar("sender_type", { length: 20 }).notNull(), // "client" ou "professional"
  message: text("message").notNull(),
  attachments: text("attachments").array().default([]), // URLs de arquivos anexos
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tokenOperations = pgTable("token_operations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  tipo: text("tipo").notNull(), // 'consumo', 'saque', 'ganho', 'compra', 'cashback'
  motivo: text("motivo").notNull(),
  valor: integer("valor").notNull(),
  saldoAnterior: integer("saldo_anterior").notNull(),
  saldoPosterior: integer("saldo_posterior").notNull(),
  createdAt: text("created_at").notNull(),
});

// Nova tabela para ações administrativas
export const adminActions = pgTable("admin_actions", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").notNull(),
  targetType: text("target_type").notNull(), // 'user', 'professional', 'platform'
  targetId: integer("target_id"),
  action: text("action").notNull(), // 'suspend', 'validate', 'moderate', 'approve', etc.
  reason: text("reason"),
  details: text("details"),
  reversible: boolean("reversible").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tabela para validações de documentos profissionais
export const professionalValidations = pgTable("professional_validations", {
  id: serial("id").primaryKey(),
  professionalId: integer("professional_id").notNull(),
  documentType: text("document_type").notNull(), // 'cpf', 'address', 'pix', 'identity'
  status: text("status").notNull().default("pending"), // 'pending', 'approved', 'rejected'
  validatedBy: integer("validated_by"), // ID do admin que validou
  validatedAt: timestamp("validated_at"),
  rejectionReason: text("rejection_reason"),
  documentUrl: text("document_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Sistema de saques automáticos 8.7%
export const withdrawalRequests = pgTable("withdrawal_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: integer("amount").notNull(), // Valor em tokens (ex: 1000 = R$ 1,00)
  pixKey: text("pix_key").notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'completed', 'expired'
  windowDate: text("window_date").notNull(), // Data da janela (ex: "2025-07-03")
  requestedAt: timestamp("requested_at").defaultNow(),
  processedAt: timestamp("processed_at"),
  expiresAt: timestamp("expires_at").notNull(), // Expira às 00:00 do dia 4
  createdAt: timestamp("created_at").defaultNow(),
});

// Notificações para usuários
export const userNotifications = pgTable("user_notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // 'withdrawal_available', 'withdrawal_reminder', 'plan_update', 'system'
  urgent: boolean("urgent").notNull().default(false),
  read: boolean("read").notNull().default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Eventos do sistema para auditoria
export const systemEvents = pgTable("system_events", {
  id: serial("id").primaryKey(),
  eventType: text("event_type").notNull(), // 'WITHDRAWAL_WINDOW_OPENED', 'WITHDRAWAL_WINDOW_CLOSED'
  description: text("description").notNull(),
  metadata: text("metadata"), // JSON com dados adicionais
  createdAt: timestamp("created_at").defaultNow(),
});

// Tabela para equipes profissionais (empresas/CNPJs)
export const professionalTeams = pgTable("professional_teams", {
  id: serial("id").primaryKey(),
  professionalId: integer("professional_id").notNull().references(() => users.id), // Profissional que criou a equipe
  teamName: text("team_name").notNull(),
  description: text("description"),
  companyType: text("company_type").notNull().default("individual"), // individual, empresa, cnpj
  cnpj: text("cnpj"), // CNPJ se for empresa
  professionalDiscount: real("professional_discount").notNull().default(0.10), // 10% desconto padrão
  status: text("status").notNull().default("active"), // active, inactive, suspended
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela para funcionários das equipes profissionais
export const teamEmployees = pgTable("team_employees", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => professionalTeams.id),
  name: text("name").notNull(),
  cpf: text("cpf").notNull(),
  email: text("email"), // Se for usuário da plataforma
  userId: integer("user_id").references(() => users.id), // Se for usuário existente da plataforma
  photoUrl: text("photo_url"),
  documentsUrl: text("documents_url"),
  fromPlatform: boolean("from_platform").notNull().default(false), // Se veio da busca da plataforma
  status: text("status").notNull().default("active"), // active, inactive, pending
  role: text("role").default("employee"), // employee, coordinator, manager
  invitedAt: timestamp("invited_at"),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tabela para convites de equipe enviados via plataforma
export const teamInvitations = pgTable("team_invitations", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => professionalTeams.id),
  inviterId: integer("inviter_id").notNull().references(() => users.id), // Quem enviou o convite
  invitedUserId: integer("invited_user_id").notNull().references(() => users.id), // Quem foi convidado
  message: text("message"),
  status: text("status").notNull().default("pending"), // pending, accepted, rejected, expired
  expiresAt: timestamp("expires_at").notNull(), // Convites expiram em 7 dias
  sentAt: timestamp("sent_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  tokens: true,
  gamesPlayedToday: true,
  lastGameDate: true,
  highScore: true,
  tokensPlano: true,
  tokensGanhos: true,
  tokensComprados: true,
  tokensUsados: true,
  creditosAcumulados: true,
  creditosSacados: true,
  ultimoSaque: true,
  adminLevel: true,
  adminPermissions: true,
});

export const insertTokenOperationSchema = createInsertSchema(tokenOperations).omit({
  id: true,
  createdAt: true,
});

export const insertProfessionalSchema = createInsertSchema(professionals).omit({
  id: true,
  rating: true,
  reviewCount: true,
  pixKeyValidated: true,
  documentsValidated: true,
  termsAcceptedAt: true,
  tokensReceived: true,
  tokensWithdrawn: true,
  lastWithdrawal: true,
  verified: true,
  suspended: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGameScoreSchema = createInsertSchema(gameScores).omit({
  id: true,
  createdAt: true,
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
});

export const insertAdminActionSchema = createInsertSchema(adminActions).omit({
  id: true,
  createdAt: true,
});

export const insertProfessionalValidationSchema = createInsertSchema(professionalValidations).omit({
  id: true,
  validatedAt: true,
  createdAt: true,
});

// Schemas para categorias profissionais
export const insertProfessionalCategorySchema = createInsertSchema(professionalCategories).omit({
  id: true,
  createdAt: true,
});

export const insertProfessionalTeamSchema = createInsertSchema(professionalTeams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTeamEmployeeSchema = createInsertSchema(teamEmployees).omit({
  id: true,
  createdAt: true,
});

export const insertTeamInvitationSchema = createInsertSchema(teamInvitations).omit({
  id: true,
  sentAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type Professional = typeof professionals.$inferSelect;
export type InsertProfessional = typeof professionals.$inferInsert;

export type ProfessionalCategory = typeof professionalCategories.$inferSelect;
export type InsertProfessionalCategory = typeof professionalCategories.$inferInsert;

export type GameScore = typeof gameScores.$inferSelect;
export type InsertGameScore = typeof gameScores.$inferInsert;

export type ProfessionalTeam = typeof professionalTeams.$inferSelect;
export type InsertProfessionalTeam = typeof professionalTeams.$inferInsert;

export type TeamEmployee = typeof teamEmployees.$inferSelect;
export type InsertTeamEmployee = typeof teamEmployees.$inferInsert;

export type TeamInvitation = typeof teamInvitations.$inferSelect;
export type InsertTeamInvitation = typeof teamInvitations.$inferInsert;

export type Team = typeof teams.$inferSelect;
export type InsertTeam = typeof teams.$inferInsert;

export type TeamRequest = typeof teamRequests.$inferSelect;
export type InsertTeamRequest = typeof teamRequests.$inferInsert;

export type TeamMessage = typeof teamMessages.$inferSelect;
export type InsertTeamMessage = typeof teamMessages.$inferInsert;

// Schemas Zod para validação das novas tabelas
export const insertTeamRequestSchema = createInsertSchema(teamRequests).omit({
  id: true,
  createdAt: true,
  respondedAt: true,
});

export const insertTeamMessageSchema = createInsertSchema(teamMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertTeamRequestForm = z.infer<typeof insertTeamRequestSchema>;
export type InsertTeamMessageForm = z.infer<typeof insertTeamMessageSchema>;
export type ProfessionalService = typeof professionalServices.$inferSelect;
export type InsertProfessionalService = z.infer<typeof insertProfessionalServiceSchema>;
export type InsertTokenOperation = z.infer<typeof insertTokenOperationSchema>;
export type TokenOperation = typeof tokenOperations.$inferSelect;
export type InsertAdminAction = z.infer<typeof insertAdminActionSchema>;
export type AdminAction = typeof adminActions.$inferSelect;
export type InsertProfessionalValidation = z.infer<typeof insertProfessionalValidationSchema>;
export type TeamHiring = typeof teamHiring.$inferSelect;
export type InsertTeamHiring = z.infer<typeof insertTeamHiringSchema>;
export type ProfessionalValidation = typeof professionalValidations.$inferSelect;

export type WithdrawalRequest = typeof withdrawalRequests.$inferSelect;
export type InsertWithdrawalRequest = typeof withdrawalRequests.$inferInsert;

export type UserNotification = typeof userNotifications.$inferSelect;
export type InsertUserNotification = typeof userNotifications.$inferInsert;

export type SystemEvent = typeof systemEvents.$inferSelect;
export type InsertSystemEvent = typeof systemEvents.$inferInsert;

// Service requests table for dashboard system
export const serviceRequests = pgTable("service_requests", {
  id: text("id").primaryKey().notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  professionalId: integer("professional_id").references(() => professionals.id).notNull(),
  description: text("description").notNull(),
  location: varchar("location"),
  urgency: varchar("urgency").notNull(), // "baixa", "media", "alta"
  suggestedTokens: integer("suggested_tokens").notNull(),
  status: varchar("status").notNull().default("pendente"), // "pendente", "aceito", "recusado", "em_andamento", "concluido"
  responseDeadline: timestamp("response_deadline").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
  completedAt: timestamp("completed_at"),
});

export type ServiceRequest = typeof serviceRequests.$inferSelect;
export type InsertServiceRequest = typeof serviceRequests.$inferInsert;

export const insertServiceRequestSchema = createInsertSchema(serviceRequests).omit({
  id: true,
  createdAt: true,
  respondedAt: true,
  completedAt: true,
});

export type InsertServiceRequestForm = z.infer<typeof insertServiceRequestSchema>;

// Certificações profissionais obrigatórias (NR 35, CREA, etc.)
export const professionalCertifications = pgTable("professional_certifications", {
  id: serial("id").primaryKey(),
  professionalId: integer("professional_id").notNull(),
  certificationType: varchar("certification_type", { length: 50 }).notNull(), // NR35, NR10, NR18, CREA, AWS, etc.
  certificationNumber: varchar("certification_number", { length: 100 }).notNull(),
  issuingEntity: varchar("issuing_entity", { length: 200 }).notNull(), // SENAI, CREA, MTE, etc.
  issueDate: timestamp("issue_date").notNull(),
  expiryDate: timestamp("expiry_date"),
  documentUrl: varchar("document_url", { length: 500 }), // Upload do certificado
  validationStatus: varchar("validation_status", { length: 20 }).default("pending"), // pending, approved, rejected
  adminNotes: text("admin_notes"),
  validatedBy: varchar("validated_by", { length: 100 }),
  validatedAt: timestamp("validated_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Requisitos de certificação por categoria profissional
export const professionCertificationRequirements = pgTable("profession_certification_requirements", {
  id: serial("id").primaryKey(),
  category: varchar("category", { length: 100 }).notNull(), // "Casa e Construção", "Tecnologia", etc.
  specialty: varchar("specialty", { length: 100 }).notNull(), // "Pintor", "Eletricista", etc.
  certificationType: varchar("certification_type", { length: 50 }).notNull(), // NR35, NR10, etc.
  isRequired: boolean("is_required").default(true),
  riskLevel: varchar("risk_level", { length: 20 }).notNull(), // high, medium, low
  description: text("description"),
  legalBasis: varchar("legal_basis", { length: 200 }), // "NR 35 item 35.1.1"
  createdAt: timestamp("created_at").defaultNow(),
});

export type ProfessionalCertification = typeof professionalCertifications.$inferSelect;
export type InsertProfessionalCertification = typeof professionalCertifications.$inferInsert;

export type ProfessionCertificationRequirement = typeof professionCertificationRequirements.$inferSelect;
export type InsertProfessionCertificationRequirement = typeof professionCertificationRequirements.$inferInsert;

export const insertProfessionalCertificationSchema = createInsertSchema(professionalCertifications).omit({
  id: true,
  validatedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProfessionCertificationRequirementSchema = createInsertSchema(professionCertificationRequirements).omit({
  id: true,
  createdAt: true,
});

export type InsertProfessionalCertificationForm = z.infer<typeof insertProfessionalCertificationSchema>;
export type InsertProfessionCertificationRequirementForm = z.infer<typeof insertProfessionCertificationRequirementSchema>;

// Dados de exemplo para desenvolvimento
export const SAMPLE_USERS: User[] = [
  {
    id: 1,
    username: "admin",
    email: "passosmir4@gmail.com",
    emailVerified: true,
    userType: "admin",
    tokens: 10000,
    plan: "max",
    credits: 100,
    maxCredits: 100,
    adminLevel: 3,
    documentsStatus: "approved",
    canMakePurchases: true,
    suspended: false,
    banned: false,
    isPromotionalUser: false,
    referralCount: 0,
    freePlanAiSearches: 10,
    freePlanPlanetViews: 2,
    freePlanProfileViews: 1,
    freePlanMessages: 2,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 2,
    username: "cliente1",
    email: "cliente1@test.com",
    emailVerified: true,
    userType: "client",
    fullName: "João Silva",
    phone: "(11) 99999-9999",
    pixKey: "joao@test.com",
    pixKeyValidated: true,
    termsAccepted: true,
    tokens: 500,
    plan: "basic",
    credits: 50,
    maxCredits: 50,
    documentsStatus: "approved",
    canMakePurchases: true,
    suspended: false,
    banned: false,
    isPromotionalUser: false,
    referralCount: 0,
    freePlanAiSearches: 10,
    freePlanPlanetViews: 2,
    freePlanProfileViews: 1,
    freePlanMessages: 2,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const SAMPLE_PROFESSIONALS: Professional[] = [
  // ADVOGADOS (5 opções)
  {
    id: 1,
    userId: 100,
    name: "Roberto Silva",
    title: "Advogado Civil",
    email: "roberto.silva@email.com",
    phone: "(11) 99999-1111",
    rating: 4.8,
    reviewCount: 127,
    skills: ["Direito Civil", "Contratos", "Direito do Consumidor"],
    hourlyRate: 2500,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
    orbitRing: 1,
    orbitPosition: 1,
    available: true,
    latitude: -23.5505,
    longitude: -46.6333,
    city: "São Paulo",
    state: "SP",
    workRadius: 35,
    services: ["Consultoria Jurídica", "Elaboração de Contratos", "Mediação"],
    servicesPricing: ["1500", "2000", "1800"],
    isDemo: true
  },
  {
    id: 2,
    userId: 101,
    name: "Lucia Mendes",
    title: "Advogada Trabalhista",
    email: "lucia.mendes@email.com",
    phone: "(11) 99999-2222",
    rating: 4.9,
    reviewCount: 89,
    skills: ["Direito Trabalhista", "Recursos", "Acordos"],
    hourlyRate: 2800,
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
    orbitRing: 1,
    orbitPosition: 2,
    available: true,
    latitude: -23.5605,
    longitude: -46.6433,
    city: "São Paulo",
    state: "SP",
    workRadius: 30,
    services: ["Processo Trabalhista", "Acordo Extrajudicial", "Consultoria"],
    servicesPricing: ["2000", "2500", "1800"],
    isDemo: true
  },
  {
    id: 3,
    userId: 102,
    name: "Carlos Oliveira",
    title: "Advogado Criminal",
    email: "carlos.oliveira@email.com",
    phone: "(11) 99999-3333",
    rating: 4.7,
    reviewCount: 156,
    skills: ["Direito Penal", "Processo Criminal", "Habeas Corpus"],
    hourlyRate: 3200,
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
    orbitRing: 1,
    orbitPosition: 3,
    available: true,
    latitude: -23.5405,
    longitude: -46.6233,
    city: "São Paulo",
    state: "SP",
    workRadius: 40,
    services: ["Defesa Criminal", "Habeas Corpus", "Recursos"],
    servicesPricing: ["3000", "2500", "2800"],
    isDemo: true
  },
  {
    id: 4,
    userId: 103,
    name: "Ana Costa",
    title: "Advogada Tributária",
    email: "ana.costa@email.com",
    phone: "(11) 99999-4444",
    rating: 4.6,
    reviewCount: 73,
    skills: ["Direito Tributário", "Planejamento Fiscal", "Recursos"],
    hourlyRate: 3500,
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
    orbitRing: 1,
    orbitPosition: 4,
    available: true,
    latitude: -23.5705,
    longitude: -46.6533,
    city: "São Paulo",
    state: "SP",
    workRadius: 25,
    services: ["Planejamento Tributário", "Defesa em Execução", "Consultoria"],
    servicesPricing: ["3500", "3000", "2500"],
    isDemo: true
  },
  {
    id: 5,
    userId: 104,
    name: "Fernando Santos",
    title: "Advogado Empresarial",
    email: "fernando.santos@email.com",
    phone: "(11) 99999-5555",
    rating: 4.8,
    reviewCount: 94,
    skills: ["Direito Empresarial", "Fusões e Aquisições", "Compliance"],
    hourlyRate: 4000,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
    orbitRing: 1,
    orbitPosition: 5,
    available: true,
    latitude: -23.5305,
    longitude: -46.6133,
    city: "São Paulo",
    state: "SP",
    workRadius: 50,
    services: ["Consultoria Empresarial", "Due Diligence", "Compliance"],
    servicesPricing: ["4000", "5000", "3500"],
    isDemo: true
  },

  // ELETRICISTAS (5 opções)
  {
    id: 6,
    userId: 105,
    name: "Carlos Mendes",
    title: "Eletricista Residencial",
    email: "carlos.mendes@email.com",
    phone: "(11) 99999-6666",
    rating: 4.7,
    reviewCount: 203,
    skills: ["Instalação Elétrica", "Manutenção", "Quadros de Distribuição"],
    hourlyRate: 800,
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
    orbitRing: 2,
    orbitPosition: 1,
    available: true,
    latitude: -23.5455,
    longitude: -46.6383,
    city: "São Paulo",
    state: "SP",
    workRadius: 20,
    services: ["Instalação Residencial", "Manutenção Elétrica", "Aterramento"],
    servicesPricing: ["800", "600", "1000"],
    isDemo: true
  },
  {
    id: 7,
    userId: 106,
    name: "João Pereira",
    title: "Eletricista Industrial",
    email: "joao.pereira@email.com",
    phone: "(11) 99999-7777",
    rating: 4.9,
    reviewCount: 167,
    skills: ["Instalação Industrial", "Automação", "Painéis Elétricos"],
    hourlyRate: 1200,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
    orbitRing: 2,
    orbitPosition: 2,
    available: true,
    latitude: -23.5555,
    longitude: -46.6483,
    city: "São Paulo",
    state: "SP",
    workRadius: 35,
    services: ["Instalação Industrial", "Manutenção Preventiva", "Automação"],
    servicesPricing: ["1200", "1000", "1500"],
    isDemo: true
  },
  {
    id: 8,
    userId: 107,
    name: "Pedro Almeida",
    title: "Eletricista Predial",
    email: "pedro.almeida@email.com",
    phone: "(11) 99999-8888",
    rating: 4.6,
    reviewCount: 145,
    skills: ["Instalação Predial", "Iluminação", "SPDA"],
    hourlyRate: 900,
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
    orbitRing: 2,
    orbitPosition: 3,
    available: true,
    latitude: -23.5355,
    longitude: -46.6283,
    city: "São Paulo",
    state: "SP",
    workRadius: 25,
    services: ["Instalação Predial", "Iluminação", "Para-raios"],
    servicesPricing: ["900", "700", "1200"],
    isDemo: true
  },
  {
    id: 9,
    userId: 108,
    name: "Miguel Costa",
    title: "Eletricista de Manutenção",
    email: "miguel.costa@email.com",
    phone: "(11) 99999-9999",
    rating: 4.8,
    reviewCount: 189,
    skills: ["Manutenção Elétrica", "Diagnóstico", "Reparos"],
    hourlyRate: 750,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
    orbitRing: 2,
    orbitPosition: 4,
    available: true,
    latitude: -23.5655,
    longitude: -46.6583,
    city: "São Paulo",
    state: "SP",
    workRadius: 30,
    services: ["Manutenção Preventiva", "Diagnóstico", "Reparos Urgentes"],
    servicesPricing: ["750", "600", "1000"],
    isDemo: true
  },
  {
    id: 10,
    userId: 109,
    name: "Rafael Silva",
    title: "Eletricista Especializado",
    email: "rafael.silva@email.com",
    phone: "(11) 99999-0000",
    rating: 4.7,
    reviewCount: 134,
    skills: ["Instalações Especiais", "Sistemas de Segurança", "Cabeamento"],
    hourlyRate: 1100,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
    orbitRing: 2,
    orbitPosition: 5,
    available: true,
    latitude: -23.5255,
    longitude: -46.6183,
    city: "São Paulo",
    state: "SP",
    workRadius: 40,
    services: ["Sistemas de Segurança", "Cabeamento Estruturado", "Instalações Especiais"],
    servicesPricing: ["1100", "1300", "1600"],
    isDemo: true
  },

  // PROGRAMADORES (5 opções)
  {
    id: 11,
    userId: 110,
    name: "Bruno Santos",
    title: "Programador Python",
    email: "bruno.santos@email.com",
    phone: "(11) 98888-1111",
    rating: 4.9,
    reviewCount: 78,
    skills: ["Python", "Django", "Flask", "Data Science"],
    hourlyRate: 1500,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
    orbitRing: 3,
    orbitPosition: 1,
    available: true,
    latitude: -23.5505,
    longitude: -46.6333,
    city: "São Paulo",
    state: "SP",
    workRadius: 100,
    services: ["Desenvolvimento Web", "API REST", "Análise de Dados"],
    servicesPricing: ["1500", "1800", "2000"],
    isDemo: true
  },
  {
    id: 12,
    userId: 111,
    name: "Mariana Lima",
    title: "Desenvolvedora Frontend",
    email: "mariana.lima@email.com",
    phone: "(11) 98888-2222",
    rating: 4.8,
    reviewCount: 92,
    skills: ["React", "TypeScript", "Next.js", "UI/UX"],
    hourlyRate: 1400,
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
    orbitRing: 3,
    orbitPosition: 2,
    available: true,
    latitude: -23.5605,
    longitude: -46.6433,
    city: "São Paulo",
    state: "SP",
    workRadius: 100,
    services: ["Desenvolvimento Frontend", "Interface de Usuário", "Otimização"],
    servicesPricing: ["1400", "1600", "1800"],
    isDemo: true
  },
  {
    id: 13,
    userId: 112,
    name: "Lucas Oliveira",
    title: "Desenvolvedor Full Stack",
    email: "lucas.oliveira@email.com",
    phone: "(11) 98888-3333",
    rating: 4.7,
    reviewCount: 156,
    skills: ["JavaScript", "Node.js", "React", "PostgreSQL"],
    hourlyRate: 1800,
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
    orbitRing: 3,
    orbitPosition: 3,
    available: true,
    latitude: -23.5405,
    longitude: -46.6233,
    city: "São Paulo",
    state: "SP",
    workRadius: 100,
    services: ["Desenvolvimento Full Stack", "Sistemas Web", "APIs"],
    servicesPricing: ["1800", "2200", "2500"],
    isDemo: true
  },
  {
    id: 14,
    userId: 113,
    name: "Camila Costa",
    title: "Desenvolvedora Mobile",
    email: "camila.costa@email.com",
    phone: "(11) 98888-4444",
    rating: 4.6,
    reviewCount: 67,
    skills: ["React Native", "Flutter", "iOS", "Android"],
    hourlyRate: 1600,
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
    orbitRing: 3,
    orbitPosition: 4,
    available: true,
    latitude: -23.5705,
    longitude: -46.6533,
    city: "São Paulo",
    state: "SP",
    workRadius: 100,
    services: ["Desenvolvimento Mobile", "Apps Nativos", "Manutenção"],
    servicesPricing: ["1600", "1900", "2100"],
    isDemo: true
  },
  {
    id: 15,
    userId: 114,
    name: "Diego Martins",
    title: "Desenvolvedor Backend",
    email: "diego.martins@email.com",
    phone: "(11) 98888-5555",
    rating: 4.8,
    reviewCount: 89,
    skills: ["Java", "Spring Boot", "Microservices", "AWS"],
    hourlyRate: 1700,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
    orbitRing: 3,
    orbitPosition: 5,
    available: true,
    latitude: -23.5305,
    longitude: -46.6133,
    city: "São Paulo",
    state: "SP",
    workRadius: 100,
    services: ["Desenvolvimento Backend", "Microservices", "Cloud"],
    servicesPricing: ["1700", "2000", "2300"],
    isDemo: true
  },

  // PINTORES (5 opções)
  {
    id: 16,
    userId: 115,
    name: "Antonio Ferreira",
    title: "Pintor Residencial",
    email: "antonio.ferreira@email.com",
    phone: "(11) 97777-1111",
    rating: 4.7,
    reviewCount: 234,
    skills: ["Pintura Residencial", "Texturas", "Acabamentos"],
    hourlyRate: 600,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
    orbitRing: 3,
    orbitPosition: 6,
    available: true,
    latitude: -23.5455,
    longitude: -46.6383,
    city: "São Paulo",
    state: "SP",
    workRadius: 25,
    services: ["Pintura Residencial", "Texturas", "Acabamentos"],
    servicesPricing: ["600", "800", "1000"],
    isDemo: true
  },
  {
    id: 17,
    userId: 116,
    name: "Roberto Alves",
    title: "Pintor Comercial",
    email: "roberto.alves@email.com",
    phone: "(11) 97777-2222",
    rating: 4.8,
    reviewCount: 189,
    skills: ["Pintura Comercial", "Sinalização", "Grafite"],
    hourlyRate: 700,
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
    orbitRing: 3,
    orbitPosition: 7,
    available: true,
    latitude: -23.5555,
    longitude: -46.6483,
    city: "São Paulo",
    state: "SP",
    workRadius: 35,
    services: ["Pintura Comercial", "Sinalização", "Grafite"],
    servicesPricing: ["700", "900", "1200"],
    isDemo: true
  },
  {
    id: 18,
    userId: 117,
    name: "Carlos Eduardo",
    title: "Pintor Especializado",
    email: "carlos.eduardo@email.com",
    phone: "(11) 97777-3333",
    rating: 4.9,
    reviewCount: 145,
    skills: ["Pintura Artística", "Decoração", "Técnicas Especiais"],
    hourlyRate: 900,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
    orbitRing: 3,
    orbitPosition: 8,
    available: true,
    latitude: -23.5355,
    longitude: -46.6283,
    city: "São Paulo",
    state: "SP",
    workRadius: 30,
    services: ["Pintura Artística", "Decoração", "Técnicas Especiais"],
    servicesPricing: ["900", "1100", "1400"],
    isDemo: true
  },
  {
    id: 19,
    userId: 118,
    name: "João Paulo",
    title: "Pintor Industrial",
    email: "joao.paulo@email.com",
    phone: "(11) 97777-4444",
    rating: 4.6,
    reviewCount: 167,
    skills: ["Pintura Industrial", "Impermeabilização", "Proteção"],
    hourlyRate: 800,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
    orbitRing: 3,
    orbitPosition: 9,
    available: true,
    latitude: -23.5655,
    longitude: -46.6583,
    city: "São Paulo",
    state: "SP",
    workRadius: 40,
    services: ["Pintura Industrial", "Impermeabilização", "Proteção"],
    servicesPricing: ["800", "1000", "1300"],
    isDemo: true
  },
  {
    id: 20,
    userId: 119,
    name: "Juliana Mendes",
    title: "Pintora Decorativa",
    email: "juliana.mendes@email.com",
    phone: "(11) 97777-5555",
    rating: 4.7,
    reviewCount: 98,
    skills: ["Pintura Decorativa", "Murais", "Decoração"],
    hourlyRate: 750,
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
    orbitRing: 3,
    orbitPosition: 10,
    available: true,
    latitude: -23.5255,
    longitude: -46.6183,
    city: "São Paulo",
    state: "SP",
    workRadius: 25,
    services: ["Pintura Decorativa", "Murais", "Decoração"],
    servicesPricing: ["750", "950", "1200"],
    isDemo: true
  }
];

export const TOKEN_PACKAGES = [
  {
    id: 1,
    name: "Pacote Básico",
    tokens: 1000,
    price: 10.00,
    bonus: 0,
    popular: false
  },
  {
    id: 2,
    name: "Pacote Popular",
    tokens: 2500,
    price: 20.00,
    bonus: 250,
    popular: true
  },
  {
    id: 3,
    name: "Pacote Pro",
    tokens: 5000,
    price: 35.00,
    bonus: 750,
    popular: false
  },
  {
    id: 4,
    name: "Pacote Max",
    tokens: 10000,
    price: 60.00,
    bonus: 2000,
    popular: false
  }
];

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const formatTokens = (tokens: number): string => {
  return `${tokens.toLocaleString('pt-BR')} tokens`;
};

// Função para calcular total de tokens de um usuário
export const getTotalTokens = (user: any): number => {
  if (!user) return 0;
  return (
    (user.tokens || 0) +
    (user.tokensPlano || 0) +
    (user.tokensGanhos || 0) +
    (user.tokensComprados || 0) -
    (user.tokensUsados || 0)
  );
}; 