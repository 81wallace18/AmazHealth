import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DashboardStats {
  totalPatients: number;
  activePatients: number;
  todayAppointments: number;
  occupiedBeds: number;
  totalBeds: number;
  waitingQueue: number;
}

export interface RecentActivity {
  id: string;
  type: string;
  message: string;
  time: string;
  status: string;
}

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    activePatients: 0,
    todayAppointments: 0,
    occupiedBeds: 0,
    totalBeds: 0,
    waitingQueue: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch patients stats
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('status');
      
      if (patientsError) throw patientsError;

      // Fetch appointments for today
      const today = new Date().toISOString().split('T')[0];
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('status, scheduled_date')
        .gte('scheduled_date', today)
        .lt('scheduled_date', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      
      if (appointmentsError) throw appointmentsError;

      // Fetch beds stats
      const { data: bedsData, error: bedsError } = await supabase
        .from('beds')
        .select('status');
      
      if (bedsError) throw bedsError;

      // Calculate stats
      const totalPatients = patientsData?.length || 0;
      const activePatients = patientsData?.filter(p => p.status === 'active').length || 0;
      const todayAppointments = appointmentsData?.length || 0;
      const occupiedBeds = bedsData?.filter(b => b.status === 'occupied').length || 0;
      const totalBeds = bedsData?.length || 0;
      const waitingQueue = appointmentsData?.filter(a => a.status === 'scheduled').length || 0;

      setStats({
        totalPatients,
        activePatients,
        todayAppointments,
        occupiedBeds,
        totalBeds,
        waitingQueue,
      });

      // Generate recent activities based on data
      const activities: RecentActivity[] = [
        {
          id: '1',
          type: 'appointment',
          message: `${todayAppointments} consultas agendadas para hoje`,
          time: 'há 5 min',
          status: 'info'
        },
        {
          id: '2',
          type: 'patients',
          message: `${activePatients} pacientes ativos no sistema`,
          time: 'há 10 min',
          status: 'success'
        },
        {
          id: '3',
          type: 'beds',
          message: `${occupiedBeds}/${totalBeds} leitos ocupados`,
          time: 'há 15 min',
          status: occupiedBeds > totalBeds * 0.8 ? 'warning' : 'info'
        }
      ];

      setRecentActivities(activities);

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Erro ao carregar dados do dashboard",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return {
    stats,
    recentActivities,
    loading,
    refetch: fetchDashboardData,
  };
}