// telegram-status.ts - Monitoramento do status do Bot Telegram
// Endpoint para verificar se o bot está funcionando

import { Express } from "express";
import { getTelegramBotStatus } from "./telegram-integration";

export function setupTelegramStatusRoutes(app: Express) {
  // Endpoint de status do bot
  app.get('/api/telegram/bot-status', (req, res) => {
    const status = getTelegramBotStatus();
    
    res.json({
      telegram_bot: {
        running: status.running,
        pid: status.pid,
        integration: 'active',
        api_routes: 'registered',
        last_check: new Date().toISOString()
      },
      apis: {
        '/api/telegram/health': 'available',
        '/api/telegram/auth': 'available',
        '/api/telegram/balance/:id': 'available',
        '/api/telegram/status/:id': 'available',
        '/api/telegram/notify': 'available',
        '/api/telegram/stats': 'available'
      },
      phase: 'Phase 1 - Basic Bot Implementation',
      features: [
        '✅ Commands: /start, /ajuda, /login, /saldo, /status',
        '✅ API Integration prepared',
        '✅ Mock data for testing',
        '⏳ Real user authentication (Phase 2)',
        '⏳ Push notifications (Phase 2)'
      ]
    });
  });

  console.log('📊 Telegram status routes configured');
}