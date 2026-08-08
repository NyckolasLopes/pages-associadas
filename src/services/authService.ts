/**
 * Auth Service (Abstraction Layer)
 * 
 * According to Zero Trust rules:
 * - User authentication must occur in the backend.
 * - This service acts as the boundary.
 * - When the backend is active, this will use Supabase Auth and HttpOnly cookies.
 */
import { secureSession } from "@/lib/secureStorage";
import { logger } from "@/lib/logger";

export const authService = {
  /**
   * Retrieves the current user session.
   * In a real backend, this would validate an HttpOnly cookie via an API endpoint.
   */
  getSession() {
    try {
      const session = secureSession.get('auth_session');
      if (session && session.expiresAt > Date.now()) {
        return session.user;
      }
      return null;
    } catch (e) {
      logger.error("Failed to get session", e);
      return null;
    }
  },

  /**
   * Logs in a user.
   * In a real backend, this would send credentials to the server and receive an HttpOnly cookie.
   */
  async login(email: string, pass: string) {
    logger.info(`Attempting login for ${email}`);
    // Simulate backend call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Mock validation
        if (email && pass) {
          const user = { name: email.split("@")[0], email, provider: "email" };
          // Simulate backend returning a token/session with expiration
          secureSession.set('auth_session', {
            user,
            expiresAt: Date.now() + 1000 * 60 * 60 * 24 // 24 hours
          });
          resolve(user);
        } else {
          reject(new Error("Invalid credentials"));
        }
      }, 500);
    });
  },

  /**
   * Logs out a user.
   * In a real backend, this MUST invalidate the refresh token on the server.
   */
  async logout() {
    logger.info("User logged out");
    // Simulate backend token invalidation
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        secureSession.remove('auth_session');
        resolve();
      }, 300);
    });
  }
};
