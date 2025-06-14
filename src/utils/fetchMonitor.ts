
interface FetchMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  url: string;
  method: string;
  error?: string;
  aborted?: boolean;
}

class FetchMonitor {
  private metrics: Map<string, FetchMetrics> = new Map();
  private timeoutWarnings: Map<string, NodeJS.Timeout> = new Map();

  startFetch(fetchId: string, url: string, method: string = 'GET'): void {
    const startTime = Date.now();
    this.metrics.set(fetchId, {
      startTime,
      success: false,
      url,
      method
    });

    // Aviso de timeout em 10s
    const timeoutWarning = setTimeout(() => {
      console.warn(`[FetchMonitor] ⏰ Fetch ${fetchId} está demorando mais que 10s`, {
        url,
        duration: Date.now() - startTime
      });
    }, 10000);

    this.timeoutWarnings.set(fetchId, timeoutWarning);

    console.log(`[FetchMonitor] 🚀 Fetch iniciado: ${fetchId} para ${url}`);
  }

  endFetch(fetchId: string, success: boolean, error?: string, aborted?: boolean): void {
    const metric = this.metrics.get(fetchId);
    if (!metric) {
      console.warn(`[FetchMonitor] ⚠️ Métrica não encontrada para fetch: ${fetchId}`);
      return;
    }

    const endTime = Date.now();
    const duration = endTime - metric.startTime;

    // Atualizar métrica
    metric.endTime = endTime;
    metric.duration = duration;
    metric.success = success;
    metric.error = error;
    metric.aborted = aborted;

    // Limpar timeout warning
    const timeoutWarning = this.timeoutWarnings.get(fetchId);
    if (timeoutWarning) {
      clearTimeout(timeoutWarning);
      this.timeoutWarnings.delete(fetchId);
    }

    // Log final
    const status = aborted ? '🛑 ABORTED' : success ? '✅ SUCCESS' : '❌ ERROR';
    console.log(`[FetchMonitor] ${status} Fetch ${fetchId} finalizado em ${duration}ms`, {
      url: metric.url,
      duration,
      success,
      error,
      aborted
    });

    // Aviso para requests muito lentos
    if (duration > 5000 && !aborted) {
      console.warn(`[FetchMonitor] 🐌 Fetch lento detectado: ${fetchId}`, {
        url: metric.url,
        duration
      });
    }

    // Limpar métrica antiga (manter apenas últimas 50)
    if (this.metrics.size > 50) {
      const oldestKey = this.metrics.keys().next().value;
      this.metrics.delete(oldestKey);
    }
  }

  getMetrics(): FetchMetrics[] {
    return Array.from(this.metrics.values());
  }

  getSlowFetches(threshold: number = 3000): FetchMetrics[] {
    return this.getMetrics().filter(m => m.duration && m.duration > threshold);
  }

  getFailedFetches(): FetchMetrics[] {
    return this.getMetrics().filter(m => !m.success && !m.aborted);
  }
}

export const fetchMonitor = new FetchMonitor();
