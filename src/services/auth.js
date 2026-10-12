/**
 * Authentication & Role-Based Access Control (RBAC) Service
 * Manages separate Client (Researcher) and Developer (Admin) sessions.
 */

const AUTH_KEY = 'epoche_auth_session_v1';

export class AuthService {
  /**
   * Get current authenticated user session
   * @returns {Object|null}
   */
  static getSession() {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.warn("Auth read error", e);
      return null;
    }
  }

  /**
   * Login as Client / Researcher
   */
  static loginClient({ name = "Researcher", email = "researcher@amrita.edu", institution = "Amrita Vishwa Vidyapeetham", domain = "Renewable Energy & Embedded Systems" } = {}) {
    const session = {
      id: `usr-client-${Date.now()}`,
      role: 'client',
      name: name.trim() || "Academic Researcher",
      email: email.trim() || "researcher@amrita.edu",
      institution: institution.trim() || "Research Institute",
      domain: domain.trim() || "Interdisciplinary Research",
      loginTime: new Date().toISOString(),
      permissions: ['read_own', 'write_own', 'export_vault', 'dissect_rebuttal']
    };
    localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    return session;
  }

  /**
   * Login as Developer / System Administrator
   */
  static loginDeveloper({ devKey = "dev123", name = "System Developer" } = {}) {
    const session = {
      id: `usr-dev-${Date.now()}`,
      role: 'developer',
      name: name.trim() || "System Developer",
      email: "developer@epoche.internal",
      institution: "Epoché Core Engineering",
      domain: "Platform Architecture & System Diagnostics",
      loginTime: new Date().toISOString(),
      permissions: ['read_all', 'write_all', 'system_diagnostics', 'mock_generator', 'storage_purge', 'debug_mode']
    };
    localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    return session;
  }

  /**
   * Logout current session
   */
  static logout() {
    localStorage.removeItem(AUTH_KEY);
  }

  /**
   * Check if current user is developer
   */
  static isDeveloper() {
    const s = this.getSession();
    return s && s.role === 'developer';
  }

  /**
   * Check if user is logged in
   */
  static isAuthenticated() {
    return this.getSession() !== null;
  }
}
