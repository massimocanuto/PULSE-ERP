import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { useState, useEffect } from "react";
import { FolderOpen, Clock, AlertCircle, Loader2, Timer, CheckCircle, ListTodo, User, Mail, FileText, File, FileImage, TrendingUp, TrendingDown, Minus, Circle, Eye, X, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format, differenceInDays, parseISO, isValid } from "date-fns";
import { it } from "date-fns/locale";
import { MountainProgress } from "@/components/MountainProgress";

export default function SharedProject() {
  const [, params] = useRoute("/shared/project/:token");
  const token = params?.token;
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [previewDoc, setPreviewDoc] = useState<any>(null);

  const { data: project, isLoading, error } = useQuery({
    queryKey: ["shared-project", token],
    queryFn: async () => {
      const res = await fetch(`/api/shared/project/${token}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Errore nel caricamento");
      }
      return res.json();
    },
    enabled: !!token,
  });

  useEffect(() => {
    if (!project?.shareExpiresAt) return;
    
    const updateCountdown = () => {
      const now = new Date().getTime();
      const expiry = new Date(project.shareExpiresAt).getTime();
      const diff = expiry - now;
      
      if (diff <= 0) {
        setTimeRemaining("Scaduto");
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      if (hours > 24) {
        const days = Math.floor(hours / 24);
        setTimeRemaining(`${days}g ${hours % 24}h`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(interval);
  }, [project?.shareExpiresAt]);

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
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#5d7286' }}>
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl border-0">
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
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#5d7286' }}>
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl border-0">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Progetto non disponibile</h2>
            <p className="text-muted-foreground text-center">
              {(error as Error).message || "Il link potrebbe essere scaduto o non valido."}
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
  const isOnTrack = timeProgress ? progress >= timeProgress.percent : true;
  const isBehind = timeProgress ? timeProgress.percent > progress + 15 : false;

  const getDocIcon = (fileType: string) => {
    if (fileType?.includes('image')) return <FileImage className="h-5 w-5 text-blue-500" />;
    if (fileType?.includes('pdf')) return <File className="h-5 w-5 text-red-500" />;
    return <FileText className="h-5 w-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const canPreview = (fileType: string) => {
    return fileType?.includes('image') || fileType?.includes('pdf');
  };

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: '#5d7286' }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Progetto Condiviso</h1>
          {project?.shareExpiresAt && (
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground bg-white/60 px-3 py-1.5 rounded-full">
              <Timer className="h-4 w-4" />
              <span>Scade tra: <strong>{timeRemaining}</strong></span>
            </div>
          )}
        </div>

        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm mb-6">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
                  <FolderOpen className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">{project?.title}</CardTitle>
                  {project?.owner && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <User className="h-3 w-3" />
                      {project.owner}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {getStatusBadge(project?.status)}
                {project?.priority && getPriorityBadge(project.priority)}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full grid grid-cols-4 mb-4">
                <TabsTrigger value="overview">Panoramica</TabsTrigger>
                <TabsTrigger value="tasks">
                  Attività ({totalTasks})
                </TabsTrigger>
                <TabsTrigger value="documents">
                  Documenti ({project?.documents?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="emails">
                  Email ({project?.emails?.length || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {project?.notes && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Descrizione</h3>
                    <p className="text-sm">{project.notes}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {project?.startDate && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Data Inizio</p>
                      <p className="text-sm font-medium">
                        {format(new Date(project.startDate), "d MMM yyyy", { locale: it })}
                      </p>
                    </div>
                  )}
                  {project?.dueDate && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Scadenza</p>
                      <p className="text-sm font-medium">
                        {format(new Date(project.dueDate), "d MMM yyyy", { locale: it })}
                      </p>
                    </div>
                  )}
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Attività</p>
                    <p className="text-sm font-medium">{completedTasks.length}/{totalTasks}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Progresso</p>
                    <p className="text-sm font-medium">{Math.round(progress)}%</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium">Avanzamento Attività</h3>
                      <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2 [&>div]:bg-[#5d7286]" />
                  </div>
                  
                  {timeProgress && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium flex items-center gap-2">
                          Avanzamento Temporale
                          {isBehind ? (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 animate-pulse">
                              <TrendingDown className="h-3 w-3" /> In ritardo
                            </span>
                          ) : isOnTrack ? (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                              <TrendingUp className="h-3 w-3" /> In linea
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                              <Minus className="h-3 w-3" /> Da monitorare
                            </span>
                          )}
                        </h3>
                        <span className={`text-sm font-medium ${isBehind ? 'text-red-600' : isOnTrack ? 'text-green-600' : 'text-orange-600'}`}>
                          {timeProgress.percent}% ({timeProgress.elapsed}/{timeProgress.total}g)
                        </span>
                      </div>
                      <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-200">
                        <div 
                          className={`h-full transition-all ${isBehind ? 'bg-red-500 animate-pulse' : isOnTrack ? 'bg-green-500' : 'bg-orange-500'}`}
                          style={{ width: `${timeProgress.percent}%` }}
                        />
                        <div 
                          className="absolute top-0 h-full w-1 bg-blue-600 shadow-sm"
                          style={{ left: `${Math.min(progress, 100)}%` }}
                          title={`Progresso attività: ${Math.round(progress)}%`}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Inizio</span>
                        <span className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          Progresso attività
                        </span>
                        <span>Scadenza</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  <h3 className="text-sm font-medium mb-3">Progresso Montagna</h3>
                  <MountainProgress 
                    projectTitle={project?.title || "Progetto"}
                    tasks={allTasks.map((t: any) => ({ title: t.title, done: t.completed || t.done }))}
                  />
                </div>
              </TabsContent>

              <TabsContent value="tasks" className="space-y-6">
                {pendingTasks.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Circle className="h-4 w-4 text-orange-500" />
                      Da Eseguire ({pendingTasks.length})
                    </h3>
                    <div className="space-y-2">
                      {pendingTasks.map((task: any) => (
                        <div
                          key={task.id}
                          className="flex items-center gap-3 p-3 rounded-lg border bg-orange-50 border-orange-200"
                        >
                          <div className="h-5 w-5 rounded-full flex items-center justify-center border-2 border-orange-400">
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{task.title}</p>
                            {task.dueDate && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Clock className="h-3 w-3" />
                                {format(new Date(task.dueDate), "d MMM yyyy", { locale: it })}
                              </p>
                            )}
                          </div>
                          {task.priority && getPriorityBadge(task.priority)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {completedTasks.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Completate ({completedTasks.length})
                    </h3>
                    <div className="space-y-2">
                      {completedTasks.map((task: any) => (
                        <div
                          key={task.id}
                          className="flex items-center gap-3 p-3 rounded-lg border bg-green-50 border-green-200"
                        >
                          <div className="h-5 w-5 rounded-full flex items-center justify-center bg-green-500">
                            <CheckCircle className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm line-through text-muted-foreground">{task.title}</p>
                            {task.dueDate && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Clock className="h-3 w-3" />
                                {format(new Date(task.dueDate), "d MMM yyyy", { locale: it })}
                              </p>
                            )}
                          </div>
                          {task.priority && getPriorityBadge(task.priority)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {allTasks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <ListTodo className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nessuna attività per questo progetto</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="documents" className="space-y-4">
                {project?.documents && project.documents.length > 0 ? (
                  <div className="space-y-2">
                    {project.documents.map((doc: any) => (
                      <div
                        key={doc.id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-white hover:bg-muted/50 transition-colors"
                      >
                        {getDocIcon(doc.fileType)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{doc.title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {doc.fileSize && <span>{formatFileSize(doc.fileSize)}</span>}
                            {doc.addedAt && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(doc.addedAt), "d MMM yyyy", { locale: it })}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {canPreview(doc.fileType) && doc.filePath && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setPreviewDoc(doc)}
                              className="h-8"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Anteprima
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nessun documento per questo progetto</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="emails" className="space-y-4">
                {project?.emails && project.emails.length > 0 ? (
                  <div className="space-y-2">
                    {project.emails.map((email: any) => (
                      <div
                        key={email.id}
                        className="flex items-start gap-3 p-3 rounded-lg border bg-white"
                      >
                        <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {email.emailSubject || "Nessun oggetto"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            Da: {email.emailFrom}
                          </p>
                          {email.emailPreview && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {email.emailPreview}
                            </p>
                          )}
                          {email.emailDate && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(email.emailDate), "d MMM yyyy HH:mm", { locale: it })}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nessuna email per questo progetto</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

      </div>

      <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {previewDoc && getDocIcon(previewDoc.fileType)}
              {previewDoc?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto min-h-[400px]">
            {previewDoc?.fileType?.includes('image') && previewDoc.filePath && (
              <img 
                src={previewDoc.filePath} 
                alt={previewDoc.title}
                className="max-w-full h-auto mx-auto"
              />
            )}
            {previewDoc?.fileType?.includes('pdf') && previewDoc.filePath && (
              <iframe
                src={previewDoc.filePath}
                className="w-full h-[70vh] border-0"
                title={previewDoc.title}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
