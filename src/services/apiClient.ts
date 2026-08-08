/**
 * API Client (Abstraction Layer)
 * 
 * According to Zero Trust rules:
 * - The frontend MUST NOT access database or stores directly for secure data.
 * - This service acts as the boundary.
 * - When the backend is active, this will map to Supabase Edge Functions or a Node.js API.
 * - Currently, it simulates network requests and rate limiting.
 */
import { toast } from "sonner";
import { logger } from "@/lib/logger";

const MOCK_LATENCY = 300;

// Simple Rate Limiter simulation for the frontend API layer
const requestCounts = new Map<string, { count: number, resetTime: number }>();

function checkRateLimit(endpoint: string): boolean {
  const limit = 20; // max requests
  const windowMs = 60000; // 1 minute
  const now = Date.now();
  
  const record = requestCounts.get(endpoint);
  if (!record || now > record.resetTime) {
    requestCounts.set(endpoint, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= limit) {
    logger.warn(`Rate limit exceeded for endpoint: ${endpoint}`);
    return false;
  }
  
  record.count += 1;
  return true;
}

export const apiClient = {
  async get<T>(endpoint: string, mockData: T): Promise<T> {
    if (!checkRateLimit(endpoint)) {
      throw new Error("Too many requests. Please try again later.");
    }

    logger.info(`GET ${endpoint}`);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockData);
      }, MOCK_LATENCY);
    });
  },

  async post<T>(endpoint: string, payload: any, mockResponse: T): Promise<T> {
    if (!checkRateLimit(endpoint)) {
      throw new Error("Too many requests. Please try again later.");
    }

    logger.info(`POST ${endpoint}`, { payload: "[REDACTED]" }); // Never log full payload containing PII
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockResponse);
      }, MOCK_LATENCY);
    });
  }
};
