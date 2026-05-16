export type UserRole = 'siswa' | 'pegawai';

export interface User {
  id: string | number;
  name: string;
  role: UserRole;
  nis?: string;
  nip?: string;
  nisn?: string;
  foto?: string;
  idkelas?: number;
  token?: string;
}

export interface DashboardMetric {
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
}

export interface ChartDataPoint {
  time: string;
  value: number;
  target?: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface Config {
  baseUrl: string;
}
