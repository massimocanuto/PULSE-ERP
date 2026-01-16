import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { useState } from "react";
import { FolderOpen, Clock, AlertCircle, Loader2, CheckCircle, ListTodo, User, Mail, FileText, File, FileImage, Eye, X, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format, differenceInDays, parseISO, isValid } from "date-fns";
import { it } from "date-fns/locale";
import { MountainProgress } from "@/components/MountainProgress";

export default function InternalProjectView() {
  const [, params] = useRoute("/internal/project/:id");
  const projectId = params?.id;
  const [previewDoc, setPreviewDoc] = useState<any>(null);

  const { data: project, isLoading, error } = useQuery({
    queryKey: ["internal-project", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/internal/project/${projectId}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Errore nel caricamento");
      }
      return res.json();
    },
    enabled: !!projectId,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Not Started":
        return <Badge variant="outline">Da Iniziare</Badge>;
      case "In Progress":
        return <Badge className="bg-blue-500">In Corso</Badge>;
      case "Done":
        return <Badge className="bg-green-500">Completato</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "High":
        return <Badge className="bg-red-500">Alta</Badge>;
      case "Medium":
        return <Badge className="bg-yellow-500">Media</Badge>;
      case "Low":
        return <Badge className="bg-gray-500">Bassa</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <Card className="w-full max-w-md bg-white shadow-lg border-0">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
            <p className="text-muted-foreground">Caricamento progetto...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <Card className="w-full max-w-md bg-white shadow-lg border-0">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Progetto non disponibile</h2>
            <p className="text-muted-foreground text-center">
              {(error as Error).message}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const allTasks = project?.tasks || [];
  const completedTasks = allTasks.filter((t: any) => t.completed || t.done);
  const pendingTasks = allTasks.filter((t: any) => !t.completed && !t.done);
  const totalTasks = allTasks.length;
  const progress = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;

  const getTimeProgress = () => {
    if (!project?.createdAt || !project?.dueDate || project.dueDate === 'TBD') return null;
    try {
      let startDate = new Date(project.createdAt);
      let endDate: Date;
      if (/^\d{4}-\d{2}-\d{2}$/.test(project.dueDate)) {
        endDate = parseISO(project.dueDate);
      } else {
        endDate = new Date(project.dueDate);
      }
      if (!isValid(startDate) || !isValid(endDate)) return null;
      
      const today = new Date();
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      
      const totalDays = differenceInDays(endDate, startDate);
      const elapsedDays = differenceInDays(today, startDate);
      
      if (totalDays <= 0) return { percent: 100, elapsed: elapsedDays, total: totalDays };
      
      const percent = Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)));
      return { percent, elapsed: elapsedDays, total: totalDays };
    } catch {
      return null;
    }
  };

  const timeProgress = getTimeProgress();

  const getDocIcon = (fileType: string) => {
    if (fileType?.includes('image')) return <FileImage className="h-5 w-5 text-blue-500" />;
    if (fileType?.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
    return <File className="h-5 w-5 text-gray-500" />;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-6xl mx-auto">
        <Card className="bg-white shadow-lg border-0 mb-6">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FolderOpen className="h-8 w-8 text-blue-600" />
                <div>
                  <CardTitle className="text-2xl">{project?.title}</CardTitle>
                  <p className="text-muted-foreground mt-1">{project?.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(project?.status)}
                {project?.priority && getPriorityBadge(project.priority)}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                <div className="p-2 bg-blue-100 rounded-full">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">{project?.clientName || "Non specificato"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                <div className="p-2 bg-amber-100 rounded-full">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Scadenza</p>
                  <p className="font-medium">
                    {project?.dueDate && project.dueDate !== 'TBD'
                      ? format(new Date(project.dueDate), "d MMMM yyyy", { locale: it })
                      : "Da definire"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                <div className="p-2 bg-green-100 rounded-full">
                  <ListTodo className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Task</p>
                  <p className="font-medium">{completedTasks.length}/{totalTasks} completati</p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Avanzamento lavori</span>
                <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>

            {timeProgress && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Tempo trascorso</span>
                  <span className="text-sm text-muted-foreground">{timeProgress.percent}%</span>
                </div>
                <Progress value={timeProgress.percent} className="h-2 bg-slate-200" />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mb-6">
          <MountainProgress 
            progress={progress} 
            title={project?.title || ""} 
            compact={true}
          />
        </div>

        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="w-full justify-start bg-white border mb-4">
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <ListTodo className="h-4 w-4" />
              Task ({allTasks.length})
            </TabsTrigger>
            <TabsTrigger value="emails" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email ({project?.emails?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documenti ({project?.documents?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks">
            <Card className="bg-white shadow-sm border-0">
              <CardContent className="pt-6">
                {allTasks.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nessun task per questo progetto</p>
                ) : (
                  <div className="space-y-3">
                    {allTasks.map((task: any) => (
                      <div 
                        key={task.id}
                        className={`p-4 rounded-lg border ${task.completed || task.done ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}
                      >
                        <div className="flex items-center gap-3">
                          {(task.completed || task.done) ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-slate-300" />
                          )}
                          <div className="flex-1">
                            <p className={`font-medium ${(task.completed || task.done) ? 'line-through text-muted-foreground' : ''}`}>
                              {task.title}
                            </p>
                            {task.dueDate && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Scadenza: {format(new Date(task.dueDate), "d MMM yyyy", { locale: it })}
                              </p>
                            )}
                          </div>
                          {getPriorityBadge(task.priority)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="emails">
            <Card className="bg-white shadow-sm border-0">
              <CardContent className="pt-6">
                {!project?.emails || project.emails.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nessuna email collegata</p>
                ) : (
                  <div className="space-y-3">
                    {project.emails.map((email: any) => (
                      <div key={email.id} className="p-4 rounded-lg border bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div className="flex items-start gap-3">
                          <Mail className="h-5 w-5 text-blue-500 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{email.emailSubject}</p>
                            <p className="text-sm text-muted-foreground">{email.emailFrom}</p>
                            {email.emailDate && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(new Date(email.emailDate), "d MMM yyyy HH:mm", { locale: it })}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card className="bg-white shadow-sm border-0">
              <CardContent className="pt-6">
                {!project?.documents || project.documents.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nessun documento allegato</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {project.documents.map((doc: any) => (
                      <div 
                        key={doc.id}
                        className="p-4 rounded-lg border bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                        onClick={() => setPreviewDoc(doc)}
                      >
                        <div className="flex items-center gap-3">
                          {getDocIcon(doc.fileType)}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{doc.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {doc.fileSize ? `${Math.round(doc.fileSize / 1024)} KB` : ""}
                            </p>
                          </div>
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{previewDoc?.title}</span>
              <Button variant="ghost" size="icon" onClick={() => setPreviewDoc(null)}>
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {previewDoc?.fileType?.includes('image') ? (
              <img 
                src={`/api/archivio/${previewDoc.documentId}/download`} 
                alt={previewDoc.title}
                className="max-w-full h-auto"
              />
            ) : previewDoc?.fileType?.includes('pdf') ? (
              <iframe
                src={`/api/archivio/${previewDoc.documentId}/download`}
                className="w-full h-[70vh]"
                title={previewDoc.title}
              />
            ) : (
              <div className="text-center py-12">
                <File className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Anteprima non disponibile</p>
                <Button asChild>
                  <a href={`/api/archivio/${previewDoc?.documentId}/download`} download>
                    <Download className="h-4 w-4 mr-2" />
                    Scarica file
                  </a>
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
