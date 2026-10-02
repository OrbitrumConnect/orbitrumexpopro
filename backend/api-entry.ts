// ENTRY SERVERLESS DA VERCEL — expõe o app Express (o "motor") como function.
// Importa o app já com as rotas registradas; na Vercel o index.ts NÃO dá listen nem sobe
// processos vivos (guardado por process.env.VERCEL). `ready` resolve quando as rotas registram.
import { app, ready } from '../backend/index';

export default async function handler(req: any, res: any) {
  await ready;
  return (app as any)(req, res);
}
