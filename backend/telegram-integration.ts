// telegram-integration.ts - Integração do Bot Telegram com Orbitrum Connect
// Gerencia a execução do bot Python em thread separada

import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';

let telegramProcess: ChildProcess | null = null;
let isStarting = false;

export function startTelegramBot(): void {
  // Evitar múltiplas inicializações
  if (isStarting || telegramProcess) {
    return;
  }

  isStarting = true;

  try {
    // Caminho para o bot Python
    const botPath = path.join(process.cwd(), 'telegram-bot', 'main.py');
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(botPath)) {
      console.error('❌ [TELEGRAM] Arquivo do bot não encontrado:', botPath);
      isStarting = false;
      return;
    }

    // Spawnar processo Python com configuração correta
    telegramProcess = spawn('/home/runner/workspace/.pythonlibs/bin/python3', [botPath], {
      cwd: path.join(process.cwd(), 'telegram-bot'),
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        PYTHONPATH: path.join(process.cwd(), 'telegram-bot'),
        PATH: `/home/runner/workspace/.pythonlibs/bin:${process.env.PATH}`
      }
    });

    // Capturar saída do processo
    telegramProcess.stdout?.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        // Bot output received
      }
    });

    telegramProcess.stderr?.on('data', (data) => {
      const error = data.toString().trim();
      if (error && !error.includes('WARNING')) {
        console.error(`⚠️ [TELEGRAM] ${error}`);
      }
    });

    // Lidar com encerramento do processo
    telegramProcess.on('close', (code) => {
      telegramProcess = null;
      isStarting = false;
      
      // Reiniciar automaticamente se não foi encerramento intencional
      if (code !== 0 && code !== null) {
        setTimeout(() => {
          startTelegramBot();
        }, 10000);
      }
    });

    telegramProcess.on('error', (error) => {
      console.error('❌ [TELEGRAM] Erro ao iniciar bot:', error.message);
      telegramProcess = null;
      isStarting = false;
    });

    isStarting = false;

  } catch (error) {
    console.error('❌ [TELEGRAM] Erro na inicialização:', error);
    telegramProcess = null;
    isStarting = false;
  }
}

export function stopTelegramBot(): void {
  if (telegramProcess) {
    telegramProcess.kill('SIGTERM');
    telegramProcess = null;
  }
}

export function getTelegramBotStatus(): { running: boolean; pid?: number } {
  return {
    running: telegramProcess !== null,
    pid: telegramProcess?.pid
  };
}

// Encerrar bot ao encerrar processo principal
process.on('SIGINT', stopTelegramBot);
process.on('SIGTERM', stopTelegramBot);
process.on('exit', stopTelegramBot);