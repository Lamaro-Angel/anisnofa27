import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Smartphone, CreditCard, CheckCircle, AlertCircle, Copy } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { z } from "zod";

interface MulticaixaExpressPaymentProps {
  amount: number;
  description: string;
  onSubmit: (data: { phoneNumber: string; referenceNumber: string }) => Promise<void>;
  isLoading?: boolean;
}

const phoneSchema = z.string()
  .min(9, "Número deve ter pelo menos 9 dígitos")
  .max(15, "Número muito longo")
  .regex(/^[0-9+\s-]+$/, "Número inválido");

const referenceSchema = z.string()
  .min(4, "Referência deve ter pelo menos 4 caracteres")
  .max(50, "Referência muito longa")
  .regex(/^[a-zA-Z0-9-]+$/, "Referência inválida");

export function MulticaixaExpressPayment({
  amount,
  description,
  onSubmit,
  isLoading = false,
}: MulticaixaExpressPaymentProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [errors, setErrors] = useState<{ phone?: string; reference?: string }>({});
  const [step, setStep] = useState<"input" | "confirm" | "processing">("input");

  // Simulated entity and reference for payment
  const paymentEntity = "12345";
  const paymentReference = `MCX${Date.now().toString().slice(-8)}`;

  const validateForm = () => {
    const newErrors: { phone?: string; reference?: string } = {};

    try {
      phoneSchema.parse(phoneNumber);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.phone = e.errors[0]?.message;
      }
    }

    try {
      referenceSchema.parse(referenceNumber);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.reference = e.errors[0]?.message;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setStep("processing");
    try {
      await onSubmit({
        phoneNumber: phoneNumber.trim(),
        referenceNumber: referenceNumber.trim(),
      });
      toast({
        title: "Pagamento submetido",
        description: "O seu pagamento foi registado e está a aguardar validação.",
      });
    } catch (error) {
      toast({
        title: "Erro ao processar pagamento",
        description: "Por favor tente novamente.",
        variant: "destructive",
      });
      setStep("input");
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado",
      description: `${label} copiado para a área de transferência`,
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-4">
          <Smartphone className="h-8 w-8 text-orange-600" />
        </div>
        <CardTitle className="flex items-center justify-center gap-2">
          <span className="text-orange-600 font-bold">Multicaixa</span>
          <Badge variant="secondary">Express</Badge>
        </CardTitle>
        <CardDescription>
          Pagamento rápido e seguro via telemóvel
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Details */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Descrição:</span>
            <span className="font-medium">{description}</span>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <span>Valor:</span>
            <span className="text-primary">{amount.toLocaleString("pt-AO")} Kz</span>
          </div>
        </div>

        {step === "input" && (
          <>
            {/* Instructions */}
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-orange-800 dark:text-orange-200 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Como pagar
              </h4>
              <ol className="text-sm space-y-2 text-orange-700 dark:text-orange-300">
                <li className="flex gap-2">
                  <span className="font-bold">1.</span>
                  Abra a aplicação Multicaixa Express no seu telemóvel
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">2.</span>
                  Selecione "Pagamentos" e depois "Serviços"
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">3.</span>
                  <div>
                    Insira a entidade: 
                    <button
                      onClick={() => copyToClipboard(paymentEntity, "Entidade")}
                      className="ml-1 font-mono font-bold inline-flex items-center gap-1 hover:text-orange-500"
                    >
                      {paymentEntity}
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">4.</span>
                  <div>
                    Referência: 
                    <button
                      onClick={() => copyToClipboard(paymentReference, "Referência")}
                      className="ml-1 font-mono font-bold inline-flex items-center gap-1 hover:text-orange-500"
                    >
                      {paymentReference}
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">5.</span>
                  Confirme o pagamento e guarde o comprovativo
                </li>
              </ol>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Número de Telemóvel</Label>
                <Input
                  id="phone"
                  placeholder="Ex: 923 456 789"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className={errors.phone ? "border-destructive" : ""}
                />
                {errors.phone && (
                  <p className="text-xs text-destructive">{errors.phone}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference">Número de Referência do Pagamento</Label>
                <Input
                  id="reference"
                  placeholder="Ex: MCX12345678"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className={errors.reference ? "border-destructive" : ""}
                />
                {errors.reference && (
                  <p className="text-xs text-destructive">{errors.reference}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  O número de referência fornecido pela aplicação Multicaixa Express após o pagamento
                </p>
              </div>

              <Button
                onClick={() => setStep("confirm")}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                disabled={!phoneNumber || !referenceNumber}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Continuar
              </Button>
            </div>
          </>
        )}

        {step === "confirm" && (
          <div className="space-y-4">
            <div className="bg-muted rounded-lg p-4 space-y-3">
              <h4 className="font-semibold">Confirmar dados do pagamento:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Telemóvel:</span>
                  <span className="font-medium">{phoneNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Referência:</span>
                  <span className="font-medium font-mono">{referenceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor:</span>
                  <span className="font-bold">{amount.toLocaleString("pt-AO")} Kz</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep("input")}
                className="flex-1"
              >
                Voltar
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? "A processar..." : "Confirmar Pagamento"}
              </Button>
            </div>
          </div>
        )}

        {step === "processing" && (
          <div className="text-center py-8 space-y-4">
            <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <div>
              <h4 className="font-semibold text-lg">Pagamento Submetido</h4>
              <p className="text-muted-foreground text-sm mt-1">
                O seu pagamento foi registado e está a aguardar validação pela administração.
              </p>
            </div>
          </div>
        )}

        {/* Security Note */}
        <p className="text-xs text-center text-muted-foreground">
          🔒 Os seus dados estão seguros e protegidos
        </p>
      </CardContent>
    </Card>
  );
}
