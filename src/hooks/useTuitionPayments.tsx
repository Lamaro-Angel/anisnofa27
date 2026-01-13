import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";

export interface TuitionPayment {
  id: string;
  student_id: string;
  guardian_id: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  payment_status: "pending" | "paid" | "overdue" | "cancelled" | "pending_validation";
  payment_method: string | null;
  reference_number: string | null;
  description: string | null;
  academic_year_id: string | null;
  created_at: string;
  updated_at: string;
  student?: {
    id: string;
    user_id: string;
    profiles: {
      full_name: string;
    } | null;
  };
}

export function useTuitionPayments() {
  const { user, role } = useAuth();

  return useQuery({
    queryKey: ["tuition-payments", user?.id, role],
    queryFn: async () => {
      if (!user) return [];

      // For guardians, first get their guardian record, then filter payments
      if (role === "encarregado") {
        const { data: guardian } = await supabase
          .from("guardians")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!guardian) return [];

        const { data, error } = await supabase
          .from("tuition_payments")
          .select(`
            *,
            student:students(
              id,
              user_id,
              profiles:profiles(full_name)
            )
          `)
          .eq("guardian_id", guardian.id)
          .order("due_date", { ascending: false });

        if (error) throw error;
        return data as unknown as TuitionPayment[];
      }

      // For admins, return all payments
      const { data, error } = await supabase
        .from("tuition_payments")
        .select(`
          *,
          student:students(
            id,
            user_id,
            profiles:profiles(full_name)
          )
        `)
        .order("due_date", { ascending: false });

      if (error) throw error;
      return data as unknown as TuitionPayment[];
    },
    enabled: !!user,
  });
}

export function useCreateTuitionPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payment: {
      student_id: string;
      guardian_id: string;
      amount: number;
      due_date: string;
      description?: string;
      academic_year_id?: string;
    }) => {
      const { data, error } = await supabase
        .from("tuition_payments")
        .insert(payment)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tuition-payments"] });
      toast({ title: "Propina criada com sucesso" });
    },
    onError: (error) => {
      toast({ title: "Erro ao criar propina", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateTuitionPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      payment_status?: "pending" | "paid" | "overdue" | "cancelled" | "pending_validation";
      paid_date?: string;
      payment_method?: string;
      reference_number?: string;
    }) => {
      const { data, error } = await supabase
        .from("tuition_payments")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tuition-payments"] });
      toast({ title: "Pagamento atualizado com sucesso" });
    },
    onError: (error) => {
      toast({ title: "Erro ao atualizar pagamento", description: error.message, variant: "destructive" });
    },
  });
}