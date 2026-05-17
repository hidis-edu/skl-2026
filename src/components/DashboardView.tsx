import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Clock, 
  RefreshCw,
  LogOut,
  Bell,
  Search,
  LayoutDashboard,
  Fingerprint,
  ScanFace,
  FileText,
  BookOpen,
  Calendar,
  GraduationCap,
  Star,
  Info,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RealTimeChart } from './RealTimeChart';
import { 
  fetchDashboardStats, 
  fetchFingerprintLogs, 
  fetchFaceIdLogs, 
  fetchLessonLogs, 
  fetchClassSchedule, 
  fetchTeacherSchedule, 
  fetchAllTeachers, 
  fetchGraduationData, 
  fetchBeritaSekolah,
  fetchBeritaGuru,
  fetchBeritaSiswa,
  fetchBuletin,
  getBaseUrl 
} from '../services/api';
import { User, DashboardMetric } from '../types';

interface DashboardViewProps {
  user: User;
  onLogout: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ user, onLogout }) => {
  const [stats, setStats] = useState<DashboardMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  
  const [fingerprintLogs, setFingerprintLogs] = useState<any[]>([]);
  const [faceIdLogs, setFaceIdLogs] = useState<any[]>([]);
  const [lessonLogs, setLessonLogs] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any>(null);
  const [graduationData, setGraduationData] = useState<any>(null);
  const [selectedScheduleDay, setSelectedScheduleDay] = useState<string>('');
  const [reportsLoading, setReportsLoading] = useState(false);
  const [academicLoading, setAcademicLoading] = useState(false);
  const [graduationLoading, setGraduationLoading] = useState(false);
  
  const [infoSubTab, setInfoSubTab] = useState<'school' | 'teacher' | 'student' | 'bulletin'>('school');
  const [beritaData, setBeritaData] = useState<any[]>([]);
  const [beritaLoading, setBeritaLoading] = useState(false);
  const [selectedNews, setSelectedNews] = useState<any>(null);
  
  const [academicSubTab, setAcademicSubTab] = useState<'my' | 'all'>('my');
  const [allTeachers, setAllTeachers] = useState<any[]>([]);
  const [allTeachersLoading, setAllTeachersLoading] = useState(false);
  const [viewingTeacher, setViewingTeacher] = useState<any>(null);

  const stripHtml = (html: string) => {
    if (!html) return "";
    // Replaces HTML entries and tags
    return html
      .replace(/<[^>]*>?/gm, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");
  };

  const formatDate = (dateStr: string) => {
    try {
      if (!dateStr) return "";
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(date);
    } catch (e) {
      return dateStr;
    }
  };

  const groupSchedule = (data: any[]) => {
    const dayMap: Record<number, string> = {
      1: 'Senin', 2: 'Selasa', 3: 'Rabu', 4: 'Kamis', 5: 'Jumat', 6: 'Sabtu', 7: 'Minggu'
    };
    const grouped: any = {};
    data.forEach((item: any) => {
      const dayName = dayMap[item.hari] || `Hari ${item.hari}`;
      if (!grouped[dayName]) grouped[dayName] = [];
      grouped[dayName].push(item);
    });
    Object.keys(grouped).forEach(day => {
      grouped[day].sort((a: any, b: any) => a.jamke - b.jamke);
    });
    return grouped;
  };

  // Fetch real data on mount
  useEffect(() => {
    const getStats = async () => {
      setLoading(true);
      try {
        const statsData = await fetchDashboardStats();
        setStats(statsData);
        
        // If teacher, fetch schedule for dashboard context
        if (user.role === 'pegawai' && user.nip) {
          const scheduleData = await fetchTeacherSchedule(user.nip);
          if (scheduleData && scheduleData.success) {
            setSchedule(scheduleData.data);
            
            // For teacher, override some stats with schedule info if available
            if (scheduleData.total_mengajar) {
              setStats(prev => [
                { label: 'Total Mengajar', value: String(scheduleData.total_mengajar), change: 0 },
                ...prev.filter(s => s.label !== 'Total Mengajar').slice(0, 3)
              ]);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching initial dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    getStats();
  }, [user.role, user.nip]);

  const [reportSubTab, setReportSubTab] = useState<'finger' | 'face' | 'pelajaran'>('finger');

  // Fetch reports when tab changes
  useEffect(() => {
    const studentId = user.nis || user.id;
    if (activeTab === 'reports' && studentId) {
      const getReports = async () => {
        setReportsLoading(true);
        try {
          const fetchPromises: Promise<any>[] = [
            fetchFingerprintLogs(studentId),
            fetchFaceIdLogs(studentId)
          ];
          
          if (user.role !== 'pegawai') {
            fetchPromises.push(fetchLessonLogs(studentId));
          }

          const results = await Promise.all(fetchPromises);
          
          setFingerprintLogs(results[0].data || []);
          setFaceIdLogs(results[1].data || []);
          
          if (user.role !== 'pegawai') {
            setLessonLogs(results[2].data || []);
          }
        } catch (err) {
          console.error('Failed to fetch reports', err);
        } finally {
          setReportsLoading(false);
        }
      };
      getReports();
    }
    
    if (activeTab === 'academic') {
      const getSchedule = async () => {
        setAcademicLoading(true);
        try {
          let data;
          const targetTeacherNip = viewingTeacher?.nip || user.nip;
          
          if (user.role === 'pegawai' && targetTeacherNip) {
            data = await fetchTeacherSchedule(targetTeacherNip);
            if (data && data.success && Array.isArray(data.data)) {
               data.data = groupSchedule(data.data);
            }
          } else if (user.role === 'siswa' && (user.idkelas || user.id)) {
            const idToUse = user.idkelas || user.id;
            data = await fetchClassSchedule(Number(idToUse));
          }

          if (data && data.success) {
            setSchedule(data.data);
            const days = Object.keys(data.data);
            if (days.length > 0) {
              setSelectedScheduleDay(days[0]);
            }
          }
        } catch (err) {
          console.error('Failed to fetch schedule', err);
        } finally {
          setAcademicLoading(false);
        }
      };
      getSchedule();

      if (user.role === 'pegawai') {
        const getAllTeachersList = async () => {
          setAllTeachersLoading(true);
          try {
            const data = await fetchAllTeachers();
            if (data && data.success) {
              const rawTeachers = data.data || [];
              // Get unique teachers by NIP to avoid duplicate keys and redundant entries
              const unique = Array.from(new Map(rawTeachers.map((t: any) => [t.nip, t])).values());
              setAllTeachers(unique);
            }
          } catch (err) {
            console.error('Failed to fetch all teachers', err);
          } finally {
            setAllTeachersLoading(false);
          }
        };
        getAllTeachersList();
      }
    }
    
    const graduationId = user.nis || user.nip;
    if (activeTab === 'graduation' && graduationId) {
      const getGraduation = async () => {
        setGraduationLoading(true);
        try {
          const data = await fetchGraduationData(graduationId);
          setGraduationData(data);
        } catch (err) {
          console.error('Failed to fetch graduation data', err);
        } finally {
          setGraduationLoading(false);
        }
      };
      getGraduation();
    }

    if (activeTab === 'info') {
      const getBerita = async () => {
        setBeritaLoading(true);
        try {
          let data;
          if (infoSubTab === 'school') data = await fetchBeritaSekolah();
          else if (infoSubTab === 'teacher') data = await fetchBeritaGuru();
          else if (infoSubTab === 'student') data = await fetchBeritaSiswa();
          else data = await fetchBuletin();
          
          if (data && (data.status === 'sukses' || data.success)) {
            setBeritaData(data.data || []);
          }
        } catch (err) {
          console.error('Failed to fetch news', err);
        } finally {
          setBeritaLoading(false);
        }
      };
      getBerita();
    }
  }, [activeTab, user.nis, user.nip, user.id, user.idkelas, viewingTeacher, infoSubTab]);

  // Generate some dynamic chart data
  const [chartData, setChartData] = useState(() => 
    Array.from({ length: 7 }, (_, i) => ({
      time: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'][i],
      attendance: 80 + Math.floor(Math.random() * 20),
      engagement: 60 + Math.floor(Math.random() * 40),
    }))
  );

  // Derive teacher specific chart data if schedule is available
  useEffect(() => {
    if (user.role === 'pegawai' && schedule) {
      const dayMap: Record<number, number> = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6 };
      const counts = [0, 0, 0, 0, 0, 0, 0];
      
      const flatData = Array.isArray(schedule) 
        ? schedule 
        : Object.values(schedule).flat();

      flatData.forEach((item: any) => {
        const idx = dayMap[item.hari];
        if (idx !== undefined) counts[idx]++;
      });

      const newChartData = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((day, i) => ({
        time: day,
        sessions: counts[i],
        engagement: 70 + Math.floor(Math.random() * 30), // some filler
      }));
      setChartData(newChartData);
    }
  }, [user.role, schedule]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pb-24">
      {/* Mobile Top Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-5 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-200">H</div>
          <div>
            <h1 className="text-sm font-black text-slate-800 leading-tight uppercase tracking-tighter">Hidis v7</h1>
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{user.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="relative p-2 rounded-full bg-slate-50 text-slate-500 active:scale-90 transition-all">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-indigo-600 ring-2 ring-white" />
          </button>
          <div className="h-9 w-9 rounded-full border border-slate-200 bg-indigo-50 flex items-center justify-center overflow-hidden shadow-sm">
            {user.foto ? (
              <img src={user.foto} alt="Profile" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="h-full w-full bg-gradient-to-tr from-indigo-500 to-purple-400" />
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-5 pt-6 pb-4">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-indigo-600 rounded-[32px] p-6 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden group"
        >
          {/* Background Decorative Element */}
          <div className="absolute -top-12 -right-12 h-64 w-64 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
          
          <div className="relative flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-xs font-black text-indigo-100 uppercase tracking-widest mb-1 opacity-80">Selamat Datang,</p>
              <h2 className="text-2xl font-black tracking-tight mb-4 leading-tight">{user.name}</h2>
              
              <div className="flex flex-wrap items-center gap-3">
                 <div className="bg-white/10 rounded-2xl px-4 py-2 backdrop-blur-md border border-white/10 flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-50">Online</p>
                 </div>
                 <div className="bg-white/10 rounded-2xl px-4 py-2 backdrop-blur-md border border-white/10 flex flex-col gap-0.5">
                    <p className="text-[8px] font-black uppercase tracking-widest text-indigo-200">
                      {user.role === 'pegawai' ? 'NIP' : 'NIS / NISN'}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-50">
                      {user.role === 'pegawai' ? user.nip : `${user.nis || user.id}${user.nisn ? ` / ${user.nisn}` : ''}`}
                    </p>
                 </div>
              </div>
            </div>

            {/* Large Student Photo */}
            <div className="relative shrink-0 pr-1">
               <div className="h-24 w-24 rounded-[28px] border-4 border-white/30 bg-white/10 overflow-hidden shadow-2xl rotate-3 group-hover:rotate-0 transition-all duration-500">
                  {user.foto ? (
                    <img 
                      src={user.foto} 
                      alt="Student" 
                      className="h-full w-full object-cover scale-110 hover:scale-125 transition-transform duration-700" 
                      referrerPolicy="no-referrer" 
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                       <Users className="h-10 w-10 text-white/40" />
                    </div>
                  )}
               </div>
               
               {/* Floating Icon Attribute */}
               <motion.div 
                 initial={{ scale: 0 }}
                 animate={{ scale: 1 }}
                 transition={{ delay: 0.5, type: 'spring' }}
                 className="absolute -bottom-2 -left-2 bg-yellow-400 text-indigo-900 h-8 w-8 rounded-2xl flex items-center justify-center shadow-lg border-2 border-white transform -rotate-12"
               >
                  <Star className="h-4 w-4 fill-current" />
               </motion.div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Main Content */}
      <main className="px-5 space-y-6">
        <AnimatePresence mode="wait">
          {activeTab === 'home' ? (
            <motion.div
              key="home-tab"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Quick Stats Horizontal Scroll or Grid */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Ringkasan Hari Ini</h3>
                  <button className="text-[10px] font-bold text-indigo-600 uppercase">Detail</button>
                </div>
                
                {loading ? (
                   <div className="flex items-center justify-center p-8">
                      <RefreshCw className="h-6 w-6 text-indigo-200 animate-spin" />
                   </div>
                ) : stats.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {stats.map((stat, idx) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm"
                      >
                         <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{stat.label}</p>
                         <div className="flex items-baseline gap-1.5">
                            <span className="text-xl font-black text-slate-800">{stat.value}</span>
                            {stat.change !== 0 && stat.change && (
                              <span className={`text-[9px] font-bold ${stat.change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {stat.change > 0 ? '↑' : '↓'}{Math.abs(stat.change)}
                              </span>
                            )}
                         </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white p-6 rounded-2xl border border-dashed border-slate-200 text-center">
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Data tidak tersedia</p>
                  </div>
                )}
              </div>

              {/* Real-Time Visualization */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                <RealTimeChart 
                  type="area" 
                  title={user.role === 'pegawai' ? "Beban Mengajar (Sesi/Hari)" : "Tren Kehadiran Mingguan"} 
                  data={chartData} 
                  dataKey={user.role === 'pegawai' ? "sessions" : "attendance"} 
                  color="#4f46e5"
                />
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                <RealTimeChart 
                  type="bar" 
                  title={user.role === 'pegawai' ? "Interaksi Kelas" : "Login Terakhir Siswa"} 
                  data={chartData} 
                  dataKey="engagement" 
                  color="#6366f1"
                />
              </div>
            </motion.div>
          ) : activeTab === 'reports' ? (
            <motion.div
              key="reports-tab"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Laporan Absensi</h3>
                </div>
                <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
                  <button 
                    onClick={() => setReportSubTab('finger')}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black transition-all uppercase ${reportSubTab === 'finger' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                  >
                    Finger
                  </button>
                  <button 
                    onClick={() => setReportSubTab('face')}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black transition-all uppercase ${reportSubTab === 'face' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                  >
                    Face ID
                  </button>
                  {user.role !== 'pegawai' && (
                    <button 
                      onClick={() => setReportSubTab('pelajaran')}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black transition-all uppercase ${reportSubTab === 'pelajaran' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                    >
                      Pelajaran
                    </button>
                  )}
                </div>
              </div>

              {reportsLoading ? (
                <div className="flex flex-col items-center justify-center p-20 gap-4">
                  <RefreshCw className="h-8 w-8 text-indigo-400 animate-spin" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Mengambil Data...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {reportSubTab === 'finger' ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Fingerprint className="h-4 w-4 text-slate-400" />
                        <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.1em]">Log Fingerprint</h4>
                      </div>
                      {fingerprintLogs.length > 0 ? (
                        <div className="space-y-3">
                          {fingerprintLogs.slice(0, 10).map((log, i) => (
                            <div key={i} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                              <div className="flex justify-between items-start mb-3 border-b border-slate-50 pb-2">
                                <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Presensi</p>
                                  <p className="text-xs font-bold text-slate-800 leading-none">{new Date(log.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
                                </div>
                                <div className="bg-indigo-50 px-2 py-0.5 rounded-md">
                                  <span className="text-[9px] font-black text-indigo-600 uppercase italic">FINGER</span>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-2 rounded-full bg-green-500" />
                                  <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase leading-none">Datang</p>
                                    <p className="text-sm font-black text-slate-700 tracking-tighter">{log.jam_datang || '--:--'}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 border-l border-slate-50 pl-4">
                                  <div className="h-2 w-2 rounded-full bg-red-400" />
                                  <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase leading-none">Pulang</p>
                                    <p className="text-sm font-black text-slate-700 tracking-tighter">{log.jam_pulang || '--:--'}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-white p-6 rounded-2xl border border-dashed border-slate-200 text-center">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tidak ada record fingerprint</p>
                        </div>
                      )}
                    </div>
                  ) : reportSubTab === 'face' ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <ScanFace className="h-4 w-4 text-slate-400" />
                        <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.1em]">Log Face ID</h4>
                      </div>
                      {faceIdLogs.length > 0 ? (
                        <div className="space-y-3">
                          {faceIdLogs.slice(0, 10).map((log, i) => (
                            <div key={i} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                               <div className="flex justify-between items-start mb-3 border-b border-slate-50 pb-2">
                                <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Presensi</p>
                                  <p className="text-xs font-bold text-slate-800 leading-none">{new Date(log.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
                                </div>
                                <div className="bg-purple-50 px-2 py-0.5 rounded-md">
                                  <span className="text-[9px] font-black text-purple-600 uppercase italic">FACE</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                 <div className="h-10 w-10 rounded-full border-2 border-indigo-100 p-0.5">
                                   <div className="h-full w-full bg-slate-100 rounded-full flex items-center justify-center">
                                      <ScanFace className="h-5 w-5 text-indigo-400" />
                                   </div>
                                 </div>
                                 <div className="flex-1 grid grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-[9px] font-bold text-slate-400 uppercase leading-none">Datang</p>
                                      <p className="text-sm font-black text-slate-700 tracking-tighter">{log.jam_datang || '--:--'}</p>
                                    </div>
                                    <div className="border-l border-slate-50 pl-4">
                                      <p className="text-[9px] font-bold text-slate-400 uppercase leading-none">Pulang</p>
                                      <p className="text-sm font-black text-slate-700 tracking-tighter">{log.jam_pulang || '--:--'}</p>
                                    </div>
                                 </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-white p-6 rounded-2xl border border-dashed border-slate-200 text-center">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tidak ada record Face ID</p>
                        </div>
                      )}
                    </div>
                  ) : reportSubTab === 'pelajaran' && user.role !== 'pegawai' ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-slate-400" />
                        <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.1em]">Absensi Pelajaran</h4>
                      </div>
                      {lessonLogs.length > 0 ? (
                        <div className="space-y-3">
                          {lessonLogs.slice(0, 15).map((log, i) => (
                            <div key={i} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                               <div className="flex justify-between items-start mb-3 border-b border-slate-50 pb-2">
                                <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{log.tanggal.split('T')[0]}</p>
                                  <p className="text-xs font-black text-indigo-600">{log.mapel}</p>
                                </div>
                                <div className={`px-2 py-0.5 rounded-md ${log.status_absen === 'Hadir' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                  <span className="text-[9px] font-black uppercase italic">{log.status_absen}</span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-lg bg-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                       {log.nama_kelas}
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">{log.jam}</p>
                                 </div>
                                 {log.catatan && (
                                   <p className="text-[9px] italic text-slate-400 max-w-[150px] truncate">{log.catatan}</p>
                                 )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-white p-6 rounded-2xl border border-dashed border-slate-200 text-center">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tidak ada record pelajaran</p>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
            </motion.div>
          ) : activeTab === 'academic' ? (
            <motion.div
              key="academic-tab"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6 pb-4"
            >
               <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Akademik</h3>
                </div>
                
                {user.role === 'pegawai' && (
                  <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
                    <button 
                      onClick={() => setAcademicSubTab('my')}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black transition-all uppercase ${academicSubTab === 'my' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                    >
                      Jadwal Saya
                    </button>
                    <button 
                      onClick={() => setAcademicSubTab('all')}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black transition-all uppercase ${academicSubTab === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                    >
                      Semua Guru
                    </button>
                  </div>
                )}
              </div>

              {academicSubTab === 'my' || user.role === 'siswa' ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {viewingTeacher ? `Jadwal: ${viewingTeacher.nama}` : 'Jadwal Mengajar / Belajar'}
                      </h4>
                      {viewingTeacher && (
                        <button 
                          onClick={() => setViewingTeacher(null)}
                          className="text-[9px] font-bold text-indigo-600 uppercase flex items-center gap-1 mt-1"
                        >
                          <RefreshCw className="h-2 w-2" />
                          Kembali ke Jadwal Saya
                        </button>
                      )}
                    </div>
                    {schedule && (
                      <div className="relative">
                        <select 
                          value={selectedScheduleDay}
                          onChange={(e) => setSelectedScheduleDay(e.target.value)}
                          className="appearance-none bg-white border border-slate-100 rounded-xl px-4 py-2 pr-10 text-[10px] font-black text-indigo-600 uppercase tracking-widest shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 active:scale-95 transition-all"
                        >
                          {Object.keys(schedule).map((day) => (
                            <option key={day} value={day}>{day}</option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                           <Search className="h-3 w-3 text-slate-400 rotate-90" />
                        </div>
                      </div>
                    )}
                  </div>

                  {academicLoading ? (
                    <div className="flex flex-col items-center justify-center p-20 gap-4">
                      <RefreshCw className="h-8 w-8 text-indigo-400 animate-spin" />
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Menyusun Jadwal...</p>
                    </div>
                  ) : schedule && selectedScheduleDay ? (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between sticky top-16 bg-slate-50 py-2 z-10 border-b border-slate-100 mb-2">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">{selectedScheduleDay}</h4>
                          </div>
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md uppercase">
                            {(() => {
                               const dayData = schedule[selectedScheduleDay];
                               if (!dayData) return 0;
                               return Array.isArray(dayData) ? dayData.length : Object.keys(dayData).length;
                            })()} Sesi
                          </span>
                        </div>
                        <div className="space-y-3 pl-3 border-l-2 border-indigo-100">
                            {(() => {
                              const dayData = schedule[selectedScheduleDay];
                              const sessions = Array.isArray(dayData) ? dayData : (dayData ? Object.values(dayData) : []);
                              return sessions.map((session: any, idx: number) => (
                                <motion.div 
                                   key={idx}
                                   initial={{ opacity: 0, x: -10 }}
                                   animate={{ opacity: 1, x: 0 }}
                                   transition={{ delay: idx * 0.05 }}
                                   className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden active:bg-slate-50 transition-colors"
                                >
                                   <div className="flex justify-between items-start mb-2">
                                     <div className="flex items-center gap-2">
                                       <span className="text-[9px] font-black text-white bg-indigo-600 px-1.5 py-0.5 rounded-md">#{session.jamke}</span>
                                       <p className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-tighter">
                                         {session.jam_mulai?.substring(0, 5)} - {session.jam_selesai?.substring(0, 5)}
                                       </p>
                                     </div>
                                     <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{session.kode_pelajaran}</span>
                                   </div>
                                   <h5 className="text-sm font-black text-slate-800 leading-tight mb-1">{session.mata_pelajaran}</h5>
                                   <div className="flex items-center gap-1.5">
                                      <Users className="h-3 w-3 text-slate-400" />
                                      <p className="text-[10px] font-medium text-slate-500 italic">{session.nama_guru || session.nama_kelas}</p>
                                   </div>
                                </motion.div>
                              ));
                            })()}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white p-10 rounded-3xl border border-dashed border-slate-200 text-center">
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Jadwal belum tersedia</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Daftar Semua Guru</h4>
                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg italic">{allTeachers.length} Guru</span>
                  </div>

                  {allTeachersLoading ? (
                    <div className="flex flex-col items-center justify-center p-20 gap-4">
                      <RefreshCw className="h-8 w-8 text-indigo-400 animate-spin" />
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Memuat Guru...</p>
                    </div>
                  ) : allTeachers.length > 0 ? (
                    <div className="space-y-3">
                      {allTeachers.map((teacher: any, idx: number) => (
                        <motion.div 
                          key={`${teacher.nip || 'teacher'}-${idx}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.02 }}
                          className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group active:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                             <div className="h-10 w-10 rounded-2xl bg-indigo-50 flex items-center justify-center overflow-hidden border border-indigo-100 group-hover:scale-110 transition-transform">
                                {teacher.foto ? (
                                  <img src={teacher.foto} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <Users className="h-5 w-5 text-indigo-300" />
                                )}
                             </div>
                             <div>
                                <h5 className="text-sm font-black text-slate-800 leading-tight">{teacher.nama}</h5>
                                <div className="flex items-center gap-2">
                                  <p className="text-[10px] font-bold text-slate-400 font-mono tracking-tighter">NIP: {teacher.nip}</p>
                                  {teacher.level && (
                                     <span className="text-[8px] font-black text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded uppercase">LVL {teacher.level}</span>
                                  )}
                                </div>
                             </div>
                          </div>
                          <motion.button 
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                              setViewingTeacher(teacher);
                              setAcademicSubTab('my');
                            }}
                            className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-indigo-600 hover:text-white transition-colors"
                          >
                             <Search className="h-4 w-4" />
                          </motion.button>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white p-10 rounded-3xl border border-dashed border-slate-200 text-center">
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Daftar guru tidak ditemukan</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ) : activeTab === 'graduation' ? (
            <motion.div
              key="graduation-tab"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
               <div className="flex items-center gap-3">
                <GraduationCap className="h-6 w-6 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Informasi Kelulusan</h3>
              </div>

              {graduationLoading ? (
                <div className="flex flex-col items-center justify-center p-20 gap-4">
                  <RefreshCw className="h-8 w-8 text-indigo-400 animate-spin" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Memeriksa Data...</p>
                </div>
              ) : (graduationData && graduationData.success) ? (
                <div className="space-y-6 pb-20">
                  <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-indigo-100/20 text-center space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                    
                    <div className="h-20 w-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-inner">
                        <GraduationCap className="h-10 w-10 text-indigo-600" />
                    </div>
                    
                    <h4 className="text-lg font-black text-slate-800 tracking-tight">{graduationData.data["Nama Lengkap"]}</h4>
                    <div className="inline-flex items-center gap-2 bg-slate-100 px-4 py-1.5 rounded-full">
                        <div className={`h-2 w-2 rounded-full ${graduationData.data["Kelulusan"] === "Lulus" ? 'bg-green-500' : 'bg-slate-400'}`} />
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                          {graduationData.data["Kelulusan"] || "PROSES"}
                        </span>
                    </div>
                    
                    <div className="pt-4 grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-left">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Induk / NIS</p>
                          <p className="text-sm font-black text-slate-700">{graduationData.data["Induk"]}</p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-left">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">NISN</p>
                          <p className="text-sm font-black text-slate-700">{graduationData.data["NISN"]}</p>
                        </div>
                    </div>
                  </div>

                  {/* Nilai Akhir Sekolah Section */}
                  <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                       <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Nilai Akhir Sekolah</h4>
                       <div className="bg-indigo-50 px-2 py-1 rounded-lg">
                          <span className="text-[10px] font-black text-indigo-600">Rata: {graduationData.data["Rata-rata NAS"]}</span>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                       {[
                         { label: 'Agama', key: 'Agm' },
                         { label: 'PP', key: 'PP' },
                         { label: 'B. Indonesia', key: 'B.Ind' },
                         { label: 'Matematika', key: 'Mat' },
                         { label: 'IPAS', key: 'IPAS' },
                         { label: 'Seni', key: 'Seni' },
                         { label: 'PJOK', key: 'PJOK' },
                         { label: 'PLBJ', key: 'PLBJ' },
                         { label: 'B. Inggris', key: 'B.Ing' },
                         { label: 'KKA', key: 'KKA' }
                       ].map((item) => (
                         <div key={item.key} className="flex justify-between items-center group">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{item.label}</span>
                            <div className="h-[1px] flex-1 mx-2 bg-slate-50 group-hover:bg-indigo-50 transition-colors" />
                            <span className="text-xs font-black text-slate-700">{graduationData.data[item.key] || '-'}</span>
                         </div>
                       ))}
                    </div>

                    {graduationData.data["Jumlah NAS"] && (
                      <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-600 uppercase">Total Nilai</span>
                        <span className="text-lg font-black text-indigo-600">{graduationData.data["Jumlah NAS"]}</span>
                      </div>
                    )}
                  </div>

                  {user.nis && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      <a 
                        href={`${getBaseUrl()}/api/download/preview/${user.nis}.pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-3 w-full py-4 bg-indigo-600 text-white rounded-3xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all"
                      >
                        <FileText className="h-4 w-4" />
                        Preview Dokumen Kelulusan
                      </a>
                    </motion.div>
                  )}

                  <p className="text-[9px] text-center text-slate-400 font-medium px-10">
                    * Data ini bersifat sementara. Untuk keaslian data silakan hubungi bagian administrasi sekolah.
                  </p>
                </div>
              ) : (
                 <div className="bg-white p-10 rounded-3xl border border-dashed border-slate-200 text-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest underline decoration-indigo-200 decoration-2 underline-offset-4">
                      {graduationData?.message || "Data belum tersedia / tidak ditemukan"}
                    </p>
                 </div>
              )}
            </motion.div>
          ) : activeTab === 'info' ? (
            <motion.div
              key="info-tab"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <Info className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Informasi Terkini</h3>
                </div>
                
                <div className="bg-slate-100 p-1 rounded-2xl flex gap-1 overflow-x-auto no-scrollbar">
                  <button 
                    onClick={() => setInfoSubTab('school')}
                    className={`px-4 py-2 rounded-xl text-[9px] font-black transition-all uppercase whitespace-nowrap ${infoSubTab === 'school' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                  >
                    Sekolah
                  </button>
                  <button 
                    onClick={() => setInfoSubTab('teacher')}
                    className={`px-4 py-2 rounded-xl text-[9px] font-black transition-all uppercase whitespace-nowrap ${infoSubTab === 'teacher' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                  >
                    Guru
                  </button>
                  <button 
                    onClick={() => setInfoSubTab('student')}
                    className={`px-4 py-2 rounded-xl text-[9px] font-black transition-all uppercase whitespace-nowrap ${infoSubTab === 'student' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                  >
                    Siswa
                  </button>
                  <button 
                    onClick={() => setInfoSubTab('bulletin')}
                    className={`px-4 py-2 rounded-xl text-[9px] font-black transition-all uppercase whitespace-nowrap ${infoSubTab === 'bulletin' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                  >
                    Buletin
                  </button>
                </div>
              </div>

              {beritaLoading ? (
                <div className="flex flex-col items-center justify-center p-20 gap-4">
                  <RefreshCw className="h-8 w-8 text-indigo-400 animate-spin" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Memuat Berita...</p>
                </div>
              ) : beritaData.length > 0 ? (
                <div className="space-y-4 pb-20">
                  {beritaData.map((news, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => setSelectedNews(news)}
                      className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden group active:scale-[0.98] transition-all cursor-pointer"
                    >
                      {news.gambar && (
                        <div className="h-40 w-full overflow-hidden">
                          <img 
                            src={news.gambar} 
                            alt="" 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase">{news.kategori || (infoSubTab === 'school' ? 'Sekolah' : infoSubTab === 'teacher' ? 'Guru' : infoSubTab === 'student' ? 'Siswa' : 'Buletin')}</span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase">{formatDate(news.tanggal || news.tanggalbuletin)}</span>
                        </div>
                        <h4 className="text-sm font-black text-slate-800 leading-tight mb-2">{news.judul}</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed mb-4 line-clamp-3 font-medium">
                          {stripHtml(news.abstrak || news.keterangan || news.isi)}
                        </p>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                               <div className="h-6 w-6 rounded-lg bg-slate-100 flex items-center justify-center">
                                  <Users className="h-3 w-3 text-slate-400" />
                               </div>
                               <span className="text-[9px] font-bold text-slate-400 uppercase">{news.penulis || news.nama_guru || news.nama_pengirim || news.idpengirim || 'Admin'}</span>
                            </div>
                            {news.rata_rating && (
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                                <span className="text-[10px] font-black text-slate-600">{Number(news.rata_rating).toFixed(1)}</span>
                              </div>
                            )}
                            {news.link && (
                              <a 
                                href={news.link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="h-8 w-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100 active:scale-90 transition-all"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="bg-white p-12 rounded-[40px] border border-dashed border-slate-200 text-center">
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Belum ada informasi tersedia</p>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
              <Users className="h-8 w-8 text-slate-200" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Hanya tersedia untuk Master</p>
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Elegant Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40">
        <div className="bg-slate-900/95 backdrop-blur-xl border-t border-white/5 px-2 pt-2 pb-8 flex items-center justify-between">
          <button 
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all flex-1 ${activeTab === 'home' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="text-[9px] font-bold uppercase tracking-tighter">Home</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('academic')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all flex-1 ${activeTab === 'academic' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
          >
            <Calendar className="h-5 w-5" />
            <span className="text-[9px] font-bold uppercase tracking-tighter">Akademik</span>
          </button>

          <button 
            onClick={() => setActiveTab('reports')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all flex-1 ${activeTab === 'reports' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
          >
            <BarChart3 className="h-5 w-5" />
            <span className="text-[9px] font-bold uppercase tracking-tighter">Laporan</span>
          </button>

          <button 
            onClick={() => setActiveTab(user.role === 'pegawai' ? 'info' : 'graduation')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all flex-1 ${activeTab === (user.role === 'pegawai' ? 'info' : 'graduation') ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
          >
            {user.role === 'pegawai' ? (
              <>
                <Info className="h-5 w-5" />
                <span className="text-[9px] font-bold uppercase tracking-tighter">Info</span>
              </>
            ) : (
              <>
                <GraduationCap className="h-5 w-5" />
                <span className="text-[9px] font-bold uppercase tracking-tighter">Lulus</span>
              </>
            )}
          </button>

          <button 
            onClick={onLogout}
            className="flex flex-col items-center gap-1 p-2 rounded-xl text-red-400 active:bg-red-500/10 flex-1"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-[9px] font-bold uppercase tracking-tighter">Out</span>
          </button>
        </div>
      </nav>

      {/* News Detail Popup */}
      <AnimatePresence>
        {selectedNews && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-5"
          >
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedNews(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            />
            
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative bg-white w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="absolute top-4 right-4 z-10">
                <button 
                  onClick={() => setSelectedNews(null)}
                  className="h-10 w-10 rounded-full bg-black/10 backdrop-blur-md flex items-center justify-center text-white sm:text-slate-800 sm:bg-slate-100 active:scale-90 transition-all"
                >
                  <RefreshCw className="h-5 w-5 rotate-45" />
                </button>
              </div>

              <div className="overflow-y-auto no-scrollbar pb-10">
                {selectedNews.gambar && (
                  <div className="h-64 w-full relative">
                    <img 
                      src={selectedNews.gambar} 
                      alt="" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                )}

                <div className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest">
                      {selectedNews.kategori || (infoSubTab === 'school' ? 'Sekolah' : infoSubTab === 'teacher' ? 'Guru' : infoSubTab === 'student' ? 'Siswa' : 'Buletin')}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      {formatDate(selectedNews.tanggal || selectedNews.tanggalbuletin)}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-slate-800 leading-tight mb-6">{selectedNews.judul}</h3>
                  
                  <div className="flex items-center gap-3 mb-8 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                      <Users className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Penulis</p>
                      <p className="text-sm font-black text-slate-800">{selectedNews.penulis || selectedNews.nama_guru || selectedNews.nama_pengirim || selectedNews.idpengirim || 'Admin Sekolah'}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Render content - stripping HTML for safety but keeping it readable */}
                    <p className="text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">
                      {stripHtml(selectedNews.isi || selectedNews.keterangan || selectedNews.abstrak)}
                    </p>

                    {selectedNews.link && (
                      <a 
                        href={selectedNews.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-3 w-full py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 active:scale-[0.98] transition-all mt-8"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Baca Selengkapnya
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
