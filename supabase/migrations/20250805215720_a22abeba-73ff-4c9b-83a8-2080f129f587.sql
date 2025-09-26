-- Create OPD Visits table for outpatient visits
CREATE TABLE public.opd_visits (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL,
    doctor_id UUID NOT NULL,
    visit_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    visit_code TEXT NOT NULL UNIQUE,
    chief_complaint TEXT NOT NULL,
    symptoms TEXT,
    diagnosis TEXT,
    treatment_plan TEXT,
    follow_up_date DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    visit_type TEXT NOT NULL DEFAULT 'consultation' CHECK (visit_type IN ('consultation', 'follow_up', 'emergency', 'routine')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Medical Records table
CREATE TABLE public.medical_records (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL,
    doctor_id UUID NOT NULL,
    visit_id UUID,
    record_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    record_type TEXT NOT NULL CHECK (record_type IN ('consultation', 'examination', 'procedure', 'surgery', 'discharge')),
    chief_complaint TEXT,
    history_of_present_illness TEXT,
    physical_examination TEXT,
    diagnosis TEXT,
    treatment TEXT,
    medications TEXT,
    notes TEXT,
    vital_signs JSONB,
    attachments TEXT[],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Laboratory Tests table
CREATE TABLE public.laboratory_tests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    test_code TEXT NOT NULL UNIQUE,
    test_name TEXT NOT NULL,
    test_category TEXT NOT NULL,
    description TEXT,
    normal_range TEXT,
    unit TEXT,
    sample_type TEXT NOT NULL CHECK (sample_type IN ('blood', 'urine', 'stool', 'sputum', 'other')),
    price DECIMAL(10,2),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Lab Test Orders table
CREATE TABLE public.lab_test_orders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL,
    doctor_id UUID NOT NULL,
    order_code TEXT NOT NULL UNIQUE,
    order_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('urgent', 'normal', 'routine')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'collected', 'processing', 'completed', 'cancelled')),
    clinical_history TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Lab Test Results table
CREATE TABLE public.lab_test_results (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL,
    test_id UUID NOT NULL,
    result_value TEXT,
    result_status TEXT NOT NULL DEFAULT 'normal' CHECK (result_status IN ('normal', 'abnormal', 'critical')),
    reference_range TEXT,
    unit TEXT,
    technician_id UUID,
    verified_by UUID,
    result_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Medicines table
CREATE TABLE public.medicines (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    medicine_code TEXT NOT NULL UNIQUE,
    medicine_name TEXT NOT NULL,
    generic_name TEXT,
    strength TEXT,
    dosage_form TEXT NOT NULL CHECK (dosage_form IN ('tablet', 'capsule', 'syrup', 'injection', 'cream', 'drops', 'other')),
    manufacturer TEXT,
    category TEXT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    reorder_level INTEGER NOT NULL DEFAULT 10,
    is_active BOOLEAN NOT NULL DEFAULT true,
    description TEXT,
    side_effects TEXT,
    contraindications TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Medicine Stock table
CREATE TABLE public.medicine_stock (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    medicine_id UUID NOT NULL,
    batch_number TEXT NOT NULL,
    quantity_in_stock INTEGER NOT NULL DEFAULT 0,
    expiry_date DATE NOT NULL,
    supplier TEXT,
    purchase_date DATE,
    purchase_price DECIMAL(10,2),
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'expired', 'recalled')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Prescriptions table
CREATE TABLE public.prescriptions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL,
    doctor_id UUID NOT NULL,
    visit_id UUID,
    prescription_code TEXT NOT NULL UNIQUE,
    prescription_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'dispensed', 'cancelled', 'expired')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Prescription Items table
CREATE TABLE public.prescription_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    prescription_id UUID NOT NULL,
    medicine_id UUID NOT NULL,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    duration TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Billing Categories table
CREATE TABLE public.billing_categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    category_code TEXT NOT NULL UNIQUE,
    category_name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Billing Items table
CREATE TABLE public.billing_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    item_code TEXT NOT NULL UNIQUE,
    item_name TEXT NOT NULL,
    category_id UUID NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Bills table
CREATE TABLE public.bills (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL,
    bill_number TEXT NOT NULL UNIQUE,
    bill_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    due_date DATE,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue', 'cancelled')),
    payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'insurance', 'bank_transfer')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Bill Details table
CREATE TABLE public.bill_details (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    bill_id UUID NOT NULL,
    item_id UUID NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Admissions table
CREATE TABLE public.admissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL,
    doctor_id UUID NOT NULL,
    bed_id UUID,
    admission_code TEXT NOT NULL UNIQUE,
    admission_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    admission_type TEXT NOT NULL CHECK (admission_type IN ('emergency', 'elective', 'transfer', 'observation')),
    reason_for_admission TEXT NOT NULL,
    diagnosis TEXT,
    treatment_plan TEXT,
    discharge_date TIMESTAMP WITH TIME ZONE,
    discharge_summary TEXT,
    status TEXT NOT NULL DEFAULT 'admitted' CHECK (status IN ('admitted', 'discharged', 'transferred', 'deceased')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Foreign Key Constraints
ALTER TABLE public.opd_visits ADD CONSTRAINT fk_opd_visits_patient FOREIGN KEY (patient_id) REFERENCES public.patients(id);
ALTER TABLE public.opd_visits ADD CONSTRAINT fk_opd_visits_doctor FOREIGN KEY (doctor_id) REFERENCES public.staff(id);

ALTER TABLE public.medical_records ADD CONSTRAINT fk_medical_records_patient FOREIGN KEY (patient_id) REFERENCES public.patients(id);
ALTER TABLE public.medical_records ADD CONSTRAINT fk_medical_records_doctor FOREIGN KEY (doctor_id) REFERENCES public.staff(id);
ALTER TABLE public.medical_records ADD CONSTRAINT fk_medical_records_visit FOREIGN KEY (visit_id) REFERENCES public.opd_visits(id);

ALTER TABLE public.lab_test_orders ADD CONSTRAINT fk_lab_test_orders_patient FOREIGN KEY (patient_id) REFERENCES public.patients(id);
ALTER TABLE public.lab_test_orders ADD CONSTRAINT fk_lab_test_orders_doctor FOREIGN KEY (doctor_id) REFERENCES public.staff(id);

ALTER TABLE public.lab_test_results ADD CONSTRAINT fk_lab_test_results_order FOREIGN KEY (order_id) REFERENCES public.lab_test_orders(id);
ALTER TABLE public.lab_test_results ADD CONSTRAINT fk_lab_test_results_test FOREIGN KEY (test_id) REFERENCES public.laboratory_tests(id);
ALTER TABLE public.lab_test_results ADD CONSTRAINT fk_lab_test_results_technician FOREIGN KEY (technician_id) REFERENCES public.staff(id);
ALTER TABLE public.lab_test_results ADD CONSTRAINT fk_lab_test_results_verifier FOREIGN KEY (verified_by) REFERENCES public.staff(id);

ALTER TABLE public.medicine_stock ADD CONSTRAINT fk_medicine_stock_medicine FOREIGN KEY (medicine_id) REFERENCES public.medicines(id);

ALTER TABLE public.prescriptions ADD CONSTRAINT fk_prescriptions_patient FOREIGN KEY (patient_id) REFERENCES public.patients(id);
ALTER TABLE public.prescriptions ADD CONSTRAINT fk_prescriptions_doctor FOREIGN KEY (doctor_id) REFERENCES public.staff(id);
ALTER TABLE public.prescriptions ADD CONSTRAINT fk_prescriptions_visit FOREIGN KEY (visit_id) REFERENCES public.opd_visits(id);

ALTER TABLE public.prescription_items ADD CONSTRAINT fk_prescription_items_prescription FOREIGN KEY (prescription_id) REFERENCES public.prescriptions(id);
ALTER TABLE public.prescription_items ADD CONSTRAINT fk_prescription_items_medicine FOREIGN KEY (medicine_id) REFERENCES public.medicines(id);

ALTER TABLE public.billing_items ADD CONSTRAINT fk_billing_items_category FOREIGN KEY (category_id) REFERENCES public.billing_categories(id);

ALTER TABLE public.bills ADD CONSTRAINT fk_bills_patient FOREIGN KEY (patient_id) REFERENCES public.patients(id);

ALTER TABLE public.bill_details ADD CONSTRAINT fk_bill_details_bill FOREIGN KEY (bill_id) REFERENCES public.bills(id);
ALTER TABLE public.bill_details ADD CONSTRAINT fk_bill_details_item FOREIGN KEY (item_id) REFERENCES public.billing_items(id);

ALTER TABLE public.admissions ADD CONSTRAINT fk_admissions_patient FOREIGN KEY (patient_id) REFERENCES public.patients(id);
ALTER TABLE public.admissions ADD CONSTRAINT fk_admissions_doctor FOREIGN KEY (doctor_id) REFERENCES public.staff(id);
ALTER TABLE public.admissions ADD CONSTRAINT fk_admissions_bed FOREIGN KEY (bed_id) REFERENCES public.beds(id);

-- Enable Row Level Security
ALTER TABLE public.opd_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laboratory_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_test_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicine_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admissions ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies (allowing all operations for now - to be refined later with authentication)
CREATE POLICY "Allow all operations on opd_visits" ON public.opd_visits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on medical_records" ON public.medical_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on laboratory_tests" ON public.laboratory_tests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on lab_test_orders" ON public.lab_test_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on lab_test_results" ON public.lab_test_results FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on medicines" ON public.medicines FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on medicine_stock" ON public.medicine_stock FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on prescriptions" ON public.prescriptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on prescription_items" ON public.prescription_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on billing_categories" ON public.billing_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on billing_items" ON public.billing_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on bills" ON public.bills FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on bill_details" ON public.bill_details FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on admissions" ON public.admissions FOR ALL USING (true) WITH CHECK (true);

-- Create triggers for updated_at columns
CREATE TRIGGER update_opd_visits_updated_at BEFORE UPDATE ON public.opd_visits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_medical_records_updated_at BEFORE UPDATE ON public.medical_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_laboratory_tests_updated_at BEFORE UPDATE ON public.laboratory_tests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lab_test_orders_updated_at BEFORE UPDATE ON public.lab_test_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lab_test_results_updated_at BEFORE UPDATE ON public.lab_test_results FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_medicines_updated_at BEFORE UPDATE ON public.medicines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_medicine_stock_updated_at BEFORE UPDATE ON public.medicine_stock FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON public.prescriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_billing_categories_updated_at BEFORE UPDATE ON public.billing_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_billing_items_updated_at BEFORE UPDATE ON public.billing_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON public.bills FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_admissions_updated_at BEFORE UPDATE ON public.admissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create Performance Indexes
CREATE INDEX idx_opd_visits_patient_id ON public.opd_visits(patient_id);
CREATE INDEX idx_opd_visits_doctor_id ON public.opd_visits(doctor_id);
CREATE INDEX idx_opd_visits_visit_date ON public.opd_visits(visit_date);
CREATE INDEX idx_opd_visits_status ON public.opd_visits(status);

CREATE INDEX idx_medical_records_patient_id ON public.medical_records(patient_id);
CREATE INDEX idx_medical_records_doctor_id ON public.medical_records(doctor_id);
CREATE INDEX idx_medical_records_visit_id ON public.medical_records(visit_id);
CREATE INDEX idx_medical_records_record_date ON public.medical_records(record_date);

CREATE INDEX idx_lab_test_orders_patient_id ON public.lab_test_orders(patient_id);
CREATE INDEX idx_lab_test_orders_doctor_id ON public.lab_test_orders(doctor_id);
CREATE INDEX idx_lab_test_orders_order_date ON public.lab_test_orders(order_date);
CREATE INDEX idx_lab_test_orders_status ON public.lab_test_orders(status);

CREATE INDEX idx_lab_test_results_order_id ON public.lab_test_results(order_id);
CREATE INDEX idx_lab_test_results_test_id ON public.lab_test_results(test_id);
CREATE INDEX idx_lab_test_results_result_date ON public.lab_test_results(result_date);

CREATE INDEX idx_medicine_stock_medicine_id ON public.medicine_stock(medicine_id);
CREATE INDEX idx_medicine_stock_expiry_date ON public.medicine_stock(expiry_date);
CREATE INDEX idx_medicine_stock_status ON public.medicine_stock(status);

CREATE INDEX idx_prescriptions_patient_id ON public.prescriptions(patient_id);
CREATE INDEX idx_prescriptions_doctor_id ON public.prescriptions(doctor_id);
CREATE INDEX idx_prescriptions_visit_id ON public.prescriptions(visit_id);
CREATE INDEX idx_prescriptions_prescription_date ON public.prescriptions(prescription_date);

CREATE INDEX idx_prescription_items_prescription_id ON public.prescription_items(prescription_id);
CREATE INDEX idx_prescription_items_medicine_id ON public.prescription_items(medicine_id);

CREATE INDEX idx_bills_patient_id ON public.bills(patient_id);
CREATE INDEX idx_bills_bill_date ON public.bills(bill_date);
CREATE INDEX idx_bills_status ON public.bills(status);

CREATE INDEX idx_bill_details_bill_id ON public.bill_details(bill_id);
CREATE INDEX idx_bill_details_item_id ON public.bill_details(item_id);

CREATE INDEX idx_admissions_patient_id ON public.admissions(patient_id);
CREATE INDEX idx_admissions_doctor_id ON public.admissions(doctor_id);
CREATE INDEX idx_admissions_bed_id ON public.admissions(bed_id);
CREATE INDEX idx_admissions_admission_date ON public.admissions(admission_date);
CREATE INDEX idx_admissions_status ON public.admissions(status);