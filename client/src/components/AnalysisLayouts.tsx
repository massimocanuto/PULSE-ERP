import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Mountain, Modal } from "lucide-react";
import { MountainProgress } from "./MountainProgress";
import { useState } from "react";

interface AnalysisLayoutProps {
  projects: any[];
  tasks: any[];
  onProjectSelect?: (projectId: string) => void;
}

// Helper functions
const getProgressBackground = (p: number) => {
  if (p >= 70) return 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200';
  if (p >= 30) return 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200';
  return 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200';
};

const getProgressBadge = (p: number) => {
  if (p >= 70) return 'bg-green-500 text-white';
  if (p >= 30) return 'bg-yellow-500 text-white';
  return 'bg-red-400 text-white';
};

// Layout 1: Dashboard Compatto (List View)
export function CompactDashboardLayout({ projects, tasks }: AnalysisLayoutProps) {
  return (
    <ScrollArea className="h-full">
      <div className="space-y-3 pr-4">
        {projects?.map((project: any) => {
          const projectTasks = tasks?.filter((t: any) => t.projectId === project.id) || [];
          const progress = projectTasks.length > 0 ? Math.round((projectTasks.filter((t: any) => t.done).length / projectTasks.length) * 100) : 0;

          return (
            <div key={project.id} className={`p-3 rounded-lg border-2 ${getProgressBackground(progress)}`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium text-sm truncate">{project.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {projectTasks.filter((t: any) => t.done).length}/{projectTasks.length} completate
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={progress} className="w-24 h-2" />
                  <span className={`text-xs font-bold px-2 py-1 rounded min-w-max ${getProgressBadge(progress)}`}>
                    {progress}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        {(!projects || projects.length === 0) && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Nessun progetto</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

// Layout 2: Full Montagna (Large Mountain View)
export function FullMountainLayout({ projects, tasks }: AnalysisLayoutProps) {
  return (
    <ScrollArea className="h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pr-4">
        {projects?.map((project: any) => {
          const projectTasks = tasks?.filter((t: any) => t.projectId === project.id) || [];
          const progress = projectTasks.length > 0 ? Math.round((projectTasks.filter((t: any) => t.done).length / projectTasks.length) * 100) : 0;

          return (
            <Card key={project.id} className={`overflow-hidden border-2 ${getProgressBackground(progress)}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{project.title}</CardTitle>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {projectTasks.filter((t: any) => t.done).length}/{projectTasks.length}
                    </span>
                    <span className={`text-sm font-bold px-3 py-1 rounded ${getProgressBadge(progress)}`}>
                      {progress}%
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <MountainProgress projectTitle={project.title} projectId={project.id} tasks={projectTasks} />
              </CardContent>
            </Card>
          );
        })}
        {(!projects || projects.length === 0) && (
          <div className="text-center py-16 text-muted-foreground col-span-full">
            <Mountain className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">Nessun progetto</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

// Layout 3: Tabella Ibrida (Hybrid Table)
export function HybridTableLayout({ projects, tasks }: AnalysisLayoutProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <ScrollArea className="h-full">
      <div className="space-y-1 pr-4">
        <div className="sticky top-0 bg-muted/50 p-3 rounded-lg mb-2 text-sm font-semibold grid grid-cols-12 gap-3 text-muted-foreground">
          <div className="col-span-4">Progetto</div>
          <div className="col-span-3">Progresso</div>
          <div className="col-span-2">Attività</div>
          <div className="col-span-3">Azioni</div>
        </div>

        {projects?.map((project: any) => {
          const projectTasks = tasks?.filter((t: any) => t.projectId === project.id) || [];
          const progress = projectTasks.length > 0 ? Math.round((projectTasks.filter((t: any) => t.done).length / projectTasks.length) * 100) : 0;
          const isExpanded = expandedId === project.id;

          return (
            <div key={project.id}>
              <button
                onClick={() => setExpandedId(isExpanded ? null : project.id)}
                className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${getProgressBackground(progress)}`}
              >
                <div className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-4">
                    <p className="font-medium truncate">{project.title}</p>
                  </div>
                  <div className="col-span-3">
                    <Progress value={progress} className="h-2" />
                  </div>
                  <div className="col-span-2 text-sm text-muted-foreground">
                    {projectTasks.filter((t: any) => t.done).length}/{projectTasks.length}
                  </div>
                  <div className="col-span-3 flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded ${getProgressBadge(progress)}`}>
                      {progress}%
                    </span>
                    <span className="text-xs text-blue-600">
                      {isExpanded ? 'Nascondi' : 'Espandi'}
                    </span>
                  </div>
                </div>
              </button>
              
              {isExpanded && (
                <div className="p-4 bg-muted/30 rounded-lg mt-1 border-2 border-dashed">
                  <MountainProgress projectTitle={project.title} projectId={project.id} tasks={projectTasks} />
                </div>
              )}
            </div>
          );
        })}

        {(!projects || projects.length === 0) && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Nessun progetto</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

// Layout 4: Griglia 3 Colonne Minimale (3-Column Minimal Grid)
export function MinimalGridLayout({ projects, tasks }: AnalysisLayoutProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 pr-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects?.map((project: any) => {
            const projectTasks = tasks?.filter((t: any) => t.projectId === project.id) || [];
            const progress = projectTasks.length > 0 ? Math.round((projectTasks.filter((t: any) => t.done).length / projectTasks.length) * 100) : 0;
            const isSelected = selectedId === project.id;

            return (
              <div
                key={project.id}
                onClick={() => setSelectedId(isSelected ? null : project.id)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-violet-50 border-violet-400 shadow-lg'
                    : `${getProgressBackground(progress)} hover:shadow-md`
                }`}
              >
                <div className="text-center">
                  <p className="font-medium text-sm truncate">{project.title}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {projectTasks.filter((t: any) => t.done).length}/{projectTasks.length}
                  </p>
                  <div className={`text-3xl font-bold mt-3 ${getProgressBadge(progress)}`} style={{
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    background: progress >= 70 ? '#22c55e' : progress >= 30 ? '#eab308' : '#f97316',
                  }}>
                    {progress}%
                  </div>
                </div>

                {isSelected && (
                  <div className="mt-4 pt-4 border-t">
                    <MountainProgress projectTitle={project.title} projectId={project.id} tasks={projectTasks} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {(!projects || projects.length === 0) && (
          <div className="text-center py-16 text-muted-foreground">
            <Mountain className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">Nessun progetto</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
