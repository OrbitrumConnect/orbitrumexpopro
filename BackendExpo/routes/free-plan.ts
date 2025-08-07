import { Router, Request, Response } from "express";
import { storage } from "../storage";

// Interface personalizada para requisições autenticadas
interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    username: string;
  };
}

// Middleware simples de autenticação
const requireAuth = (req: AuthRequest, res: Response, next: any) => {
  // Para demonstração, vamos usar um usuário padrão se não autenticado
  if (!req.user) {
    // Simulando usuário autenticado para desenvolvimento
    req.user = { id: 1, email: "test@email.com", username: "test" };
  }
  next();
};

const router = Router();

// Interface para os limites do Free Orbitrum
interface FreePlanLimits {
  monthlyAiSearches: number;
  planetViewsEvery3Days: number;
  dailyProfileViews: number;
  monthlyMessages: number;
  lastMonthlyReset: string;
  lastDailyReset: string;
  lastPlanetViewReset: string;
}

// Obter limitações atuais do usuário Free Orbitrum
router.get("/limits", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, error: "Usuário não encontrado" });
    }

    // Se não é plano Free Orbitrum, retorna limites ilimitados
    if (user.plan !== "freeOrbitrum") {
      return res.json({
        success: true,
        isFreePlan: false,
        unlimited: true
      });
    }

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const currentDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    // Verificar se precisa resetar os limites mensais
    let needsMonthlyReset = !user.freePlanMonthlyReset || user.freePlanMonthlyReset !== currentMonth;
    let needsDailyReset = !user.freePlanLastDailyReset || user.freePlanLastDailyReset !== currentDate;
    let needsPlanetReset = !user.freePlanLastPlanetReset || user.freePlanLastPlanetReset <= threeDaysAgo;

    let updatedUser = user;

    if (needsMonthlyReset || needsDailyReset || needsPlanetReset) {
      const updates: any = {};
      
      if (needsMonthlyReset) {
        updates.freePlanMonthlyReset = currentMonth;
        updates.freePlanAiSearches = 10;
        updates.freePlanMessages = 2;
      }
      
      if (needsDailyReset) {
        updates.freePlanLastDailyReset = currentDate;
        updates.freePlanProfileViews = 1;
      }

      if (needsPlanetReset) {
        updates.freePlanLastPlanetReset = currentDate;
        updates.freePlanPlanetViews = 2;
      }

      updatedUser = await storage.updateUser(userId, updates);
      if (!updatedUser) {
        return res.status(500).json({ success: false, error: "Erro ao atualizar limites" });
      }
    }

    const limits: FreePlanLimits = {
      monthlyAiSearches: updatedUser.freePlanAiSearches || 10,
      planetViewsEvery3Days: updatedUser.freePlanPlanetViews || 2,
      dailyProfileViews: updatedUser.freePlanProfileViews || 1,
      monthlyMessages: updatedUser.freePlanMessages || 2,
      lastMonthlyReset: updatedUser.freePlanMonthlyReset || currentMonth,
      lastDailyReset: updatedUser.freePlanLastDailyReset || currentDate,
      lastPlanetViewReset: updatedUser.freePlanLastPlanetReset || currentDate
    };

    res.json({
      success: true,
      isFreePlan: true,
      limits,
      planName: "Free Orbitrum"
    });

  } catch (error) {
    console.error("Erro ao obter limites Free Plan:", error);
    res.status(500).json({ success: false, error: "Erro interno do servidor" });
  }
});

// Consumir uma busca de IA
router.post("/consume/ai-search", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = await storage.getUser(userId);
    
    if (!user || user.plan !== "freeOrbitrum") {
      return res.json({ success: true, consumed: false, reason: "not_free_plan" });
    }

    if ((user.freePlanAiSearches || 30) <= 0) {
      return res.json({ 
        success: false, 
        consumed: false, 
        reason: "limit_exceeded",
        message: "✋ Você atingiu o limite de buscas IA do plano Free Orbitrum este mês!"
      });
    }

    const updatedUser = await storage.updateUser(userId, {
      freePlanAiSearches: (user.freePlanAiSearches || 30) - 1
    });

    res.json({
      success: true,
      consumed: true,
      remaining: updatedUser?.freePlanAiSearches || 0
    });

  } catch (error) {
    console.error("Erro ao consumir busca IA:", error);
    res.status(500).json({ success: false, error: "Erro interno do servidor" });
  }
});

// Consumir uma visualização de planeta
router.post("/consume/planet-view", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = await storage.getUser(userId);
    
    if (!user || user.plan !== "freeOrbitrum") {
      return res.json({ success: true, consumed: false, reason: "not_free_plan" });
    }

    if ((user.freePlanPlanetViews || 3) <= 0) {
      return res.json({ 
        success: false, 
        consumed: false, 
        reason: "limit_exceeded",
        message: "✋ Você atingiu o limite de 3 visualizações de planeta a cada 3 dias do plano Free Orbitrum!"
      });
    }

    const updatedUser = await storage.updateUser(userId, {
      freePlanPlanetViews: (user.freePlanPlanetViews || 3) - 1
    });

    res.json({
      success: true,
      consumed: true,
      remaining: updatedUser?.freePlanPlanetViews || 0
    });

  } catch (error) {
    console.error("Erro ao consumir visualização planeta:", error);
    res.status(500).json({ success: false, error: "Erro interno do servidor" });
  }
});

// Consumir uma visualização de perfil
router.post("/consume/profile-view", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = await storage.getUser(userId);
    
    if (!user || user.plan !== "freeOrbitrum") {
      return res.json({ success: true, consumed: false, reason: "not_free_plan" });
    }

    if ((user.freePlanProfileViews || 1) <= 0) {
      return res.json({ 
        success: false, 
        consumed: false, 
        reason: "limit_exceeded",
        message: "✋ Você atingiu o limite de visualizações de perfil do plano Free Orbitrum hoje!"
      });
    }

    const updatedUser = await storage.updateUser(userId, {
      freePlanProfileViews: (user.freePlanProfileViews || 1) - 1
    });

    res.json({
      success: true,
      consumed: true,
      remaining: updatedUser?.freePlanProfileViews || 0
    });

  } catch (error) {
    console.error("Erro ao consumir visualização perfil:", error);
    res.status(500).json({ success: false, error: "Erro interno do servidor" });
  }
});

// Consumir uma mensagem recebida
router.post("/consume/message", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = await storage.getUser(userId);
    
    if (!user || user.plan !== "freeOrbitrum") {
      return res.json({ success: true, consumed: false, reason: "not_free_plan" });
    }

    if ((user.freePlanMessages || 2) <= 0) {
      return res.json({ 
        success: false, 
        consumed: false, 
        reason: "limit_exceeded",
        message: "✋ Você atingiu o limite de mensagens do plano Free Orbitrum este mês!"
      });
    }

    const updatedUser = await storage.updateUser(userId, {
      freePlanMessages: (user.freePlanMessages || 2) - 1
    });

    res.json({
      success: true,
      consumed: true,
      remaining: updatedUser?.freePlanMessages || 0
    });

  } catch (error) {
    console.error("Erro ao consumir mensagem:", error);
    res.status(500).json({ success: false, error: "Erro interno do servidor" });
  }
});

export { router as freePlanRouter };