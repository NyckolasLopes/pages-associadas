/**
 * Gerenciador de Bloqueio Progressivo de Login (Segurança contra Ataques de Força Bruta)
 * 
 * Regra de progressão por rodadas de 3 tentativas:
 * - 1ª rodada (3 erros): 30 segundos
 * - 2ª rodada (mais 3 erros): 1 minuto (60 segundos)
 * - 3ª rodada (mais 3 erros): 5 minutos (300 segundos)
 * - 4ª rodada em diante (mais 3 erros): 1 hora (3600 segundos)
 */

const STORAGE_LOCK_KEY = "fa_login_lock";
const STORAGE_ATTEMPTS_KEY = "fa_login_attempts";
const STORAGE_ROUND_KEY = "fa_login_round";
const STORAGE_LAST_TIME_KEY = "fa_login_last_attempt_time";

export interface LoginLockStatus {
  isLocked: boolean;
  lockedUntil: number;
  timeLeftSeconds: number;
  attemptsInRound: number;
  currentRound: number;
}

/**
 * Retorna a duração em segundos de bloqueio conforme a rodada atual
 */
export function getLockDurationSeconds(round: number): number {
  if (round <= 1) return 30;     // 30 segundos na 1ª tentativa de 3 vezes
  if (round === 2) return 60;    // 1 minuto na 2ª tentativa de 3 vezes
  if (round === 3) return 300;   // 5 minutos na 3ª tentativa de 3 vezes
  return 3600;                   // 1 hora na 4ª tentativa de 3 vezes em diante
}

/**
 * Formata os segundos restantes de forma amigável (ex: "30s", "1m 15s", "1h 5m")
 */
export function formatTimeLeft(seconds: number): string {
  if (seconds <= 0) return "0s";
  if (seconds >= 3600) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  if (seconds >= 60) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }
  return `${seconds}s`;
}

/**
 * Obtém o status atual do bloqueio
 */
export function getLoginLockStatus(): LoginLockStatus {
  if (typeof window === "undefined") {
    return { isLocked: false, lockedUntil: 0, timeLeftSeconds: 0, attemptsInRound: 0, currentRound: 1 };
  }

  const lockStr = localStorage.getItem(STORAGE_LOCK_KEY);
  const lockTime = lockStr ? parseInt(lockStr, 10) : 0;
  const now = Date.now();

  const roundStr = localStorage.getItem(STORAGE_ROUND_KEY);
  const currentRound = Math.max(1, roundStr ? parseInt(roundStr, 10) : 1);

  const attemptsStr = localStorage.getItem(STORAGE_ATTEMPTS_KEY);
  const attemptsInRound = Math.max(0, attemptsStr ? parseInt(attemptsStr, 10) : 0);

  if (lockTime > now) {
    const timeLeft = Math.ceil((lockTime - now) / 1000);
    return {
      isLocked: true,
      lockedUntil: lockTime,
      timeLeftSeconds: timeLeft,
      attemptsInRound,
      currentRound,
    };
  }

  // Se o bloqueio acabou, remove o item de lock expirado
  if (lockTime > 0) {
    localStorage.removeItem(STORAGE_LOCK_KEY);
  }

  return {
    isLocked: false,
    lockedUntil: 0,
    timeLeftSeconds: 0,
    attemptsInRound,
    currentRound,
  };
}

/**
 * Registra uma tentativa falha de senha e aplica a regra de bloqueio progressivo
 */
export function recordFailedLoginAttempt(): {
  isLocked: boolean;
  durationSeconds: number;
  attemptsInRound: number;
  currentRound: number;
  formattedDuration: string;
} {
  if (typeof window === "undefined") {
    return { isLocked: false, durationSeconds: 0, attemptsInRound: 1, currentRound: 1, formattedDuration: "" };
  }

  const now = Date.now();
  const lastTimeStr = localStorage.getItem(STORAGE_LAST_TIME_KEY);
  const lastTime = lastTimeStr ? parseInt(lastTimeStr, 10) : 0;

  let currentRound = parseInt(localStorage.getItem(STORAGE_ROUND_KEY) || "1", 10) || 1;
  let attempts = parseInt(localStorage.getItem(STORAGE_ATTEMPTS_KEY) || "0", 10) || 0;

  // Se a última tentativa foi há mais de 24 horas, reseta o ciclo para o início
  if (lastTime > 0 && now - lastTime > 24 * 60 * 60 * 1000) {
    currentRound = 1;
    attempts = 0;
  }

  localStorage.setItem(STORAGE_LAST_TIME_KEY, now.toString());

  attempts += 1;

  if (attempts >= 3) {
    // Atingiu 3 erros na rodada atual: aciona o timer correspondente
    const duration = getLockDurationSeconds(currentRound);
    const lockTime = now + duration * 1000;

    localStorage.setItem(STORAGE_LOCK_KEY, lockTime.toString());
    // Prepara para a próxima rodada caso volte a errar após o término deste timer
    localStorage.setItem(STORAGE_ROUND_KEY, (currentRound + 1).toString());
    localStorage.setItem(STORAGE_ATTEMPTS_KEY, "0");

    return {
      isLocked: true,
      durationSeconds: duration,
      attemptsInRound: 3,
      currentRound,
      formattedDuration: formatTimeLeft(duration),
    };
  }

  // Ainda dentro das 3 chances da rodada atual
  localStorage.setItem(STORAGE_ATTEMPTS_KEY, attempts.toString());
  localStorage.setItem(STORAGE_ROUND_KEY, currentRound.toString());

  return {
    isLocked: false,
    durationSeconds: 0,
    attemptsInRound: attempts,
    currentRound,
    formattedDuration: "",
  };
}

/**
 * Reseta todo o estado de segurança após login bem-sucedido
 */
export function resetLoginSecurity(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_LOCK_KEY);
  localStorage.removeItem(STORAGE_ATTEMPTS_KEY);
  localStorage.removeItem(STORAGE_ROUND_KEY);
  localStorage.removeItem(STORAGE_LAST_TIME_KEY);
}
