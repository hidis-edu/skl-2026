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
    
    // Support both "status": "sukses" and "success": true
    if (response.data.status === 'sukses' || response.data.success === true) {
      return response.data.data || response.data.user;
    }
    throw new Error(response.data.message || 'Login Gagal');
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || 'Verification Error');
  }
};

export const loginPegawai = async (status: string, nip: string, password: string) => {
  try {
    const response = await api.post('/api/jbsuser/login', {
      status,
      nip,
      password,
    });
    
    // Support both "status": "sukses" and "success": true
    if (response.data.status === 'sukses' || response.data.success === true) {
      return response.data.data || response.data.user;
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

export const fetchTeacherSchedule = async (nip: string) => {
  try {
    const response = await api.get(`/api/jbsakad/guru/${nip}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching teacher schedule:', error);
    return { success: false, data: {} };
  }
};

export const fetchAllTeachers = async () => {
  try {
    const response = await api.get('/api/jbsakad/guru');
    return response.data;
  } catch (error) {
    console.error('Error fetching all teachers:', error);
    return { success: false, data: [] };
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

export const fetchBeritaSekolah = async () => {
  try {
    const response = await api.get('/api/jbsvcr/berita-sekolah');
    return response.data;
  } catch (error) {
    console.error('Error fetching school news:', error);
    return { success: false, data: [] };
  }
};

export const fetchBeritaGuru = async () => {
  try {
    const response = await api.get('/api/jbsvcr/berita-guru');
    return response.data;
  } catch (error) {
    console.error('Error fetching teacher news:', error);
    return { success: false, data: [] };
  }
};

export const fetchBeritaSiswa = async () => {
  try {
    const response = await api.get('/api/jbsvcr/berita-siswa');
    return response.data;
  } catch (error) {
    console.error('Error fetching student news:', error);
    return { success: false, data: [] };
  }
};

export const fetchBuletin = async () => {
  try {
    const response = await api.get('/api/jbsvcr/buletin');
    return response.data;
  } catch (error) {
    console.error('Error fetching bulletin:', error);
    return { success: false, data: [] };
  }
};

export const fetchTeacherDetails = async (nip: string) => {
  try {
    const response = await api.get(`/api/jbssdm/pegawai/${nip}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching teacher details:', error);
    return { status: 'gagal', data: null };
  }
};

export const searchStudentByPhone = async (phone: string) => {
  try {
    const response = await api.get(`/api/jbsakad/siswa/search?hportu=${phone}`);
    return response.data;
  } catch (error) {
    console.error('Error searching student:', error);
    return { status: 'gagal', data: [] };
  }
};

export const sendWhatsAppMessage = async (number: string, text: string) => {
  try {
    const response = await axios.post('/api/whatsapp/send', {
      number,
      text,
    });
    return response.data;
  } catch (error: any) {
    console.error('Error sending WhatsApp message:', error);
    return { status: 'error', message: error.response?.data?.message || 'Gagal mengirim pesan' };
  }
};

export default api;
