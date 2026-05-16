import axios from 'axios';

const DEFAULT_BASE_URL = 'https://v7.hidis.id';

export const getBaseUrl = () => {
  return localStorage.getItem('hidis_base_url') || DEFAULT_BASE_URL;
};

export const setBaseUrl = (url: string) => {
  localStorage.setItem('hidis_base_url', url);
};

const api = axios.create({
  baseURL: getBaseUrl(),
});

// Update baseURL whenever it changes in localStorage
export const refreshApiBaseUrl = () => {
  api.defaults.baseURL = getBaseUrl();
};

export const loginSiswa = async (status: string, nis: string, pin: string) => {
  try {
    const response = await api.post('/api/jbsuser/login', {
      status,
      nis,
      pin,
    });
    if (response.data.status === 'sukses') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Login Gagal');
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || 'Verification Error');
  }
};

export const loginPegawai = async (nip: string, password: string) => {
  try {
    const response = await api.post('/api/jbsuser/login', {
      nip,
      password,
    });
    if (response.data.status === 'sukses') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Login Gagal');
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Access Denied');
  }
};

// Dashboard data fetching
export const fetchDashboardStats = async () => {
  try {
    const response = await api.get('/api/dashboard/summary');
    if (response.data.status === 'sukses') {
      return response.data.data;
    }
    return [];
  } catch (error) {
    return [];
  }
};

export const fetchFingerprintLogs = async (nis: string) => {
  try {
    const response = await api.get(`/api/jbssat/fingerprint/${nis}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching fingerprint logs:', error);
    return { status: 'gagal', data: [] };
  }
};

export const fetchFaceIdLogs = async (nis: string) => {
  try {
    const response = await api.get(`/api/jbssat/faceid/${nis}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching faceid logs:', error);
    return { status: 'gagal', data: [] };
  }
};

export const fetchLessonLogs = async (nis: string) => {
  try {
    const response = await api.get(`/api/jbsakad/presensi-pelajaran/${nis}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching lesson logs:', error);
    return { status: 'gagal', data: [] };
  }
};

export const fetchClassSchedule = async (idkelas: number) => {
  try {
    const response = await api.get(`/api/jbsakad/jadwal/kelas/${idkelas}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching class schedule:', error);
    return { success: false, data: {} };
  }
};

export const fetchGraduationData = async (nis: string) => {
  try {
    const response = await api.get(`/api/gas/data/${nis}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching graduation data:', error);
    return null;
  }
};

export default api;
