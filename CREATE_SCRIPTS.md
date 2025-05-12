# All Create Table Statements Below are Generated via 'Create Script' in pgAdmin 4:


## Users Table
```
CREATE TABLE IF NOT EXISTS public.users
(
    user_id integer NOT NULL DEFAULT nextval('users_user_id_seq'::regclass),
    username character varying(100) COLLATE pg_catalog."default" NOT NULL,
    password_hash text COLLATE pg_catalog."default" NOT NULL,
    full_name character varying(255) COLLATE pg_catalog."default" NOT NULL,
    email character varying(255) COLLATE pg_catalog."default" NOT NULL,
    role character varying(20) COLLATE pg_catalog."default" NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_pkey PRIMARY KEY (user_id),
    CONSTRAINT users_email_key UNIQUE (email),
    CONSTRAINT users_username_key UNIQUE (username)
);
```
## Doctor-Patient Table
```
CREATE TABLE IF NOT EXISTS public.doctor_patient (
    doctor_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    patient_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    PRIMARY KEY (doctor_id, patient_id)
);
```

## Appointment Table
```
CREATE TABLE IF NOT EXISTS public.appointments
(
    appointment_id integer NOT NULL DEFAULT nextval('appointments_appointment_id_seq'::regclass),
    patient_id integer,
    clinician_id integer,
    appointment_datetime timestamp without time zone NOT NULL,
    location text COLLATE pg_catalog."default",
    reason text COLLATE pg_catalog."default",
    status character varying(20) COLLATE pg_catalog."default" NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT appointments_pkey PRIMARY KEY (appointment_id),
    CONSTRAINT appointments_clinician_id_fkey FOREIGN KEY (clinician_id)
        REFERENCES public.users (user_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT appointments_patient_id_fkey FOREIGN KEY (patient_id)
        REFERENCES public.users (user_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT appointments_status_check CHECK (status::text = ANY (ARRAY['scheduled'::character varying, 'cancelled'::character varying, 'completed'::character varying]::text[]))
);
```

## Email Reminder Table
```
CREATE TABLE IF NOT EXISTS public.email_reminders (
    reminder_id SERIAL PRIMARY KEY,
    appointment_id INT REFERENCES appointments(appointment_id) ON DELETE CASCADE,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    email_content TEXT
);
```

## Medical Records Table
```
CREATE TABLE IF NOT EXISTS public.medical_records
(
    record_id integer NOT NULL DEFAULT nextval('medical_records_record_id_seq'::regclass),
    patient_id integer,
    record_type character varying(50) COLLATE pg_catalog."default",
    description text COLLATE pg_catalog."default",
    document_link text COLLATE pg_catalog."default",
    uploaded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT medical_records_pkey PRIMARY KEY (record_id),
    CONSTRAINT medical_records_patient_id_fkey FOREIGN KEY (patient_id)
        REFERENCES public.users (user_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);
```

## Prescriptions Table
```
CREATE TABLE IF NOT EXISTS public.prescriptions
(
    prescription_id integer NOT NULL DEFAULT nextval('prescriptions_prescription_id_seq'::regclass),
    patient_id integer,
    doctor_id integer,
    medication_name text COLLATE pg_catalog."default" NOT NULL,
    dosage text COLLATE pg_catalog."default",
    frequency text COLLATE pg_catalog."default",
    duration text COLLATE pg_catalog."default",
    issued_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT prescriptions_pkey PRIMARY KEY (prescription_id),
    CONSTRAINT prescriptions_doctor_id_fkey FOREIGN KEY (doctor_id)
        REFERENCES public.users (user_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT prescriptions_patient_id_fkey FOREIGN KEY (patient_id)
        REFERENCES public.users (user_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);
```