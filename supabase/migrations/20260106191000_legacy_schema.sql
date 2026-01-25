-- Legacy Schema Migration (Converted from SQL Server to PostgreSQL)

-- Table: Treatment2
CREATE TABLE IF NOT EXISTS public.treatment2 (
    serial_no SERIAL PRIMARY KEY,
    emp_no CHAR(10) NOT NULL,
    emp_name VARCHAR(50),
    phone_no CHAR(11),
    age CHAR(10),
    patient CHAR(10),
    patient_name VARCHAR(50),
    treatment CHAR(10),
    medicine1 VARCHAR(50),
    medicine2 VARCHAR(50),
    medicine3 VARCHAR(50),
    medicine4 VARCHAR(50),
    medicine5 VARCHAR(50),
    medicine6 VARCHAR(50),
    medicine7 VARCHAR(50),
    medicine8 VARCHAR(50),
    medicine9 VARCHAR(50),
    medicine10 VARCHAR(50),
    price1 DECIMAL(18, 2),
    price2 DECIMAL(18, 2),
    price3 DECIMAL(18, 2),
    price4 DECIMAL(18, 2),
    price5 DECIMAL(18, 2),
    price6 DECIMAL(18, 2),
    price7 DECIMAL(18, 2),
    price8 DECIMAL(18, 2),
    price9 DECIMAL(18, 2),
    price10 DECIMAL(18, 2),
    lab_name VARCHAR(50),
    lab_description TEXT,
    hospital_name VARCHAR(50),
    hospital_description TEXT,
    visit_date TIMESTAMP,
    hospital_date TIMESTAMP,
    hospital_amount DECIMAL(18, 2),
    lab_date TIMESTAMP,
    lab_amount DECIMAL(18, 2),
    medicine_date TIMESTAMP,
    medicine_amount DECIMAL(18, 2),
    qr_code BYTEA,
    store VARCHAR(50),
    book_no CHAR(10),
    patient_nic CHAR(15),
    allow_month CHAR(10),
    cycle_no CHAR(10),
    invoice CHAR(15),
    opd_ipd CHAR(10),
    reference VARCHAR(50),
    item1 VARCHAR(50),
    item2 VARCHAR(50),
    item3 VARCHAR(50),
    item4 VARCHAR(50),
    item5 VARCHAR(50),
    item6 VARCHAR(50),
    item7 VARCHAR(50),
    vendor CHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: Treatment22 (Alternative/Legacy)
CREATE TABLE IF NOT EXISTS public.treatment22 (
    serial_no SERIAL PRIMARY KEY,
    emp_no CHAR(10) NOT NULL,
    emp_name VARCHAR(50),
    phone_no CHAR(11),
    age CHAR(10),
    patient CHAR(10),
    patient_name VARCHAR(50),
    treatment CHAR(10),
    medicine1 VARCHAR(50),
    medicine2 VARCHAR(50),
    medicine3 VARCHAR(50),
    medicine4 VARCHAR(50),
    medicine5 VARCHAR(50),
    medicine6 VARCHAR(50),
    medicine7 VARCHAR(50),
    price1 DECIMAL(18, 2),
    price2 DECIMAL(18, 2),
    price3 DECIMAL(18, 2),
    price4 DECIMAL(18, 2),
    price5 DECIMAL(18, 2),
    price6 DECIMAL(18, 2),
    price7 DECIMAL(18, 2),
    lab_name VARCHAR(50),
    lab_description TEXT,
    hospital_name VARCHAR(50),
    hospital_description TEXT,
    visit_date TIMESTAMP,
    hospital_date TIMESTAMP,
    hospital_amount DECIMAL(18, 2),
    lab_date TIMESTAMP,
    lab_amount DECIMAL(18, 2),
    medicine_date TIMESTAMP,
    medicine_amount DECIMAL(18, 2),
    qr_code BYTEA,
    store TEXT,
    patient_nic TEXT,
    book_no TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.treatment2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment22 ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view data
CREATE POLICY "Users can view treatment data" ON public.treatment2 FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can view treatment22 data" ON public.treatment22 FOR SELECT TO authenticated USING (true);

-- Allow admins full access
CREATE POLICY "Admins have full access to treatment2" ON public.treatment2 FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins have full access to treatment22" ON public.treatment22 FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
