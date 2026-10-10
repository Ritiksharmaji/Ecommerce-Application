import type {AuthResponse} from '@/types/api';
import type {User} from '@/types/models';
import {apiClient} from './client';

export const authApi = {
  /** POST /api/auth/login */
  async login(email: string, password: string): Promise<AuthResponse> {
    const {data} = await apiClient.post<AuthResponse>('/api/auth/login', {email, password});
    return data;
  },

  /** POST /api/auth/register */
  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const {data} = await apiClient.post<AuthResponse>('/api/auth/register', {
      name,
      email,
      password,
    });
    return data;
  },

  /** DELETE /api/auth/me — permanently deletes the account (password re-confirmation). */
  async deleteAccount(password: string): Promise<void> {
    await apiClient.delete('/api/auth/me', {data: {password}});
  },

  /** GET /api/auth/me — current user for the stored token. */
  async me(): Promise<User | null> {
    const {data} = await apiClient.get<{user?: User}>('/api/auth/me');
    return data.user ?? null;
  },
};
