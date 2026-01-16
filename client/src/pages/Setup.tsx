import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { 
  Loader2, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Building2, 
  User, 
  Lock, 
  Mail,
  Sparkles,
  CheckCircle2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SetupData {
  companyName: string;
  adminName: string;
  adminEmail: string;
  adminUsername: string;
  adminPassword: string;
  confirmPassword: string;
}

export default function Setup() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [data, setData] = useState<SetupData>({
    companyName: "",
    adminName: "",
    adminEmail: "",
    adminUsername: "",
    adminPassword: "",
    confirmPassword: "",
  });

  const steps = [
    { title: "Benvenuto", icon: Sparkles },
    { title: "Azienda", icon: Building2 },
    { title: "Amministratore", icon: User },
    { title: "Completato", icon: CheckCircle2 },
  ];

  const handleNext = () => {
    if (currentStep === 1 && !data.companyName.trim()) {
      toast({ title: "Inserisci il nome dell'azienda", variant: "destructive" });
      return;
    }
    if (currentStep === 2) {
      if (!data.adminName.trim() || !data.adminUsername.trim() || !data.adminPassword) {
        toast({ title: "Compila tutti i campi obbligatori", variant: "destructive" });
        return;
      }
      if (data.adminPassword !== data.confirmPassword) {
        toast({ title: "Le password non coincidono", variant: "destructive" });
        return;
      }
      if (data.adminPassword.length < 4) {
        toast({ title: "La password deve avere almeno 4 caratteri", variant: "destructive" });
        return;
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: data.companyName,
          adminName: data.adminName,
          adminEmail: data.adminEmail,
          adminUsername: data.adminUsername,
          adminPassword: data.adminPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Errore durante il setup");
      }

      setSetupComplete(true);
      toast({ title: "Setup completato con successo!" });
      
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (error: any) {
      toast({ title: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const updateData = (field: keyof SetupData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <style>{`
        @keyframes pulse {
          0%, 100% { 
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.4);
          }
          50% { 
            transform: scale(1.05);
            box-shadow: 0 0 20px 5px rgba(37, 99, 235, 0.2);
          }
        }
        .pulse-icon {
          animation: pulse 2s ease-in-out infinite;
        }
      `}</style>

      <Card className="w-full max-w-lg shadow-xl border-0 bg-[#F5F0E6]">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-4 pulse-icon">
            <span className="text-2xl font-bold text-white">PE</span>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">PULSE ERP</CardTitle>
          <p className="text-sm font-bold text-blue-600">v5.0</p>
          <CardDescription className="mt-2">Configurazione Iniziale</CardDescription>
        </CardHeader>

        <div className="px-6 pb-4">
          <div className="flex justify-between items-center mb-6">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    index < currentStep
                      ? "bg-green-500 text-white"
                      : index === currentStep
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {index < currentStep ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                <span className={`text-xs mt-1 ${index === currentStep ? "text-blue-600 font-medium" : "text-gray-500"}`}>
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <div className="absolute h-0.5 w-full bg-gray-200 top-5 -z-10" />
                )}
              </div>
            ))}
          </div>
        </div>

        <CardContent className="pt-0">
          {currentStep === 0 && (
            <div className="text-center py-6">
              <Sparkles className="h-16 w-16 mx-auto text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Benvenuto in PULSE ERP!</h3>
              <p className="text-muted-foreground mb-4">
                Questo wizard ti guiderà nella configurazione iniziale del software.
                In pochi passaggi avrai tutto pronto per iniziare.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg text-left">
                <p className="text-sm text-blue-800 font-medium mb-2">Cosa configureremo:</p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4" /> Nome della tua azienda
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4" /> Account amministratore
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4" /> Credenziali di accesso
                  </li>
                </ul>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="py-4 space-y-4">
              <div className="text-center mb-6">
                <Building2 className="h-12 w-12 mx-auto text-blue-600 mb-2" />
                <h3 className="text-lg font-semibold">Informazioni Azienda</h3>
                <p className="text-sm text-muted-foreground">Inserisci il nome della tua azienda</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">Nome Azienda *</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="companyName"
                    placeholder="Es. Acme S.r.l."
                    value={data.companyName}
                    onChange={(e) => updateData("companyName", e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="py-4 space-y-4">
              <div className="text-center mb-4">
                <User className="h-12 w-12 mx-auto text-blue-600 mb-2" />
                <h3 className="text-lg font-semibold">Account Amministratore</h3>
                <p className="text-sm text-muted-foreground">Crea il tuo account admin</p>
              </div>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="adminName">Nome Completo *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="adminName"
                      placeholder="Mario Rossi"
                      value={data.adminName}
                      onChange={(e) => updateData("adminName", e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="adminEmail"
                      type="email"
                      placeholder="mario@azienda.it"
                      value={data.adminEmail}
                      onChange={(e) => updateData("adminEmail", e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminUsername">Username *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="adminUsername"
                      placeholder="admin"
                      value={data.adminUsername}
                      onChange={(e) => updateData("adminUsername", e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="adminPassword">Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="adminPassword"
                        type="password"
                        placeholder="••••••"
                        value={data.adminPassword}
                        onChange={(e) => updateData("adminPassword", e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Conferma *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••"
                        value={data.confirmPassword}
                        onChange={(e) => updateData("confirmPassword", e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="text-center py-6">
              {setupComplete ? (
                <>
                  <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-12 w-12 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-green-700 mb-2">Setup Completato!</h3>
                  <p className="text-muted-foreground">
                    Reindirizzamento alla pagina di login...
                  </p>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-16 w-16 mx-auto text-blue-600 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Tutto Pronto!</h3>
                  <p className="text-muted-foreground mb-4">
                    Verifica i dati e completa la configurazione.
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg text-left space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Azienda:</span>
                      <span className="text-sm font-medium">{data.companyName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Amministratore:</span>
                      <span className="text-sm font-medium">{data.adminName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Username:</span>
                      <span className="text-sm font-medium">{data.adminUsername}</span>
                    </div>
                    {data.adminEmail && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Email:</span>
                        <span className="text-sm font-medium">{data.adminEmail}</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="flex justify-between mt-6">
            {currentStep > 0 && currentStep < 3 && (
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Indietro
              </Button>
            )}
            {currentStep === 0 && <div />}
            
            {currentStep < 3 && (
              <Button onClick={handleNext} className="ml-auto bg-blue-600 hover:bg-blue-700">
                Avanti
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
            
            {currentStep === 3 && !setupComplete && (
              <Button 
                onClick={handleComplete} 
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Configurazione in corso...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Completa Setup
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
