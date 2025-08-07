// Gerador PIX Simplificado - Garantido para conta 03669282106 (PEDRO GALLUF - Nubank)
import * as QRCode from 'qrcode';

export interface SimplePixData {
  pixKey: string;
  amount: number;
  description: string;
  transactionId: string;
  qrCode: string;
  qrCodeBase64: string;
  pixPayload: string;
}

export class SimplePixGenerator {
  
  // Gerar PIX direto para conta Nubank 03669282106
  static async generateDirectPix(
    amount: number,
    description: string,
    transactionId: string
  ): Promise<SimplePixData> {
    console.log('🏦 Gerando PIX direto para PEDRO GALLUF - Nubank');
    
    // Dados fixos para sua conta
    const PIX_KEY = '03669282106'; // Sua chave PIX CPF
    const MERCHANT_NAME = 'PEDRO GALLUF';
    const MERCHANT_CITY = 'RIO DE JANEIRO';
    
    // Gerar payload PIX manualmente (formato BR Code)
    const pixData = {
      '00': '01', // Payload Format Indicator
      '01': '12', // Point of Initiation Method (12 = static)
      '26': `0014BR.GOV.BCB.PIX01${PIX_KEY.length.toString().padStart(2, '0')}${PIX_KEY}`, // Merchant Account Info
      '52': '0000', // Merchant Category Code
      '53': '986', // Transaction Currency (986 = BRL)
      '54': amount.toFixed(2), // Transaction Amount
      '58': 'BR', // Country Code
      '59': MERCHANT_NAME.padEnd(25).substring(0, 25), // Merchant Name
      '60': MERCHANT_CITY.padEnd(15).substring(0, 15), // Merchant City
      '62': `0503***05${transactionId.slice(-6)}`, // Additional Data
    };
    
    // Montar payload
    let payload = '';
    for (const [id, value] of Object.entries(pixData)) {
      payload += id + value.length.toString().padStart(2, '0') + value;
    }
    
    // Calcular CRC16 (obrigatório para PIX)
    const crc = this.calculateCRC16(payload + '6304');
    payload += '63' + '04' + crc;
    
    console.log('✅ PIX Payload gerado:', payload.length, 'caracteres');
    console.log('💰 Valor: R$', amount.toFixed(2));
    console.log('🏦 Destino: 03669282106 (PEDRO GALLUF - Nubank)');
    
    // Gerar QR Code
    const qrCodeBase64 = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'L',
      type: 'image/png',
      width: 256,
      margin: 1
    });
    
    return {
      pixKey: PIX_KEY,
      amount,
      description,
      transactionId,
      qrCode: payload,
      qrCodeBase64,
      pixPayload: payload
    };
  }
  
  // Calcular CRC16 para PIX (algoritmo oficial do Banco Central)
  private static calculateCRC16(payload: string): string {
    const polynomial = 0x1021;
    let crc = 0xFFFF;
    
    for (let i = 0; i < payload.length; i++) {
      crc ^= (payload.charCodeAt(i) << 8);
      for (let j = 0; j < 8; j++) {
        if (crc & 0x8000) {
          crc = (crc << 1) ^ polynomial;
        } else {
          crc <<= 1;
        }
        crc &= 0xFFFF;
      }
    }
    
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }
}