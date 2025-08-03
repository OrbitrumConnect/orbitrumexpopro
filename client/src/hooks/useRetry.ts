import { useState, useCallback } from 'react';

interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  onError?: (error: Error, attempt: number) => void;
}

export function useRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
) {
  const { maxAttempts = 3, delay = 1000, onError } = options;
  const [isRetrying, setIsRetrying] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);

  const executeWithRetry = useCallback(async (): Promise<T> => {
    setIsRetrying(true);
    setAttemptCount(0);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        setAttemptCount(attempt);
        const result = await operation();
        setIsRetrying(false);
        setAttemptCount(0);
        return result;
      } catch (error) {
        console.warn(`🔄 Tentativa ${attempt}/${maxAttempts} falhou:`, error);
        
        if (onError) {
          onError(error as Error, attempt);
        }

        if (attempt === maxAttempts) {
          setIsRetrying(false);
          setAttemptCount(0);
          throw error;
        }

        // Delay exponencial: 1s, 2s, 4s...
        const waitTime = delay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    throw new Error('Retry failed');
  }, [operation, maxAttempts, delay, onError]);

  return {
    execute: executeWithRetry,
    isRetrying,
    attemptCount,
    maxAttempts
  };
}