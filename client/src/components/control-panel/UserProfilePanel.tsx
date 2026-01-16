import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/contexts/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/lib/api";
import { useState, useEffect } from "react";
import { Loader2, Save, User, Mail, Building, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function UserProfilePanel() {
  const { user, setUser } = useUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        department: user.department || "",
        password: "",
        confirmPassword: "",
      });
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => usersApi.update(user!.id, data),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setUser(updatedUser);
      setFormData(prev => ({ ...prev, password: "", confirmPassword: "" }));
      toast({
        title: "Profilo aggiornato",
        description: "Le modifiche sono state salvate con successo.",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile aggiornare il profilo.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (formData.password && formData.password !== formData.confirmPassword) {
      toast({
        title: "Errore",
        description: "Le password non corrispondono.",
        variant: "destructive",
      });
      return;
    }

    const data: any = {
      name: formData.name,
      email: formData.email,
      department: formData.department,
      avatar: formData.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2),
    };

    if (formData.password && formData.password.trim() !== "") {
      data.password = formData.password;
    }

    updateMutation.mutate(data);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                {user.avatar || user.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl">Il Mio Profilo</CardTitle>
              <CardDescription>Visualizza e modifica le tue informazioni personali</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Nome completo
              </Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Il tuo nome"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email
              </Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="La tua email"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                Dipartimento
              </Label>
              <Input
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="Il tuo dipartimento"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                Ruolo
              </Label>
              <Input
                value={user.role || "Member"}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Il ruolo può essere modificato solo da un amministratore
              </p>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-sm font-medium mb-4">Cambia Password</h3>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Nuova Password</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Lascia vuoto per non modificare"
                />
              </div>
              <div className="space-y-2">
                <Label>Conferma Password</Label>
                <Input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Conferma la nuova password"
                />
              </div>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="w-full"
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salva Modifiche
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
