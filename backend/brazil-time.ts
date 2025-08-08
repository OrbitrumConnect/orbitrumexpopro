import moment from 'moment-timezone';

/**
 * Utilitário para gerenciar horário de Brasília (GMT-3)
 */
export class BrazilTime {
  private static readonly TIMEZONE = 'America/Sao_Paulo';

  /**
   * Obtém o momento atual no horário de Brasília
   */
  static now(): moment.Moment {
    return moment().tz(this.TIMEZONE);
  }

  /**
   * Formata a data atual de Brasília
   */
  static formatNow(format: string = 'DD/MM/YYYY HH:mm:ss'): string {
    return this.now().format(format);
  }

  /**
   * Obtém a data atual de Brasília como Date
   */
  static nowAsDate(): Date {
    return this.now().toDate();
  }

  /**
   * Verifica se hoje é dia de saque (dia 3)
   */
  static isWithdrawalDay(): boolean {
    return this.now().date() === 3;
  }

  /**
   * Obtém o próximo dia de saque
   */
  static getNextWithdrawalDate(): moment.Moment {
    const now = this.now();
    const nextMonth = now.clone().add(1, 'month').date(3).startOf('day');
    
    // Se ainda não passou do dia 3 deste mês
    if (now.date() < 3) {
      return now.clone().date(3).startOf('day');
    }
    
    return nextMonth;
  }

  /**
   * Formata uma data no horário de Brasília
   */
  static format(date: Date | moment.Moment, format: string = 'DD/MM/YYYY HH:mm:ss'): string {
    if (date instanceof Date) {
      return moment(date).tz(this.TIMEZONE).format(format);
    }
    return date.tz(this.TIMEZONE).format(format);
  }
}