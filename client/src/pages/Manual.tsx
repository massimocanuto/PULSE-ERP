import { AppLayout } from "@/components/layout/AppLayout";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  BookOpen, 
  LayoutDashboard, 
  CheckSquare, 
  FileText, 
  Archive, 
  MessageSquare, 
  Briefcase, 
  BarChart3, 
  Users, 
  Shield, 
  Settings,
  Lightbulb,
  ChevronRight,
  StickyNote,
  PenTool,
  Bot,
  Calendar
} from "lucide-react";
import { manualContent, searchManual, ManualModule } from "@/data/manualContent";

const iconMap: Record<string, any> = {
  LayoutDashboard,
  CheckSquare,
  FileText,
  Archive,
  MessageSquare,
  Briefcase,
  BarChart3,
  Users,
  Shield,
  Settings,
  StickyNote,
  PenTool,
  Bot,
  Calendar,
  Lightbulb,
};

export default function Manual() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  const filteredModules = searchManual(searchQuery);
  const selectedModule = selectedModuleId 
    ? manualContent.find(m => m.id === selectedModuleId) 
    : null;

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-3rem)] bg-gradient-to-br from-[#f5f0e6] via-[#e8dcc8] to-[#ddd0b8] dark:from-[#2d3748] dark:via-[#374151] dark:to-[#3d4555]">
        <div className="h-32 w-full flex-shrink-0 bg-gradient-to-r from-[#4a5568] via-[#5a6a7d] to-[#6b7a8f]" />
        
        <div className="relative -mt-20 px-8 pb-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-card rounded-xl flex items-center justify-center shadow-md">
              <BookOpen className="h-8 w-8 text-amber-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white drop-shadow-md">Manuale</h1>
              <p className="text-white/80">Guida completa all'utilizzo del sistema</p>
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
        <div className="w-72 shrink-0 border-r border-border flex flex-col bg-[#F7F7F5]/30">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <h2 className="font-semibold text-lg">Indice</h2>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca nel manuale..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              <button
                onClick={() => setSelectedModuleId(null)}
                className={`
                  w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors
                  ${selectedModuleId === null 
                    ? 'bg-blue-600 text-white font-medium' 
                    : 'text-foreground hover:bg-accent'}
                `}
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>Panoramica Generale</span>
              </button>
              
              <div className="pt-2 pb-1 px-2">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  Moduli
                </span>
              </div>
              
              {filteredModules.map((module) => {
                const IconComponent = iconMap[module.icon] || FileText;
                return (
                  <button
                    key={module.id}
                    onClick={() => setSelectedModuleId(module.id)}
                    className={`
                      w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors
                      ${selectedModuleId === module.id 
                        ? 'bg-blue-600 text-white font-medium' 
                        : 'text-foreground hover:bg-accent'}
                    `}
                  >
                    <IconComponent className="h-3.5 w-3.5" />
                    <span className="flex-1 text-left">{module.name}</span>
                    <ChevronRight className="h-2.5 w-2.5 opacity-50" />
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1 overflow-auto bg-background">
          <ScrollArea className="h-full">
            <div className="max-w-4xl mx-auto p-8">
              {selectedModule ? (
                <ModuleDetail module={selectedModule} />
              ) : (
                <OverviewPage modules={filteredModules} onSelectModule={setSelectedModuleId} />
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
      </div>
    </AppLayout>
  );
}

function OverviewPage({ 
  modules, 
  onSelectModule 
}: { 
  modules: ManualModule[]; 
  onSelectModule: (id: string) => void;
}) {
  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Manuale PULSE ERP</h1>
            <p className="text-muted-foreground">Guida completa all'utilizzo dell'applicazione</p>
          </div>
        </div>
        
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">Benvenuto in PULSE ERP v2.0</p>
                <p className="text-sm text-blue-700 mt-1">
                  Questo manuale ti guiderà attraverso tutte le funzionalità dell'applicazione. 
                  Seleziona un modulo dal menu a sinistra o clicca su una delle card qui sotto per iniziare.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-lg font-semibold mb-4">Tutti i Moduli</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modules.map((module) => {
          const IconComponent = iconMap[module.icon] || FileText;
          return (
            <Card 
              key={module.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onSelectModule(module.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <IconComponent className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">{module.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{module.description}</p>
                <div className="mt-3 flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {module.sections.length} sezioni
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function ModuleDetail({ module }: { module: ManualModule }) {
  const IconComponent = iconMap[module.icon] || FileText;
  
  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <IconComponent className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{module.name}</h1>
            <p className="text-muted-foreground">{module.description}</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {module.sections.map((section, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
                  {index + 1}
                </span>
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed">{section.content}</p>
              
              {section.tips && section.tips.length > 0 && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-800">Suggerimenti</span>
                  </div>
                  <ul className="space-y-1">
                    {section.tips.map((tip, tipIndex) => (
                      <li key={tipIndex} className="text-sm text-amber-700 flex items-start gap-2">
                        <span className="text-amber-500 mt-1">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
