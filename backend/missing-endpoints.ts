// =================== ENDPOINTS MISSING (RESOLVING 404s) ===================
// Endpoints para resolver os 404s que aparecem nos logs

import { Express } from 'express';

export function setupMissingEndpoints(app: Express) {
  // Service Requests endpoints
  app.get("/api/service-requests/client/:clientId", async (req, res) => {
    res.json([]);
  });

  app.get("/api/service-requests/professional/:professionalId/pending", async (req, res) => {
    res.json([]);
  });

  app.get("/api/service-requests/professional/:professionalId/accepted", async (req, res) => {
    res.json([]);
  });

  // Professional Stats endpoint
  app.get("/api/professional-stats/:professionalId", async (req, res) => {
    res.json({
      totalEarnings: 0,
      completedJobs: 0,
      averageRating: 0,
      totalReviews: 0,
      responseTime: 0,
      weeklyEarnings: 0,
      monthlyEarnings: 0
    });
  });

  // Analytics behavior advanced endpoint
  app.post("/api/analytics/behavior-advanced", async (req, res) => {
    const { event, category, properties } = req.body;
    console.log(`📊 Analytics: ${event} - ${category}`, properties);
    res.json({ success: true, tracked: true });
  });

  // Services tracking endpoints
  app.get("/api/services/tracking/client/:clientId", async (req, res) => {
    res.json([]);
  });

  app.get("/api/services/history/client/:clientId", async (req, res) => {
    res.json([]);
  });

  console.log('✅ Missing endpoints configurados com sucesso');
}