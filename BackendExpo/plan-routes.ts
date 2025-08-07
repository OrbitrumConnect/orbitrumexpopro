import type { Express } from "express";
import { planExpirySystem } from "./plan-expiry-system";
import { storage } from "./storage";

export function registerPlanRoutes(app: Express) {
  // Verificar se usuário pode comprar novo plano
  app.get("/api/plans/can-purchase", async (req: any, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: "Usuário não autenticado" });
      }

      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ success: false, message: "Usuário não encontrado" });
      }

      const canPurchase = planExpirySystem.canPurchaseNewPlan(user);

      res.json({
        success: true,
        canPurchase: canPurchase.canPurchase,
        reason: canPurchase.reason,
        daysRemaining: canPurchase.daysRemaining,
        currentPlan: user.plan,
        planExpiryDate: user.planExpiryDate
      });
    } catch (error) {
      console.error("❌ Erro ao verificar se pode comprar plano:", error);
      res.status(500).json({ success: false, message: "Erro interno do servidor" });
    }
  });

  // Ativar novo plano
  app.post("/api/plans/activate", async (req: any, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: "Usuário não autenticado" });
      }

      const { planId } = req.body;
      const userId = req.user.id;

      if (!planId) {
        return res.status(400).json({ success: false, message: "ID do plano é obrigatório" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: "Usuário não encontrado" });
      }

      // Verificar se pode ativar novo plano
      const canPurchase = planExpirySystem.canPurchaseNewPlan(user);
      if (!canPurchase.canPurchase) {
        return res.status(400).json({
          success: false,
          message: canPurchase.reason,
          daysRemaining: canPurchase.daysRemaining
        });
      }

      // Ativar o plano
      const planInfo = await planExpirySystem.activatePlan(userId, planId);

      res.json({
        success: true,
        message: `Plano ${planId} ativado com sucesso`,
        planInfo
      });
    } catch (error) {
      console.error("❌ Erro ao ativar plano:", error);
      res.status(500).json({ success: false, message: "Erro interno do servidor" });
    }
  });

  // Buscar notificações do usuário
  app.get("/api/notifications", async (req: any, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: "Usuário não autenticado" });
      }

      const userId = req.user.id;
      const notifications = await storage.getUserNotifications(userId);

      res.json({
        success: true,
        notifications
      });
    } catch (error) {
      console.error("❌ Erro ao buscar notificações:", error);
      res.status(500).json({ success: false, message: "Erro interno do servidor" });
    }
  });

  // Marcar notificação como lida
  app.post("/api/notifications/:id/read", async (req: any, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: "Usuário não autenticado" });
      }

      const notificationId = parseInt(req.params.id);
      await storage.markNotificationAsRead(notificationId);

      res.json({
        success: true,
        message: "Notificação marcada como lida"
      });
    } catch (error) {
      console.error("❌ Erro ao marcar notificação como lida:", error);
      res.status(500).json({ success: false, message: "Erro interno do servidor" });
    }
  });
}