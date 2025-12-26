-- Create tuition payments table
CREATE TABLE public.tuition_payments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    guardian_id UUID NOT NULL REFERENCES public.guardians(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE,
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue', 'cancelled')),
    payment_method TEXT,
    reference_number TEXT,
    description TEXT,
    academic_year_id UUID REFERENCES public.academic_years(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.tuition_payments ENABLE ROW LEVEL SECURITY;

-- Admins can manage all tuition payments
CREATE POLICY "Admins can manage tuition payments"
ON public.tuition_payments
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Guardians can view and pay their students' tuition
CREATE POLICY "Guardians can view their students tuition"
ON public.tuition_payments
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM guardians g
        WHERE g.id = tuition_payments.guardian_id
        AND g.user_id = auth.uid()
    )
);

-- Guardians can update payment status (mark as paid)
CREATE POLICY "Guardians can update their tuition payments"
ON public.tuition_payments
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM guardians g
        WHERE g.id = tuition_payments.guardian_id
        AND g.user_id = auth.uid()
    )
);

-- Create trigger for updated_at
CREATE TRIGGER update_tuition_payments_updated_at
BEFORE UPDATE ON public.tuition_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();