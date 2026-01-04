import { useAuth } from "@/hooks/useAuth";
import { useGuardianStudents } from "@/hooks/useGuardianStudents";
import { useTuitionPayments, useUpdateTuitionPayment } from "@/hooks/useTuitionPayments";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  CreditCard, 
  GraduationCap, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  User,
  Filter,
  Calendar,
  Search,
  Smartphone
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, isWithinInterval, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MulticaixaExpressPayment } from "@/components/MulticaixaExpressPayment";

export default function Tuition() {
  const { role } = useAuth();
  const { data: students, isLoading: studentsLoading } = useGuardianStudents();
  const { data: payments, isLoading: paymentsLoading } = useTuitionPayments();
  const updatePayment = useUpdateTuitionPayment();

  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter payments based on selected filters
  const filteredPayments = useMemo(() => {
    if (!payments) return [];

    return payments.filter((payment) => {
      // Status filter
      if (statusFilter !== "all" && payment.payment_status !== statusFilter) {
        return false;
      }

      // Search filter (by student name or description)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const studentName = payment.student?.profiles?.full_name?.toLowerCase() || "";
        const description = payment.description?.toLowerCase() || "";
        if (!studentName.includes(query) && !description.includes(query)) {
          return false;
        }
      }

      // Period filter
      if (periodFilter !== "all") {
        const paymentDate = parseISO(payment.due_date);
        const now = new Date();
        
        let startDate: Date;
        let endDate: Date;

        switch (periodFilter) {
          case "this_month":
            startDate = startOfMonth(now);
            endDate = endOfMonth(now);
            break;
          case "last_month":
            startDate = startOfMonth(subMonths(now, 1));
            endDate = endOfMonth(subMonths(now, 1));
            break;
          case "last_3_months":
            startDate = startOfMonth(subMonths(now, 2));
            endDate = endOfMonth(now);
            break;
          case "this_year":
            startDate = startOfYear(now);
            endDate = endOfYear(now);
            break;
          default:
            return true;
        }

        if (!isWithinInterval(paymentDate, { start: startDate, end: endDate })) {
          return false;
        }
      }

      return true;
    });
  }, [payments, statusFilter, periodFilter, searchQuery]);

  const handlePayment = async () => {
    if (!selectedPayment) return;

    // Encarregados apenas registam o pagamento para validação posterior pelo admin
    const newStatus = role === "admin" ? "paid" : "pending_validation";
    
    await updatePayment.mutateAsync({
      id: selectedPayment,
      payment_status: newStatus,
      paid_date: new Date().toISOString().split("T")[0],
      payment_method: paymentMethod,
      reference_number: referenceNumber,
    });

    setSelectedPayment(null);
    setPaymentMethod("");
    setReferenceNumber("");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-success text-success-foreground">Pago</Badge>;
      case "pending":
        return <Badge className="bg-warning text-warning-foreground">Pendente</Badge>;
      case "pending_validation":
        return <Badge className="bg-blue-500 text-white">A Validar</Badge>;
      case "overdue":
        return <Badge className="bg-destructive text-destructive-foreground">Em atraso</Badge>;
      case "cancelled":
        return <Badge variant="secondary">Cancelado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const totalPending = payments?.filter(p => p.payment_status === "pending").reduce((acc, p) => acc + Number(p.amount), 0) || 0;
  const totalPaid = payments?.filter(p => p.payment_status === "paid").reduce((acc, p) => acc + Number(p.amount), 0) || 0;

  if (role !== "encarregado" && role !== "admin") {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-warning mb-4" />
          <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
          <p className="text-muted-foreground">
            Esta página é apenas para encarregados de educação e administradores.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Propinas</h1>
        <p className="text-muted-foreground mt-1">
          Gestão de pagamentos de propinas escolares
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Educandos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {studentsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{students?.length || 0}</div>
                <p className="text-xs text-muted-foreground">matriculados</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Valor Pendente</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            {paymentsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold text-warning">
                  {totalPending.toLocaleString("pt-AO")} Kz
                </div>
                <p className="text-xs text-muted-foreground">a pagar</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            {paymentsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold text-success">
                  {totalPaid.toLocaleString("pt-AO")} Kz
                </div>
                <p className="text-xs text-muted-foreground">este ano</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Students Section - Only for Guardians */}
      {role === "encarregado" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Meus Educandos
            </CardTitle>
            <CardDescription>
              Alunos associados à sua conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            {studentsLoading ? (
              <div className="space-y-4">
                {[1, 2].map(i => <Skeleton key={i} className="h-20 w-full" />)}
              </div>
            ) : students && students.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {students.map((gs) => (
                  <Card key={gs.id} className="card-hover">
                    <CardContent className="flex items-center gap-4 p-4">
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={gs.student.profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {gs.student.profile?.full_name
                            ?.split(" ")
                            .map(n => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase() || <User className="h-6 w-6" />}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-semibold">{gs.student.profile?.full_name || "—"}</h4>
                        <p className="text-sm text-muted-foreground">
                          {gs.student.class?.name || "Sem turma"} • {gs.student.class?.grade_level || "—"}
                        </p>
                        {gs.student.student_number && (
                          <p className="text-xs text-muted-foreground">
                            Nº {gs.student.student_number}
                          </p>
                        )}
                      </div>
                      {gs.is_primary && (
                        <Badge variant="outline" className="shrink-0">Principal</Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum educando associado à sua conta</p>
                <p className="text-sm">Contacte a administração para associar os seus educandos</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Histórico de Propinas
          </CardTitle>
          <CardDescription>
            Lista de pagamentos e respetivos estados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por aluno ou descrição..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os estados</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="pending_validation">A Validar</SelectItem>
                <SelectItem value="overdue">Em atraso</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-full lg:w-[180px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os períodos</SelectItem>
                <SelectItem value="this_month">Este mês</SelectItem>
                <SelectItem value="last_month">Mês passado</SelectItem>
                <SelectItem value="last_3_months">Últimos 3 meses</SelectItem>
                <SelectItem value="this_year">Este ano</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {paymentsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filteredPayments && filteredPayments.length > 0 ? (
            <>
              {/* Summary of filtered results */}
              <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
                <span>
                  {filteredPayments.length} pagamento{filteredPayments.length !== 1 ? "s" : ""} encontrado{filteredPayments.length !== 1 ? "s" : ""}
                </span>
                <span>
                  Total: {filteredPayments.reduce((acc, p) => acc + Number(p.amount), 0).toLocaleString("pt-AO")} Kz
                </span>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      {payment.description || "Propina Mensal"}
                    </TableCell>
                    <TableCell>
                      {payment.student?.profiles?.full_name || "—"}
                    </TableCell>
                    <TableCell>
                      {Number(payment.amount).toLocaleString("pt-AO")} Kz
                    </TableCell>
                    <TableCell>
                      {format(new Date(payment.due_date), "dd/MM/yyyy", { locale: pt })}
                    </TableCell>
                    <TableCell>{getStatusBadge(payment.payment_status)}</TableCell>
                    <TableCell className="text-right">
                      {(payment.payment_status === "pending" || (role === "admin" && payment.payment_status === "pending_validation")) && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              className="gradient-primary text-primary-foreground"
                              onClick={() => setSelectedPayment(payment.id)}
                            >
                              {role === "admin" && payment.payment_status === "pending_validation" ? "Validar" : "Pagar"}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle>
                                {role === "admin" && payment.payment_status === "pending_validation" 
                                  ? "Validar Pagamento" 
                                  : "Efetuar Pagamento"}
                              </DialogTitle>
                              <DialogDescription>
                                Valor: {Number(payment.amount).toLocaleString("pt-AO")} Kz
                              </DialogDescription>
                            </DialogHeader>
                            
                            {role === "encarregado" && payment.payment_status === "pending" ? (
                              <Tabs defaultValue="multicaixa" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                  <TabsTrigger value="multicaixa" className="gap-2">
                                    <Smartphone className="h-4 w-4" />
                                    Multicaixa Express
                                  </TabsTrigger>
                                  <TabsTrigger value="other" className="gap-2">
                                    <CreditCard className="h-4 w-4" />
                                    Outro Método
                                  </TabsTrigger>
                                </TabsList>
                                <TabsContent value="multicaixa" className="mt-4">
                                  <MulticaixaExpressPayment
                                    amount={Number(payment.amount)}
                                    description={payment.description || "Propina Mensal"}
                                    onSubmit={async (data) => {
                                      await updatePayment.mutateAsync({
                                        id: payment.id,
                                        payment_status: "pending_validation",
                                        paid_date: new Date().toISOString().split("T")[0],
                                        payment_method: "Multicaixa Express",
                                        reference_number: data.referenceNumber,
                                      });
                                      setSelectedPayment(null);
                                    }}
                                    isLoading={updatePayment.isPending}
                                  />
                                </TabsContent>
                                <TabsContent value="other" className="mt-4">
                                  <div className="space-y-4">
                                    <div className="space-y-2">
                                      <Label>Método de Pagamento</Label>
                                      <Input
                                        placeholder="Ex: Transferência Bancária, Depósito"
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Número de Referência</Label>
                                      <Input
                                        placeholder="Ex: REF123456"
                                        value={referenceNumber}
                                        onChange={(e) => setReferenceNumber(e.target.value)}
                                      />
                                    </div>
                                    <Button
                                      onClick={handlePayment}
                                      className="w-full gradient-success text-success-foreground"
                                      disabled={updatePayment.isPending || !paymentMethod || !referenceNumber}
                                    >
                                      {updatePayment.isPending 
                                        ? "A processar..." 
                                        : "Submeter para Validação"}
                                    </Button>
                                  </div>
                                </TabsContent>
                              </Tabs>
                            ) : (
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label>Método de Pagamento</Label>
                                  <Input
                                    placeholder="Ex: Transferência Bancária, Multicaixa"
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Número de Referência</Label>
                                  <Input
                                    placeholder="Ex: REF123456"
                                    value={referenceNumber}
                                    onChange={(e) => setReferenceNumber(e.target.value)}
                                  />
                                </div>
                                <Button
                                  onClick={handlePayment}
                                  className="w-full gradient-success text-success-foreground"
                                  disabled={updatePayment.isPending}
                                >
                                  {updatePayment.isPending 
                                    ? "A processar..." 
                                    : role === "admin" 
                                      ? "Confirmar Pagamento" 
                                      : "Submeter para Validação"}
                                </Button>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      )}
                      {payment.payment_status === "paid" && payment.paid_date && (
                        <span className="text-sm text-muted-foreground">
                          Pago em {format(new Date(payment.paid_date), "dd/MM/yyyy", { locale: pt })}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum registo de propinas encontrado</p>
              {(statusFilter !== "all" || periodFilter !== "all" || searchQuery) && (
                <Button
                  variant="link"
                  onClick={() => {
                    setStatusFilter("all");
                    setPeriodFilter("all");
                    setSearchQuery("");
                  }}
                  className="mt-2"
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}