export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admissions: {
        Row: {
          admission_code: string
          admission_date: string
          admission_type: string
          bed_id: string | null
          created_at: string
          diagnosis: string | null
          discharge_date: string | null
          discharge_summary: string | null
          doctor_id: string
          id: string
          notes: string | null
          patient_id: string
          reason_for_admission: string
          status: string
          treatment_plan: string | null
          updated_at: string
        }
        Insert: {
          admission_code: string
          admission_date?: string
          admission_type: string
          bed_id?: string | null
          created_at?: string
          diagnosis?: string | null
          discharge_date?: string | null
          discharge_summary?: string | null
          doctor_id: string
          id?: string
          notes?: string | null
          patient_id: string
          reason_for_admission: string
          status?: string
          treatment_plan?: string | null
          updated_at?: string
        }
        Update: {
          admission_code?: string
          admission_date?: string
          admission_type?: string
          bed_id?: string | null
          created_at?: string
          diagnosis?: string | null
          discharge_date?: string | null
          discharge_summary?: string | null
          doctor_id?: string
          id?: string
          notes?: string | null
          patient_id?: string
          reason_for_admission?: string
          status?: string
          treatment_plan?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_admissions_bed"
            columns: ["bed_id"]
            isOneToOne: false
            referencedRelation: "beds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_admissions_doctor"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_admissions_patient"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          appointment_code: string
          created_at: string
          doctor_id: string
          duration_minutes: number
          id: string
          notes: string | null
          patient_id: string
          reason: string
          scheduled_date: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          appointment_code: string
          created_at?: string
          doctor_id: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          patient_id: string
          reason: string
          scheduled_date: string
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          appointment_code?: string
          created_at?: string
          doctor_id?: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          patient_id?: string
          reason?: string
          scheduled_date?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      beds: {
        Row: {
          bed_number: string
          bed_type: string
          created_at: string
          current_patient_id: string | null
          id: string
          status: string
          updated_at: string
          ward_id: string
        }
        Insert: {
          bed_number: string
          bed_type: string
          created_at?: string
          current_patient_id?: string | null
          id?: string
          status?: string
          updated_at?: string
          ward_id: string
        }
        Update: {
          bed_number?: string
          bed_type?: string
          created_at?: string
          current_patient_id?: string | null
          id?: string
          status?: string
          updated_at?: string
          ward_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "beds_current_patient_id_fkey"
            columns: ["current_patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beds_ward_id_fkey"
            columns: ["ward_id"]
            isOneToOne: false
            referencedRelation: "wards"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_details: {
        Row: {
          bill_id: string
          created_at: string
          id: string
          item_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          bill_id: string
          created_at?: string
          id?: string
          item_id: string
          quantity?: number
          total_price: number
          unit_price: number
        }
        Update: {
          bill_id?: string
          created_at?: string
          id?: string
          item_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_bill_details_bill"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_bill_details_item"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "billing_items"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_categories: {
        Row: {
          category_code: string
          category_name: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          category_code: string
          category_name: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          category_code?: string
          category_name?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      billing_items: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          item_code: string
          item_name: string
          price: number
          tax_rate: number | null
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          item_code: string
          item_name: string
          price: number
          tax_rate?: number | null
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          item_code?: string
          item_name?: string
          price?: number
          tax_rate?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_billing_items_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "billing_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      bills: {
        Row: {
          bill_date: string
          bill_number: string
          created_at: string
          discount_amount: number
          due_date: string | null
          id: string
          notes: string | null
          paid_amount: number
          patient_id: string
          payment_method: string | null
          status: string
          subtotal: number
          tax_amount: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          bill_date?: string
          bill_number: string
          created_at?: string
          discount_amount?: number
          due_date?: string | null
          id?: string
          notes?: string | null
          paid_amount?: number
          patient_id: string
          payment_method?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          bill_date?: string
          bill_number?: string
          created_at?: string
          discount_amount?: number
          due_date?: string | null
          id?: string
          notes?: string | null
          paid_amount?: number
          patient_id?: string
          payment_method?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_bills_patient"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_test_orders: {
        Row: {
          clinical_history: string | null
          created_at: string
          doctor_id: string
          id: string
          notes: string | null
          order_code: string
          order_date: string
          patient_id: string
          priority: string
          status: string
          updated_at: string
        }
        Insert: {
          clinical_history?: string | null
          created_at?: string
          doctor_id: string
          id?: string
          notes?: string | null
          order_code: string
          order_date?: string
          patient_id: string
          priority?: string
          status?: string
          updated_at?: string
        }
        Update: {
          clinical_history?: string | null
          created_at?: string
          doctor_id?: string
          id?: string
          notes?: string | null
          order_code?: string
          order_date?: string
          patient_id?: string
          priority?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_lab_test_orders_doctor"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_lab_test_orders_patient"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_test_results: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          order_id: string
          reference_range: string | null
          result_date: string
          result_status: string
          result_value: string | null
          technician_id: string | null
          test_id: string
          unit: string | null
          updated_at: string
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          order_id: string
          reference_range?: string | null
          result_date?: string
          result_status?: string
          result_value?: string | null
          technician_id?: string | null
          test_id: string
          unit?: string | null
          updated_at?: string
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string
          reference_range?: string | null
          result_date?: string
          result_status?: string
          result_value?: string | null
          technician_id?: string | null
          test_id?: string
          unit?: string | null
          updated_at?: string
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_lab_test_results_order"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "lab_test_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_lab_test_results_technician"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_lab_test_results_test"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "laboratory_tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_lab_test_results_verifier"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      laboratory_tests: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          normal_range: string | null
          price: number | null
          sample_type: string
          test_category: string
          test_code: string
          test_name: string
          unit: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          normal_range?: string | null
          price?: number | null
          sample_type: string
          test_category: string
          test_code: string
          test_name: string
          unit?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          normal_range?: string | null
          price?: number | null
          sample_type?: string
          test_category?: string
          test_code?: string
          test_name?: string
          unit?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      medical_records: {
        Row: {
          attachments: string[] | null
          chief_complaint: string | null
          created_at: string
          diagnosis: string | null
          doctor_id: string
          history_of_present_illness: string | null
          id: string
          medications: string | null
          notes: string | null
          patient_id: string
          physical_examination: string | null
          record_date: string
          record_type: string
          treatment: string | null
          updated_at: string
          visit_id: string | null
          vital_signs: Json | null
        }
        Insert: {
          attachments?: string[] | null
          chief_complaint?: string | null
          created_at?: string
          diagnosis?: string | null
          doctor_id: string
          history_of_present_illness?: string | null
          id?: string
          medications?: string | null
          notes?: string | null
          patient_id: string
          physical_examination?: string | null
          record_date?: string
          record_type: string
          treatment?: string | null
          updated_at?: string
          visit_id?: string | null
          vital_signs?: Json | null
        }
        Update: {
          attachments?: string[] | null
          chief_complaint?: string | null
          created_at?: string
          diagnosis?: string | null
          doctor_id?: string
          history_of_present_illness?: string | null
          id?: string
          medications?: string | null
          notes?: string | null
          patient_id?: string
          physical_examination?: string | null
          record_date?: string
          record_type?: string
          treatment?: string | null
          updated_at?: string
          visit_id?: string | null
          vital_signs?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_medical_records_doctor"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_medical_records_patient"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_medical_records_visit"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "opd_visits"
            referencedColumns: ["id"]
          },
        ]
      }
      medicine_stock: {
        Row: {
          batch_number: string
          created_at: string
          expiry_date: string
          id: string
          medicine_id: string
          purchase_date: string | null
          purchase_price: number | null
          quantity_in_stock: number
          status: string
          supplier: string | null
          updated_at: string
        }
        Insert: {
          batch_number: string
          created_at?: string
          expiry_date: string
          id?: string
          medicine_id: string
          purchase_date?: string | null
          purchase_price?: number | null
          quantity_in_stock?: number
          status?: string
          supplier?: string | null
          updated_at?: string
        }
        Update: {
          batch_number?: string
          created_at?: string
          expiry_date?: string
          id?: string
          medicine_id?: string
          purchase_date?: string | null
          purchase_price?: number | null
          quantity_in_stock?: number
          status?: string
          supplier?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_medicine_stock_medicine"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
        ]
      }
      medicines: {
        Row: {
          category: string
          contraindications: string | null
          created_at: string
          description: string | null
          dosage_form: string
          generic_name: string | null
          id: string
          is_active: boolean
          manufacturer: string | null
          medicine_code: string
          medicine_name: string
          reorder_level: number
          side_effects: string | null
          strength: string | null
          unit_price: number
          updated_at: string
        }
        Insert: {
          category: string
          contraindications?: string | null
          created_at?: string
          description?: string | null
          dosage_form: string
          generic_name?: string | null
          id?: string
          is_active?: boolean
          manufacturer?: string | null
          medicine_code: string
          medicine_name: string
          reorder_level?: number
          side_effects?: string | null
          strength?: string | null
          unit_price: number
          updated_at?: string
        }
        Update: {
          category?: string
          contraindications?: string | null
          created_at?: string
          description?: string | null
          dosage_form?: string
          generic_name?: string | null
          id?: string
          is_active?: boolean
          manufacturer?: string | null
          medicine_code?: string
          medicine_name?: string
          reorder_level?: number
          side_effects?: string | null
          strength?: string | null
          unit_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      opd_visits: {
        Row: {
          chief_complaint: string
          created_at: string
          diagnosis: string | null
          doctor_id: string
          follow_up_date: string | null
          id: string
          patient_id: string
          status: string
          symptoms: string | null
          treatment_plan: string | null
          updated_at: string
          visit_code: string
          visit_date: string
          visit_type: string
        }
        Insert: {
          chief_complaint: string
          created_at?: string
          diagnosis?: string | null
          doctor_id: string
          follow_up_date?: string | null
          id?: string
          patient_id: string
          status?: string
          symptoms?: string | null
          treatment_plan?: string | null
          updated_at?: string
          visit_code: string
          visit_date?: string
          visit_type?: string
        }
        Update: {
          chief_complaint?: string
          created_at?: string
          diagnosis?: string | null
          doctor_id?: string
          follow_up_date?: string | null
          id?: string
          patient_id?: string
          status?: string
          symptoms?: string | null
          treatment_plan?: string | null
          updated_at?: string
          visit_code?: string
          visit_date?: string
          visit_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_opd_visits_doctor"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_opd_visits_patient"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: string | null
          allergies: string | null
          blood_type: string | null
          city: string | null
          created_at: string
          date_of_birth: string
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string
          gender: string
          id: string
          last_name: string
          medical_history: string | null
          patient_code: string
          phone: string | null
          state: string | null
          status: string
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          allergies?: string | null
          blood_type?: string | null
          city?: string | null
          created_at?: string
          date_of_birth: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name: string
          gender: string
          id?: string
          last_name: string
          medical_history?: string | null
          patient_code: string
          phone?: string | null
          state?: string | null
          status?: string
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          allergies?: string | null
          blood_type?: string | null
          city?: string | null
          created_at?: string
          date_of_birth?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string
          gender?: string
          id?: string
          last_name?: string
          medical_history?: string | null
          patient_code?: string
          phone?: string | null
          state?: string | null
          status?: string
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      prescription_items: {
        Row: {
          created_at: string
          dosage: string
          duration: string
          frequency: string
          id: string
          instructions: string | null
          medicine_id: string
          prescription_id: string
          quantity: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          dosage: string
          duration: string
          frequency: string
          id?: string
          instructions?: string | null
          medicine_id: string
          prescription_id: string
          quantity: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          dosage?: string
          duration?: string
          frequency?: string
          id?: string
          instructions?: string | null
          medicine_id?: string
          prescription_id?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_prescription_items_medicine"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_prescription_items_prescription"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          created_at: string
          doctor_id: string
          id: string
          notes: string | null
          patient_id: string
          prescription_code: string
          prescription_date: string
          status: string
          updated_at: string
          visit_id: string | null
        }
        Insert: {
          created_at?: string
          doctor_id: string
          id?: string
          notes?: string | null
          patient_id: string
          prescription_code: string
          prescription_date?: string
          status?: string
          updated_at?: string
          visit_id?: string | null
        }
        Update: {
          created_at?: string
          doctor_id?: string
          id?: string
          notes?: string | null
          patient_id?: string
          prescription_code?: string
          prescription_date?: string
          status?: string
          updated_at?: string
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_prescriptions_doctor"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_prescriptions_patient"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_prescriptions_visit"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "opd_visits"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          area: string
          created_at: string
          full_name: string
          id: string
          registration_number: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          area: string
          created_at?: string
          full_name: string
          id?: string
          registration_number: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          area?: string
          created_at?: string
          full_name?: string
          id?: string
          registration_number?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      staff: {
        Row: {
          created_at: string
          email: string | null
          first_name: string
          hire_date: string
          id: string
          last_name: string
          phone: string | null
          role: string
          specialization: string | null
          staff_code: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name: string
          hire_date: string
          id?: string
          last_name: string
          phone?: string | null
          role: string
          specialization?: string | null
          staff_code: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string
          hire_date?: string
          id?: string
          last_name?: string
          phone?: string | null
          role?: string
          specialization?: string | null
          staff_code?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wards: {
        Row: {
          capacity: number
          created_at: string
          current_occupancy: number
          description: string | null
          id: string
          name: string
          status: string
          type: string
          updated_at: string
          ward_code: string
        }
        Insert: {
          capacity: number
          created_at?: string
          current_occupancy?: number
          description?: string | null
          id?: string
          name: string
          status?: string
          type: string
          updated_at?: string
          ward_code: string
        }
        Update: {
          capacity?: number
          created_at?: string
          current_occupancy?: number
          description?: string | null
          id?: string
          name?: string
          status?: string
          type?: string
          updated_at?: string
          ward_code?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "doctor" | "nurse" | "staff" | "receptionist"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "doctor", "nurse", "staff", "receptionist"],
    },
  },
} as const
