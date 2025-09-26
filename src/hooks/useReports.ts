import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ReportData {
  patients: {
    total: number;
    new_this_month: number;
    by_gender: { male: number; female: number; other: number };
    by_age_group: { [key: string]: number };
  };
  consultations: {
    total: number;
    this_month: number;
    by_status: { [key: string]: number };
    by_specialty: { [key: string]: number };
  };
  admissions: {
    total: number;
    current: number;
    this_month: number;
    average_stay: number;
  };
  financial: {
    total_revenue: number;
    monthly_revenue: number;
    pending_bills: number;
    paid_bills: number;
  };
  laboratory: {
    total_tests: number;
    pending_results: number;
    completed_today: number;
  };
}

export function useReports() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchReports = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [
        patientsData,
        consultationsData,
        admissionsData,
        billsData,
        labOrdersData
      ] = await Promise.all([
        supabase.from('patients').select('gender, date_of_birth, created_at'),
        supabase.from('opd_visits').select('status, visit_date, staff!opd_visits_doctor_id_fkey(specialization)'),
        supabase.from('admissions').select('status, admission_date, discharge_date'),
        supabase.from('bills').select('status, total_amount, bill_date'),
        supabase.from('lab_test_orders').select('status, order_date')
      ]);

      // Check for errors
      if (patientsData.error) throw patientsData.error;
      if (consultationsData.error) throw consultationsData.error;
      if (admissionsData.error) throw admissionsData.error;
      if (billsData.error) throw billsData.error;
      if (labOrdersData.error) throw labOrdersData.error;

      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Process patients data
      const patients = patientsData.data || [];
      const patientsByGender = patients.reduce((acc: any, p: any) => {
        acc[p.gender] = (acc[p.gender] || 0) + 1;
        return acc;
      }, {});

      const patientsByAge = patients.reduce((acc: any, p: any) => {
        const age = new Date().getFullYear() - new Date(p.date_of_birth).getFullYear();
        const ageGroup = age < 18 ? '0-17' : age < 65 ? '18-64' : '65+';
        acc[ageGroup] = (acc[ageGroup] || 0) + 1;
        return acc;
      }, {});

      // Process consultations data
      const consultations = consultationsData.data || [];
      const consultationsByStatus = consultations.reduce((acc: any, c: any) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
      }, {});

      const consultationsBySpecialty = consultations.reduce((acc: any, c: any) => {
        const specialty = c.staff?.specialization || 'Não informado';
        acc[specialty] = (acc[specialty] || 0) + 1;
        return acc;
      }, {});

      // Process admissions data
      const admissions = admissionsData.data || [];
      const currentAdmissions = admissions.filter((a: any) => a.status === 'admitted').length;
      const admissionsThisMonth = admissions.filter((a: any) => 
        new Date(a.admission_date) >= thisMonth
      ).length;

      // Calculate average stay
      const dischargedAdmissions = admissions.filter((a: any) => a.discharge_date);
      const averageStay = dischargedAdmissions.length > 0 
        ? dischargedAdmissions.reduce((acc: number, a: any) => {
            const stay = (new Date(a.discharge_date).getTime() - new Date(a.admission_date).getTime()) / (1000 * 60 * 60 * 24);
            return acc + stay;
          }, 0) / dischargedAdmissions.length
        : 0;

      // Process financial data
      const bills = billsData.data || [];
      const totalRevenue = bills
        .filter((b: any) => b.status === 'paid')
        .reduce((acc: number, b: any) => acc + (b.total_amount || 0), 0);
      
      const monthlyRevenue = bills
        .filter((b: any) => b.status === 'paid' && new Date(b.bill_date) >= thisMonth)
        .reduce((acc: number, b: any) => acc + (b.total_amount || 0), 0);

      const pendingBills = bills.filter((b: any) => b.status === 'pending').length;
      const paidBills = bills.filter((b: any) => b.status === 'paid').length;

      // Process laboratory data
      const labOrders = labOrdersData.data || [];
      const pendingResults = labOrders.filter((l: any) => l.status === 'pending').length;
      const completedToday = labOrders.filter((l: any) => 
        l.status === 'completed' && 
        new Date(l.order_date).toDateString() === new Date().toDateString()
      ).length;

      const reportData: ReportData = {
        patients: {
          total: patients.length,
          new_this_month: patients.filter((p: any) => new Date(p.created_at) >= thisMonth).length,
          by_gender: {
            male: patientsByGender.male || 0,
            female: patientsByGender.female || 0,
            other: patientsByGender.other || 0
          },
          by_age_group: patientsByAge
        },
        consultations: {
          total: consultations.length,
          this_month: consultations.filter((c: any) => new Date(c.visit_date) >= thisMonth).length,
          by_status: consultationsByStatus,
          by_specialty: consultationsBySpecialty
        },
        admissions: {
          total: admissions.length,
          current: currentAdmissions,
          this_month: admissionsThisMonth,
          average_stay: Math.round(averageStay * 10) / 10
        },
        financial: {
          total_revenue: totalRevenue,
          monthly_revenue: monthlyRevenue,
          pending_bills: pendingBills,
          paid_bills: paidBills
        },
        laboratory: {
          total_tests: labOrders.length,
          pending_results: pendingResults,
          completed_today: completedToday
        }
      };

      setReportData(reportData);
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      toast({
        title: "Erro ao carregar relatórios",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return {
    reportData,
    loading,
    refetch: fetchReports,
  };
}