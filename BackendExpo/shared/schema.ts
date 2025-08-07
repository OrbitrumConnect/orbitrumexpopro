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
