import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  Users, 
  Calendar, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Activity,
  FileText,
  Download
} from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";
import { it } from "date-fns/locale";

interface ProjectHealth {
  id: string;
  title: string;
  progress: number;
  health: 'green' | 'yellow' | 'red';
  tasksCompleted: number;
  tasksTotal: number;
  dueDate: string | null;
  startDate: string | null;
}

interface WorkloadItem {
  userId: string;
  userName: string;
  avatar: string;
  pendingTasks: number;
  completedTasks: number;
  totalTasks: number;
  estimatedHours: number;
  workloadLevel: 'high' | 'medium' | 'low';
}

interface ActivityItem {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  entityTitle: string;
  details: string;
  createdAt: string;
}

export default function Analytics() {
  const [activeTab, setActiveTab] = useState("portfolio");

  const { data: analytics } = useQuery({
    queryKey: ["/api/analytics/productivity"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/productivity", { credentials: 'include' });
      return res.json();
    }
  });

  const { data: workload } = useQuery<WorkloadItem[]>({
    queryKey: ["/api/analytics/workload"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/workload", { credentials: 'include' });
      return res.json();
    }
  });

  const { data: activities } = useQuery<ActivityItem[]>({
    queryKey: ["/api/activity-feed"],
    queryFn: async () => {
      const res = await fetch("/api/activity-feed?limit=20", { credentials: 'include' });
      return res.json();
    }
  });

  const { data: users } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const res = await fetch("/api/users", { credentials: 'include' });
      return res.json();
    }
  });

  const getUserName = (userId: string) => {
    const user = users?.find((u: any) => u.id === userId);
    return user?.name || 'Utente';
  };

  const getActionText = (action: string) => {
    const actions: Record<string, string> = {
      'created': 'ha creato',
      'updated': 'ha aggiornato',
      'deleted': 'ha eliminato',
      'completed': 'ha completato',
      'commented': 'ha commentato su',
      'assigned': 'ha assegnato',
      'mentioned': 'ha menzionato',
    };
    return actions[action] || action;
  };

  const getEntityTypeIcon = (type: string) => {
    switch (type) {
      case 'task': return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
      case 'project': return <FileText className="h-4 w-4 text-purple-500" />;
      case 'document': return <FileText className="h-4 w-4 text-orange-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const projectHealth: ProjectHealth[] = analytics?.projectHealth || [];

  return (
    <AppLayout>
      <div className="w-full min-h-full bg-gradient-to-br from-[#f5f0e6] via-[#e8dcc8] to-[#ddd0b8] dark:from-[#2d3748] dark:via-[#374151] dark:to-[#3d4555]">
        <div className="h-32 w-full flex-shrink-0 bg-gradient-to-r from-[#4a5568] via-[#5a6a7d] to-[#6b7a8f]" />
        
        <div className="relative -mt-20 px-8 pb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-card rounded-xl flex items-center justify-center shadow-md">
              <BarChart3 className="h-8 w-8 text-amber-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white drop-shadow-md">Analisi e Report</h1>
              <p className="text-white/80">Panoramica delle performance del team e dei progetti</p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-card/80 backdrop-blur">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{analytics?.summary?.totalTasks || 0}</div>
                  <div className="text-xs text-muted-foreground">Task Totali</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/80 backdrop-blur">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{analytics?.summary?.completionRate || 0}%</div>
                  <div className="text-xs text-muted-foreground">Tasso Completamento</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/80 backdrop-blur">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{analytics?.summary?.activeProjects || 0}</div>
                  <div className="text-xs text-muted-foreground">Progetti Attivi</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/80 backdrop-blur">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{analytics?.timeTracking?.totalEstimatedHours || 0}h</div>
                  <div className="text-xs text-muted-foreground">Ore Stimate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-4 gap-1 h-auto bg-transparent p-0 max-w-md">
            <TabsTrigger value="portfolio" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg" title="Portfolio">
              <BarChart3 className="h-4 w-4" />
              <span>Portfolio</span>
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg" title="Timeline">
              <Calendar className="h-4 w-4" />
              <span>Timeline</span>
            </TabsTrigger>
            <TabsTrigger value="capacity" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg" title="Carico Lavoro">
              <Users className="h-4 w-4" />
              <span>Carico Lavoro</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] data-[state=active]:bg-primary/20 rounded-lg" title="Attività">
              <Activity className="h-4 w-4" />
              <span>Attività</span>
            </TabsTrigger>
          </TabsList>

          {/* Portfolio Dashboard */}
          <TabsContent value="portfolio" className="space-y-4">
            <Card className="bg-card/90">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" /> Stato dei Progetti
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projectHealth.map((project) => (
                    <div key={project.id} className="p-4 rounded-lg border bg-card">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            project.health === 'green' ? 'bg-green-500' :
                            project.health === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                          }`} />
                          <span className="font-medium">{project.title}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4" />
                          {project.tasksCompleted}/{project.tasksTotal} task
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${
                            project.health === 'green' ? 'bg-green-500' :
                            project.health === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                        <span>{project.progress}% completato</span>
                        {project.dueDate && (
                          <span>Scadenza: {project.dueDate}</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {projectHealth.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">Nessun progetto presente</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Time Tracking Summary */}
            <Card className="bg-card/90">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" /> Tempo Stimato vs Reale
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {analytics?.timeTracking?.totalEstimatedHours || 0}h
                    </div>
                    <div className="text-sm text-muted-foreground">Ore Stimate</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {analytics?.timeTracking?.totalActualHours || 0}h
                    </div>
                    <div className="text-sm text-muted-foreground">Ore Effettive</div>
                  </div>
                  <div className={`p-4 rounded-lg ${
                    (analytics?.timeTracking?.variance || 0) > 0 ? 'bg-red-50' : 'bg-green-50'
                  }`}>
                    <div className={`text-2xl font-bold ${
                      (analytics?.timeTracking?.variance || 0) > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {(analytics?.timeTracking?.variance || 0) > 0 ? '+' : ''}{analytics?.timeTracking?.variance || 0}h
                    </div>
                    <div className="text-sm text-muted-foreground">Variazione</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Timeline/Gantt View */}
          <TabsContent value="timeline" className="space-y-4">
            <Card className="bg-card/90">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" /> Timeline Progetti
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {projectHealth.map((project) => {
                    const startDate = project.startDate ? parseISO(project.startDate) : new Date();
                    const endDate = project.dueDate ? parseISO(project.dueDate) : new Date();
                    const duration = differenceInDays(endDate, startDate) || 1;
                    const today = new Date();
                    const elapsed = differenceInDays(today, startDate);
                    const elapsedPercent = Math.min(100, Math.max(0, (elapsed / duration) * 100));
                    
                    return (
                      <div key={project.id} className="flex items-center gap-4">
                        <div className="w-40 truncate font-medium text-sm">{project.title}</div>
                        <div className="flex-1 relative">
                          <div className="h-8 bg-gray-100 rounded-lg relative overflow-hidden">
                            {/* Progress bar */}
                            <div 
                              className={`absolute inset-y-0 left-0 rounded-lg ${
                                project.health === 'green' ? 'bg-green-400' :
                                project.health === 'yellow' ? 'bg-yellow-400' : 'bg-red-400'
                              }`}
                              style={{ width: `${project.progress}%` }}
                            />
                            {/* Today marker */}
                            <div 
                              className="absolute top-0 bottom-0 w-0.5 bg-blue-600"
                              style={{ left: `${elapsedPercent}%` }}
                            />
                            {/* Label */}
                            <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                              {project.progress}%
                            </div>
                          </div>
                        </div>
                        <div className="w-24 text-xs text-muted-foreground text-right">
                          {project.dueDate ? format(parseISO(project.dueDate), 'dd/MM/yy') : '-'}
                        </div>
                      </div>
                    );
                  })}
                  {projectHealth.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">Nessun progetto con date</p>
                  )}
                </div>
                <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-green-400" /> In tempo
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-yellow-400" /> A rischio
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-red-400" /> In ritardo
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-0.5 h-3 bg-blue-600" /> Oggi
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Capacity Planner */}
          <TabsContent value="capacity" className="space-y-4">
            <Card className="bg-card/90">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" /> Carico di Lavoro del Team
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {workload?.map((member) => (
                    <div key={member.userId} className="p-4 rounded-lg border bg-card">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                            {member.avatar || member.userName.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div className="font-medium">{member.userName}</div>
                            <div className="text-xs text-muted-foreground">
                              {member.estimatedHours}h stimate
                            </div>
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          member.workloadLevel === 'high' ? 'bg-red-100 text-red-700' :
                          member.workloadLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {member.workloadLevel === 'high' ? 'Sovraccarico' :
                           member.workloadLevel === 'medium' ? 'Normale' : 'Disponibile'}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-sm">
                        <div className="p-2 bg-yellow-50 rounded">
                          <div className="font-bold text-yellow-600">{member.pendingTasks}</div>
                          <div className="text-xs text-muted-foreground">Da fare</div>
                        </div>
                        <div className="p-2 bg-green-50 rounded">
                          <div className="font-bold text-green-600">{member.completedTasks}</div>
                          <div className="text-xs text-muted-foreground">Completati</div>
                        </div>
                        <div className="p-2 bg-blue-50 rounded">
                          <div className="font-bold text-blue-600">{member.totalTasks}</div>
                          <div className="text-xs text-muted-foreground">Totali</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!workload || workload.length === 0) && (
                    <p className="text-center text-muted-foreground py-8">Nessun membro del team</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Feed */}
          <TabsContent value="activity" className="space-y-4">
            <Card className="bg-card/90">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" /> Attività Recenti
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activities?.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
                      {getEntityTypeIcon(activity.entityType)}
                      <div className="flex-1">
                        <div className="text-sm">
                          <span className="font-medium">{getUserName(activity.userId)}</span>
                          {' '}{getActionText(activity.action)}{' '}
                          <span className="font-medium">{activity.entityTitle}</span>
                        </div>
                        {activity.details && (
                          <div className="text-xs text-muted-foreground mt-1 truncate">
                            {activity.details}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          {activity.createdAt ? format(new Date(activity.createdAt), 'dd MMM yyyy HH:mm', { locale: it }) : '-'}
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!activities || activities.length === 0) && (
                    <p className="text-center text-muted-foreground py-8">Nessuna attività registrata</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Export Button */}
        <div className="mt-6 flex justify-end">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" /> Esporta Report PDF
          </Button>
        </div>
        </div>
      </div>
    </AppLayout>
  );
}
