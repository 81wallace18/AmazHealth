-- PHASE 1: EMERGENCY SECURITY LOCKDOWN
-- This migration implements critical security fixes to protect sensitive healthcare data

-- 1. CREATE ROLE SYSTEM
-- Create app role enum for role-based access control
CREATE TYPE public.app_role AS ENUM ('admin', 'doctor', 'nurse', 'staff', 'receptionist');

-- Create user roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role public.app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- Create function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS public.app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role 
  FROM public.user_roles 
  WHERE user_id = auth.uid() 
  LIMIT 1;
$$;

-- 2. FIX EXISTING FUNCTIONS (search_path vulnerability)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 3. DROP ALL EXISTING PERMISSIVE POLICIES
-- Patients table
DROP POLICY IF EXISTS "Allow all operations on patients" ON public.patients;

-- Medical records table  
DROP POLICY IF EXISTS "Allow all operations on medical_records" ON public.medical_records;

-- Prescriptions table
DROP POLICY IF EXISTS "Allow all operations on prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Allow all operations on prescription_items" ON public.prescription_items;

-- Laboratory tables
DROP POLICY IF EXISTS "Allow all operations on laboratory_tests" ON public.laboratory_tests;
DROP POLICY IF EXISTS "Allow all operations on lab_test_orders" ON public.lab_test_orders;
DROP POLICY IF EXISTS "Allow all operations on lab_test_results" ON public.lab_test_results;

-- Hospital management tables
DROP POLICY IF EXISTS "Allow all operations on admissions" ON public.admissions;
DROP POLICY IF EXISTS "Allow all operations on appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow all operations on beds" ON public.beds;
DROP POLICY IF EXISTS "Allow all operations on wards" ON public.wards;

-- Billing tables
DROP POLICY IF EXISTS "Allow all operations on bills" ON public.bills;
DROP POLICY IF EXISTS "Allow all operations on bill_details" ON public.bill_details;
DROP POLICY IF EXISTS "Allow all operations on billing_categories" ON public.billing_categories;
DROP POLICY IF EXISTS "Allow all operations on billing_items" ON public.billing_items;

-- Pharmacy tables
DROP POLICY IF EXISTS "Allow all operations on medicines" ON public.medicines;
DROP POLICY IF EXISTS "Allow all operations on medicine_stock" ON public.medicine_stock;

-- OPD and Staff tables
DROP POLICY IF EXISTS "Allow all operations on opd_visits" ON public.opd_visits;
DROP POLICY IF EXISTS "Allow all operations on staff" ON public.staff;

-- 4. CREATE SECURE POLICIES FOR SENSITIVE DATA TABLES

-- PATIENTS TABLE POLICIES
CREATE POLICY "Authenticated users can view patients"
ON public.patients FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create patients"
ON public.patients FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update patients"
ON public.patients FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Only admins can delete patients"
ON public.patients FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- MEDICAL RECORDS POLICIES (Most Sensitive)
CREATE POLICY "Medical staff can view medical records"
ON public.medical_records FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'doctor') OR 
  public.has_role(auth.uid(), 'nurse')
);

CREATE POLICY "Medical staff can create medical records"
ON public.medical_records FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'doctor') OR 
  public.has_role(auth.uid(), 'nurse')
);

CREATE POLICY "Medical staff can update medical records"
ON public.medical_records FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'doctor') OR 
  public.has_role(auth.uid(), 'nurse')
);

CREATE POLICY "Only admins can delete medical records"
ON public.medical_records FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- PRESCRIPTIONS POLICIES
CREATE POLICY "Medical staff can view prescriptions"
ON public.prescriptions FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'doctor') OR 
  public.has_role(auth.uid(), 'nurse')
);

CREATE POLICY "Doctors can create prescriptions"
ON public.prescriptions FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'doctor')
);

CREATE POLICY "Doctors can update prescriptions"
ON public.prescriptions FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'doctor')
);

CREATE POLICY "Only admins can delete prescriptions"
ON public.prescriptions FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- PRESCRIPTION ITEMS POLICIES
CREATE POLICY "Medical staff can view prescription items"
ON public.prescription_items FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'doctor') OR 
  public.has_role(auth.uid(), 'nurse')
);

CREATE POLICY "Doctors can manage prescription items"
ON public.prescription_items FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'doctor')
);

-- ADMISSIONS POLICIES
CREATE POLICY "Authenticated users can view admissions"
ON public.admissions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Medical staff can create admissions"
ON public.admissions FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'doctor') OR 
  public.has_role(auth.uid(), 'nurse')
);

CREATE POLICY "Medical staff can update admissions"
ON public.admissions FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'doctor') OR 
  public.has_role(auth.uid(), 'nurse')
);

CREATE POLICY "Only admins can delete admissions"
ON public.admissions FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- APPOINTMENTS POLICIES
CREATE POLICY "Authenticated users can view appointments"
ON public.appointments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create appointments"
ON public.appointments FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Medical staff can update appointments"
ON public.appointments FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'doctor') OR 
  public.has_role(auth.uid(), 'nurse') OR
  public.has_role(auth.uid(), 'receptionist')
);

CREATE POLICY "Only admins can delete appointments"
ON public.appointments FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- LAB TEST ORDERS POLICIES
CREATE POLICY "Medical staff can view lab orders"
ON public.lab_test_orders FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'doctor') OR 
  public.has_role(auth.uid(), 'nurse')
);

CREATE POLICY "Doctors can create lab orders"
ON public.lab_test_orders FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'doctor')
);

CREATE POLICY "Medical staff can update lab orders"
ON public.lab_test_orders FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'doctor') OR 
  public.has_role(auth.uid(), 'nurse')
);

CREATE POLICY "Only admins can delete lab orders"
ON public.lab_test_orders FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- LAB TEST RESULTS POLICIES (Highly Sensitive)
CREATE POLICY "Medical staff can view lab results"
ON public.lab_test_results FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'doctor') OR 
  public.has_role(auth.uid(), 'nurse')
);

CREATE POLICY "Lab staff can create results"
ON public.lab_test_results FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'staff')
);

CREATE POLICY "Lab staff can update results"
ON public.lab_test_results FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'staff')
);

CREATE POLICY "Only admins can delete lab results"
ON public.lab_test_results FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- BILLING POLICIES
CREATE POLICY "Staff can view bills"
ON public.bills FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'staff') OR
  public.has_role(auth.uid(), 'receptionist')
);

CREATE POLICY "Staff can create bills"
ON public.bills FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'staff') OR
  public.has_role(auth.uid(), 'receptionist')
);

CREATE POLICY "Staff can update bills"
ON public.bills FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'staff') OR
  public.has_role(auth.uid(), 'receptionist')
);

CREATE POLICY "Only admins can delete bills"
ON public.bills FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- BILL DETAILS POLICIES
CREATE POLICY "Staff can view bill details"
ON public.bill_details FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'staff') OR
  public.has_role(auth.uid(), 'receptionist')
);

CREATE POLICY "Staff can manage bill details"
ON public.bill_details FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'staff') OR
  public.has_role(auth.uid(), 'receptionist')
);

-- OPD VISITS POLICIES
CREATE POLICY "Medical staff can view opd visits"
ON public.opd_visits FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'doctor') OR 
  public.has_role(auth.uid(), 'nurse')
);

CREATE POLICY "Medical staff can create opd visits"
ON public.opd_visits FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'doctor') OR 
  public.has_role(auth.uid(), 'nurse')
);

CREATE POLICY "Medical staff can update opd visits"
ON public.opd_visits FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'doctor') OR 
  public.has_role(auth.uid(), 'nurse')
);

CREATE POLICY "Only admins can delete opd visits"
ON public.opd_visits FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 5. CATALOG/CONFIGURATION TABLES (Admin-only writes)

-- LABORATORY TESTS (Read for all authenticated, write for admins)
CREATE POLICY "Authenticated users can view lab tests"
ON public.laboratory_tests FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can manage lab tests"
ON public.laboratory_tests FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update lab tests"
ON public.laboratory_tests FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete lab tests"
ON public.laboratory_tests FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- MEDICINES (Read for all authenticated, write for admins)
CREATE POLICY "Authenticated users can view medicines"
ON public.medicines FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can manage medicines"
ON public.medicines FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update medicines"
ON public.medicines FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete medicines"
ON public.medicines FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- MEDICINE STOCK
CREATE POLICY "Staff can view medicine stock"
ON public.medicine_stock FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'staff')
);

CREATE POLICY "Only admins can manage medicine stock"
ON public.medicine_stock FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- BILLING CATEGORIES
CREATE POLICY "Authenticated users can view billing categories"
ON public.billing_categories FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can manage billing categories"
ON public.billing_categories FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- BILLING ITEMS
CREATE POLICY "Authenticated users can view billing items"
ON public.billing_items FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can manage billing items"
ON public.billing_items FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- WARDS
CREATE POLICY "Authenticated users can view wards"
ON public.wards FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can manage wards"
ON public.wards FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- BEDS
CREATE POLICY "Authenticated users can view beds"
ON public.beds FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Medical staff can update beds"
ON public.beds FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'doctor') OR 
  public.has_role(auth.uid(), 'nurse')
);

CREATE POLICY "Only admins can create/delete beds"
ON public.beds FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete beds"
ON public.beds FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- STAFF TABLE
CREATE POLICY "Authenticated users can view staff"
ON public.staff FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can manage staff"
ON public.staff FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- USER ROLES POLICIES
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 6. ADD UPDATED_AT TRIGGERS FOR AUDIT TRAIL
CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 7. INSERT DEFAULT ADMIN USER ROLE
-- This will allow the first authenticated user to have admin access
-- Replace with actual user ID after first login
INSERT INTO public.user_roles (user_id, role, created_by) 
VALUES (
  '00000000-0000-0000-0000-000000000000', -- Placeholder - update after first user registers
  'admin',
  '00000000-0000-0000-0000-000000000000'
) ON CONFLICT (user_id, role) DO NOTHING;