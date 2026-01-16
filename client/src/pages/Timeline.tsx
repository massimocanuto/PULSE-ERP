import { AppLayout } from "@/components/layout/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { format, differenceInDays, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isWithinInterval, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, Briefcase, Clock, Flag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Project {
  id: string;
  title: string;
  status: string;
  priority: string;
  startDate?: string;
  dueDate?: string;
  owner?: string;
  notes?: string;
  createdAt: string;
}

interface Task {
  id: string;
  title: string;
  done: boolean;
  dueDate?: string;
  priority: string;
}

const priorityColors: Record<string, string> = {
  High: "bg-red-500",
  Medium: "bg-yellow-500",
  Low: "bg-green-500",
  high: "bg-red-500",
  medium: "bg-yellow-500",
  low: "bg-green-500",
};

const statusColors: Record<string, string> = {
  "Not Started": "bg-gray-400",
  "In Progress": "bg-blue-500",
  "On Hold": "bg-yellow-500",
  "Completed": "bg-green-500",
};

export default function Timeline() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getProjectPosition = (project: Project) => {
    const start = project.startDate ? parseISO(project.startDate) : parseISO(project.createdAt);
    const end = project.dueDate ? parseISO(project.dueDate) : addMonths(start, 1);
    
    const monthStartTime = monthStart.getTime();
    const monthEndTime = monthEnd.getTime();
    const startTime = Math.max(start.getTime(), monthStartTime);
    const endTime = Math.min(end.getTime(), monthEndTime);
    
    if (startTime > monthEndTime || endTime < monthStartTime) return null;
    
    const totalDays = differenceInDays(monthEnd, monthStart) + 1;
    const leftOffset = Math.max(0, differenceInDays(new Date(startTime), monthStart));
    const width = Math.min(totalDays - leftOffset, differenceInDays(new Date(endTime), new Date(startTime)) + 1);
    
    return {
      left: `${(leftOffset / totalDays) * 100}%`,
      width: `${(width / totalDays) * 100}%`,
    };
  };

  const getTasksForProject = (projectId: string) => {
    return tasks.filter(t => t.dueDate && !t.done);
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-3rem)] overflow-hidden bg-gradient-to-br from-[#f5f0e6] via-[#e8dcc8] to-[#ddd0b8] dark:from-[#2d3748] dark:via-[#374151] dark:to-[#3d4555]">
        <div className="h-32 w-full flex-shrink-0 bg-gradient-to-r from-[#4a5568] via-[#5a6a7d] to-[#6b7a8f]" />
        
        <div className="relative -mt-20 px-8 pb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-card rounded-xl flex items-center justify-center shadow-md">
              <Calendar className="h-8 w-8 text-amber-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white drop-shadow-md">Timeline</h1>
              <p className="text-white/80">Visualizzazione temporale dei progetti</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden px-8 pb-8">
          <div className="rounded-xl border shadow-sm bg-card h-full flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-lg font-semibold min-w-[200px] text-center">
                  {format(currentMonth, "MMMM yyyy", { locale: it })}
                </h2>
                <Button variant="outline" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
                Oggi
              </Button>
            </div>

            <div className="flex-1 overflow-auto">
              <div className="min-w-[800px]">
                <div className="flex border-b sticky top-0 bg-card z-10">
                  <div className="w-64 p-3 border-r font-medium text-sm text-muted-foreground flex-shrink-0">
                    Progetto
                  </div>
                  <div className="flex-1 flex">
                    {daysInMonth.map((day, i) => (
                      <div
                        key={i}
                        className={`flex-1 p-2 text-center text-xs border-r last:border-r-0 ${
                          format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
                            ? "bg-blue-50 font-bold text-blue-600"
                            : ""
                        }`}
                      >
                        <div>{format(day, "d")}</div>
                        <div className="text-muted-foreground">{format(day, "EEE", { locale: it })}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {projects.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground">
                    <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nessun progetto da visualizzare</p>
                    <p className="text-sm">Crea un progetto per vederlo nella timeline</p>
                  </div>
                ) : (
                  projects.map((project) => {
                    const position = getProjectPosition(project);
                    return (
                      <div key={project.id} className="flex border-b hover:bg-gray-50">
                        <div className="w-64 p-3 border-r flex-shrink-0">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${priorityColors[project.priority] || "bg-gray-400"}`} />
                            <span className="font-medium text-sm truncate">{project.title}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className={`text-xs ${statusColors[project.status] ? "text-white" : ""}`} style={{ backgroundColor: statusColors[project.status]?.replace("bg-", "") }}>
                              {project.status}
                            </Badge>
                            {project.owner && (
                              <span className="text-xs text-muted-foreground truncate">{project.owner}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex-1 relative h-16">
                          {position && (
                            <div
                              className={`absolute top-2 h-8 rounded-full ${priorityColors[project.priority] || "bg-blue-500"} opacity-80 flex items-center px-3`}
                              style={{ left: position.left, width: position.width, minWidth: "40px" }}
                            >
                              <span className="text-white text-xs font-medium truncate">{project.title}</span>
                            </div>
                          )}
                          <div className="absolute inset-0 flex">
                            {daysInMonth.map((day, i) => (
                              <div
                                key={i}
                                className={`flex-1 border-r last:border-r-0 ${
                                  format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
                                    ? "bg-blue-50/50"
                                    : ""
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50">
              <div className="flex items-center gap-6 text-sm">
                <span className="font-medium">Legenda:</span>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span>Alta priorità</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span>Media priorità</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>Bassa priorità</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
