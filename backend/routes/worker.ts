import { Router, Request, Response } from 'express';
import { runWorker, estatisticasRede } from '../worker';

const router = Router();

// Auth: em produção, Vercel Cron envia CRON_SECRET no header.
// Em dev, aceita qualquer request.
function authCron(req: Request, res: Response): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  if (req.headers.authorization !== `Bearer ${secret}`) {
    res.status(401).json({ success: false, error: 'Não autorizado' });
    return false;
  }
  return true;
}

// POST /api/worker/run — executa todos os jobs do Worker.
// Vercel Cron chama este endpoint a cada hora (ou conforme vercel.json).
router.post('/run', async (req: Request, res: Response) => {
  if (!authCron(req, res)) return;

  try {
    const results = await runWorker();
    res.json({ success: true, resultados: results });
  } catch (error) {
    console.error('Worker run error:', error);
    res.status(500).json({ success: false, error: 'Falha no worker' });
  }
});

// GET /api/worker/stats — estatísticas da rede (read-only, não altera nada).
router.get('/stats', async (req: Request, res: Response) => {
  if (!authCron(req, res)) return;

  try {
    const { stats } = await estatisticasRede();
    res.json({ success: true, ...stats });
  } catch (error) {
    console.error('Worker stats error:', error);
    res.status(500).json({ success: false, error: 'Falha nas estatísticas' });
  }
});

export default router;
