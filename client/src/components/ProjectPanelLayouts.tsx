import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import {
  Briefcase, Check, X, Pencil, Share2, Trash2, Plus, ListTodo,
  Calendar, MessageCircle, Euro, Mail, FileText, Mountain, Users,
  ChevronDown, ChevronRight, Clock, Target, TrendingUp, Activity,
  LayoutGrid, Layers, BarChart3, Settings
} from "lucide-react";
import { MountainProgress } from "./MountainProgress";
import { TaskComments } from "./TaskComments";

interface ProjectPanelProps {
  project: any;
  tasks: any[];
  isEditing: boolean;
  editForm: { title: string; status: string; priority: string; dueDate: string };
  setEditForm: (form: any) => void;
  setIsEditing: (v: boolean) => void;
  saveEdit: () => void;
  startEditing: () => void;
  handleShare: () => void;
  deleteProject: () => void;
  closePanel: () => void;
  getProgress: () => number;
  newTask: string;
  setNewTask: (v: string) => void;
  handleAddTask: () => void;
  toggleTask: (id: string, done: boolean) => void;
  deleteTask: (id: string) => void;
  updateTask: (id: string, data: any) => void;
  authUserId: string;
  activeTab: string;
  setActiveTab: (v: string) => void;
  renderFinanceTab: () => React.ReactNode;
  renderEmailsTab: () => React.ReactNode;
  renderDocumentsTab: () => React.ReactNode;
}

function PanelHeader({ 
  project, isEditing, editForm, setEditForm, setIsEditing, saveEdit, 
  startEditing, handleShare, deleteProject, closePanel, getProgress 
}: any) {
  const progress = getProgress();
  
  return (
    <div className="flex-shrink-0">
      <div className="px-4 py-3 bg-gradient-to-r from-violet-50/90 to-purple-50/90 border-b border-violet-100/50">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-md flex-shrink-0 ${
              project?.status === 'Done' ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
              project?.status === 'In Progress' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 
              'bg-gradient-to-br from-gray-400 to-gray-500'
            }`}>
              <Briefcase className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <Input
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="font-semibold text-sm h-8 bg-white border-violet-200 focus:ring-violet-300"
                  autoFocus
                />
              ) : (
                <h3 className="font-semibold text-base text-foreground truncate">{project?.title}</h3>
              )}
              {!isEditing && (
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                    project?.status === 'Done' ? 'bg-green-100 text-green-700' :
                    project?.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {project?.status === 'Not Started' ? 'Da Iniziare' : project?.status === 'In Progress' ? 'In Corso' : 'Completato'}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {isEditing ? (
              <>
                <button onClick={saveEdit} className="p-2 rounded-lg bg-violet-500 text-white hover:bg-violet-600 transition-colors shadow-sm">
                  <Check className="h-4 w-4" />
                </button>
                <button onClick={() => setIsEditing(false)} className="p-2 rounded-lg text-muted-foreground hover:bg-white/80 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <button onClick={startEditing} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/80 transition-colors">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={handleShare} className="p-2 rounded-lg text-muted-foreground hover:text-blue-600 hover:bg-white/80 transition-colors" title="Condividi">
                  <Share2 className="h-4 w-4" />
                </button>
                <button onClick={deleteProject} className="p-2 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-white/80 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
                <button onClick={closePanel} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/80 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="px-4 py-2 bg-white/50 border-b border-border">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-muted-foreground font-medium">Progresso</span>
          <span className="font-semibold text-violet-600">{progress}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              progress === 100 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
              progress > 50 ? 'bg-gradient-to-r from-violet-500 to-purple-500' :
              'bg-gradient-to-r from-blue-500 to-violet-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function DefaultLayout(props: ProjectPanelProps) {
  const { project, tasks, isEditing, editForm, setEditForm, activeTab, setActiveTab } = props;
  
  return (
    <>
      <PanelHeader {...props} />
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="ml-4 mr-4 mt-2 h-8 grid grid-cols-6 gap-0.5">
          <TabsTrigger value="overview" className="text-[10px] h-7 px-1">Info</TabsTrigger>
          <TabsTrigger value="tasks" className="text-[10px] h-7 px-1">Attività</TabsTrigger>
          <TabsTrigger value="mountain" className="text-[10px] h-7 px-1">
            <Mountain className="h-3 w-3 mr-0.5" />
            Grafico
          </TabsTrigger>
          <TabsTrigger value="finance" className="text-[10px] h-7 px-1">
            <Euro className="h-3 w-3 mr-0.5" />
            Finanza
          </TabsTrigger>
          <TabsTrigger value="emails" className="text-[10px] h-7 px-1">
            <Mail className="h-3 w-3 mr-0.5" />
            Email
          </TabsTrigger>
          <TabsTrigger value="documents" className="text-[10px] h-7 px-1">
            <FileText className="h-3 w-3 mr-0.5" />
            Docs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex-1 p-4 overflow-auto">
          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Stato</label>
                <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Not Started">Da Iniziare</SelectItem>
                    <SelectItem value="In Progress">In Corso</SelectItem>
                    <SelectItem value="Done">Completato</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Priorità</label>
                <Select value={editForm.priority} onValueChange={(v) => setEditForm({ ...editForm, priority: v })}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Bassa</SelectItem>
                    <SelectItem value="Medium">Media</SelectItem>
                    <SelectItem value="High">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Scadenza</label>
                <Input
                  type="date"
                  value={editForm.dueDate}
                  onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4">
                <span className={`px-2 py-0.5 rounded text-xs font-medium 
                  ${project.status === 'Not Started' ? 'bg-neutral-200 text-neutral-700' : 
                    project.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 
                    'bg-green-100 text-green-700'}
                `}>
                  {project.status === 'Not Started' ? 'Da Iniziare' : project.status === 'In Progress' ? 'In Corso' : 'Completato'}
                </span>
                <span className={`text-xs px-1.5 py-0.5 rounded border 
                  ${project.priority === 'High' ? 'bg-red-50 text-red-700 border-red-100' : 
                    project.priority === 'Medium' ? 'bg-orange-50 text-orange-700 border-orange-100' : 
                    'bg-muted/50 text-muted-foreground border-neutral-100'}
                `}>
                  {project.priority === 'High' ? 'Alta' : project.priority === 'Medium' ? 'Media' : 'Bassa'}
                </span>
              </div>

              <div className="text-sm text-muted-foreground mb-4">
                <Mountain className="inline h-4 w-4 mr-1" />
                Progresso Attività
              </div>
              
              <MountainProgress 
                projectTitle={project.title}
                tasks={tasks}
              />
              
              <div className="mt-4 pt-4 border-t">
                <div className="text-xs text-muted-foreground mb-2">Team</div>
                <div className="flex -space-x-2">
                  {(project.teamMembers || []).map((initial: string, i: number) => (
                    <div key={i} className="h-8 w-8 rounded-full bg-neutral-200 border-2 border-white flex items-center justify-center text-xs font-bold text-muted-foreground">
                      {initial}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-4 text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Scadenza: {project.dueDate}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="tasks" className="flex-1 flex flex-col overflow-hidden">
          <TasksSection {...props} />
        </TabsContent>

        <TabsContent value="mountain" className="flex-1 p-4 overflow-auto">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mountain className="h-4 w-4" />
              <span>Progresso Attività</span>
              <span className="ml-auto font-medium text-foreground">{props.getProgress()}%</span>
            </div>
            <MountainProgress 
              projectTitle={project.title}
              tasks={tasks}
            />
            <div className="pt-4 border-t">
              <div className="text-xs text-muted-foreground mb-2">Riepilogo</div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-muted/50 rounded-lg p-2">
                  <p className="text-lg font-bold text-foreground">{tasks.length}</p>
                  <p className="text-[10px] text-muted-foreground">Totali</p>
                </div>
                <div className="bg-green-50 rounded-lg p-2">
                  <p className="text-lg font-bold text-green-600">{tasks.filter(t => t.done).length}</p>
                  <p className="text-[10px] text-muted-foreground">Completate</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-2">
                  <p className="text-lg font-bold text-orange-600">{tasks.filter(t => !t.done).length}</p>
                  <p className="text-[10px] text-muted-foreground">In Corso</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="finance" className="flex-1 flex flex-col overflow-hidden">
          {props.renderFinanceTab()}
        </TabsContent>

        <TabsContent value="emails" className="flex-1 flex flex-col overflow-hidden">
          {props.renderEmailsTab()}
        </TabsContent>

        <TabsContent value="documents" className="flex-1 flex flex-col overflow-hidden">
          {props.renderDocumentsTab()}
        </TabsContent>
      </Tabs>
    </>
  );
}

export function NotionLayout(props: ProjectPanelProps) {
  const { project, tasks, isEditing, editForm, setEditForm } = props;
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    overview: true,
    tasks: true,
    finance: false,
    emails: false,
    documents: false
  });

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const completedTasks = tasks.filter(t => t.done).length;
  const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  return (
    <>
      <PanelHeader {...props} />
      <div className="p-3 bg-gradient-to-r from-violet-50/50 to-purple-50/50 border-b">
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-white/60 rounded-lg p-2">
            <p className="text-lg font-bold text-violet-600">{progress}%</p>
            <p className="text-[9px] text-muted-foreground">Progresso</p>
          </div>
          <div className="bg-white/60 rounded-lg p-2">
            <p className="text-lg font-bold text-blue-600">{tasks.length}</p>
            <p className="text-[9px] text-muted-foreground">Attività</p>
          </div>
          <div className="bg-white/60 rounded-lg p-2">
            <p className="text-lg font-bold text-green-600">{completedTasks}</p>
            <p className="text-[9px] text-muted-foreground">Completate</p>
          </div>
          <div className="bg-white/60 rounded-lg p-2">
            <p className="text-lg font-bold text-amber-600">{project?.dueDate ? new Date(project.dueDate).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }) : '-'}</p>
            <p className="text-[9px] text-muted-foreground">Scadenza</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          <Collapsible open={openSections.overview} onOpenChange={() => toggleSection('overview')}>
            <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 hover:bg-muted/50 rounded-lg text-sm font-medium">
              {openSections.overview ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <Target className="h-4 w-4 text-violet-500" />
              Panoramica
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-8 pr-2 pb-2">
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Team:</span>
                  <div className="flex -space-x-1">
                    {(project.teamMembers || []).slice(0, 3).map((m: string, i: number) => (
                      <div key={i} className="h-6 w-6 rounded-full bg-violet-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-violet-600">{m}</div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Scadenza:</span>
                  <span>{project.dueDate || 'Non impostata'}</span>
                </div>
                <MountainProgress projectTitle={project.title} tasks={tasks} />
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Collapsible open={openSections.tasks} onOpenChange={() => toggleSection('tasks')}>
            <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 hover:bg-muted/50 rounded-lg text-sm font-medium">
              {openSections.tasks ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <ListTodo className="h-4 w-4 text-blue-500" />
              Attività ({completedTasks}/{tasks.length})
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-2 pr-2 pb-2">
              <div className="space-y-1 pt-2">
                {tasks.map((task: any) => (
                  <div key={task.id} className={`flex items-center gap-2 p-2 rounded-lg text-sm ${task.done ? 'bg-green-50/50' : 'hover:bg-muted/50'}`}>
                    <Checkbox checked={task.done} onCheckedChange={() => props.toggleTask(task.id, task.done)} className="h-4 w-4" />
                    <span className={task.done ? 'line-through text-muted-foreground' : ''}>{task.title}</span>
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <Input placeholder="Nuova attività..." value={props.newTask} onChange={(e) => props.setNewTask(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && props.handleAddTask()} className="h-8 text-xs" />
                  <Button onClick={props.handleAddTask} size="sm" className="h-8"><Plus className="h-3 w-3" /></Button>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Collapsible open={openSections.finance} onOpenChange={() => toggleSection('finance')}>
            <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 hover:bg-muted/50 rounded-lg text-sm font-medium">
              {openSections.finance ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <Euro className="h-4 w-4 text-green-500" />
              Finanza
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-2 pr-2 pb-2">
              <div className="pt-2">
                {props.renderFinanceTab()}
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Collapsible open={openSections.emails} onOpenChange={() => toggleSection('emails')}>
            <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 hover:bg-muted/50 rounded-lg text-sm font-medium">
              {openSections.emails ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <Mail className="h-4 w-4 text-amber-500" />
              Email
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-2 pr-2 pb-2">
              <div className="pt-2">
                {props.renderEmailsTab()}
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Collapsible open={openSections.documents} onOpenChange={() => toggleSection('documents')}>
            <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 hover:bg-muted/50 rounded-lg text-sm font-medium">
              {openSections.documents ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <FileText className="h-4 w-4 text-purple-500" />
              Documenti
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-2 pr-2 pb-2">
              <div className="pt-2">
                {props.renderDocumentsTab()}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>
    </>
  );
}

export function LinearLayout(props: ProjectPanelProps) {
  const { project, tasks } = props;
  const completedTasks = tasks.filter(t => t.done).length;
  const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const [activeSection, setActiveSection] = useState<'tasks' | 'timeline' | 'info'>('tasks');

  return (
    <>
      <PanelHeader {...props} />
      <div className="px-3 py-2 border-b bg-muted/20">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Progress value={progress} className="h-1.5" />
          </div>
          <span className="text-xs font-medium text-muted-foreground">{progress}%</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
            project?.priority === 'High' ? 'bg-red-100 text-red-700' :
            project?.priority === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
          }`}>
            {project?.priority === 'High' ? 'P1' : project?.priority === 'Medium' ? 'P2' : 'P3'}
          </span>
        </div>
      </div>

      <div className="flex border-b">
        <button onClick={() => setActiveSection('tasks')} className={`flex-1 py-2 text-xs font-medium border-b-2 ${activeSection === 'tasks' ? 'border-violet-500 text-violet-600' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
          <ListTodo className="h-3.5 w-3.5 mx-auto mb-0.5" />
          Attività
        </button>
        <button onClick={() => setActiveSection('timeline')} className={`flex-1 py-2 text-xs font-medium border-b-2 ${activeSection === 'timeline' ? 'border-violet-500 text-violet-600' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
          <Activity className="h-3.5 w-3.5 mx-auto mb-0.5" />
          Timeline
        </button>
        <button onClick={() => setActiveSection('info')} className={`flex-1 py-2 text-xs font-medium border-b-2 ${activeSection === 'info' ? 'border-violet-500 text-violet-600' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
          <Settings className="h-3.5 w-3.5 mx-auto mb-0.5" />
          Info
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <ScrollArea className="flex-1">
          {activeSection === 'tasks' && (
            <div className="p-3 space-y-1">
              {tasks.map((task: any) => (
                <div key={task.id} className={`flex items-center gap-2 p-2 rounded text-xs group ${task.done ? 'opacity-50' : ''}`}>
                  <Checkbox checked={task.done} onCheckedChange={() => props.toggleTask(task.id, task.done)} className="h-3.5 w-3.5" />
                  <span className={`flex-1 ${task.done ? 'line-through' : ''}`}>{task.title}</span>
                  <button onClick={() => props.deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-600">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2 mt-3 pt-3 border-t">
                <Input placeholder="+ Aggiungi..." value={props.newTask} onChange={(e) => props.setNewTask(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && props.handleAddTask()} className="h-7 text-xs" />
              </div>
            </div>
          )}
          {activeSection === 'timeline' && (
            <div className="p-3">
              {props.renderFinanceTab()}
            </div>
          )}
          {activeSection === 'info' && (
            <div className="p-3 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Stato</label>
                <div className={`text-sm font-medium px-2 py-1 rounded inline-block ${
                  project.status === 'Done' ? 'bg-green-100 text-green-700' :
                  project.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {project.status === 'Not Started' ? 'Da Iniziare' : project.status === 'In Progress' ? 'In Corso' : 'Completato'}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Scadenza</label>
                <p className="text-sm flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> {project.dueDate || 'Non impostata'}</p>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Team</label>
                <div className="flex -space-x-1">
                  {(project.teamMembers || []).map((m: string, i: number) => (
                    <div key={i} className="h-6 w-6 rounded-full bg-violet-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-violet-600">{m}</div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </ScrollArea>

        <div className="w-[120px] border-l p-2 bg-muted/30 space-y-2">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Quick Stats</div>
          <div className="bg-white rounded p-2 text-center">
            <p className="text-lg font-bold text-violet-600">{tasks.length}</p>
            <p className="text-[9px] text-muted-foreground">Totali</p>
          </div>
          <div className="bg-white rounded p-2 text-center">
            <p className="text-lg font-bold text-green-600">{completedTasks}</p>
            <p className="text-[9px] text-muted-foreground">Fatte</p>
          </div>
          <div className="bg-white rounded p-2 text-center">
            <p className="text-lg font-bold text-amber-600">{tasks.length - completedTasks}</p>
            <p className="text-[9px] text-muted-foreground">Aperte</p>
          </div>
        </div>
      </div>
    </>
  );
}

export function FinanzaLayout(props: ProjectPanelProps) {
  const { project, tasks, activeTab, setActiveTab } = props;
  const completedTasks = tasks.filter(t => t.done).length;
  const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  return (
    <>
      <PanelHeader {...props} />
      <div className="p-3 border-b bg-muted/20">
        <div className="grid grid-cols-4 gap-2">
          <Card className="bg-violet-50 border-violet-100">
            <CardContent className="p-2 text-center">
              <TrendingUp className="h-4 w-4 mx-auto text-violet-500 mb-1" />
              <p className="text-lg font-bold text-violet-600">{progress}%</p>
              <p className="text-[9px] text-muted-foreground">Progresso</p>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 border-blue-100">
            <CardContent className="p-2 text-center">
              <ListTodo className="h-4 w-4 mx-auto text-blue-500 mb-1" />
              <p className="text-lg font-bold text-blue-600">{tasks.length}</p>
              <p className="text-[9px] text-muted-foreground">Attività</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-100">
            <CardContent className="p-2 text-center">
              <Check className="h-4 w-4 mx-auto text-green-500 mb-1" />
              <p className="text-lg font-bold text-green-600">{completedTasks}</p>
              <p className="text-[9px] text-muted-foreground">Completate</p>
            </CardContent>
          </Card>
          <Card className="bg-amber-50 border-amber-100">
            <CardContent className="p-2 text-center">
              <Clock className="h-4 w-4 mx-auto text-amber-500 mb-1" />
              <p className="text-lg font-bold text-amber-600">{tasks.length - completedTasks}</p>
              <p className="text-[9px] text-muted-foreground">In Attesa</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="ml-4 mr-4 mt-2 h-8 grid grid-cols-6 gap-0.5">
          <TabsTrigger value="tasks" className="text-[10px] h-7 px-1">Attività</TabsTrigger>
          <TabsTrigger value="mountain" className="text-[10px] h-7 px-1">
            <Mountain className="h-3 w-3 mr-0.5" />
            Grafico
          </TabsTrigger>
          <TabsTrigger value="overview" className="text-[10px] h-7 px-1">Info</TabsTrigger>
          <TabsTrigger value="finance" className="text-[10px] h-7 px-1">Finanza</TabsTrigger>
          <TabsTrigger value="emails" className="text-[10px] h-7 px-1">Email</TabsTrigger>
          <TabsTrigger value="documents" className="text-[10px] h-7 px-1">Docs</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="flex-1 flex flex-col overflow-hidden">
          <TasksSection {...props} />
        </TabsContent>

        <TabsContent value="mountain" className="flex-1 p-4 overflow-auto">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mountain className="h-4 w-4" />
              <span>Progresso Attività</span>
              <span className="ml-auto font-medium text-foreground">{progress}%</span>
            </div>
            <MountainProgress 
              projectTitle={project.title}
              tasks={tasks}
            />
          </div>
        </TabsContent>

        <TabsContent value="overview" className="flex-1 p-4 overflow-auto">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Priorità</label>
              <span className={`text-sm font-medium px-2 py-1 rounded inline-block ${
                project.priority === 'High' ? 'bg-red-100 text-red-700' :
                project.priority === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {project.priority === 'High' ? 'Alta' : project.priority === 'Medium' ? 'Media' : 'Bassa'}
              </span>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Scadenza</label>
              <p className="text-sm flex items-center gap-2"><Calendar className="h-4 w-4" /> {project.dueDate || '-'}</p>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Team</label>
              <div className="flex -space-x-2">
                {(project.teamMembers || []).map((m: string, i: number) => (
                  <div key={i} className="h-8 w-8 rounded-full bg-violet-100 border-2 border-white flex items-center justify-center text-xs font-bold text-violet-600">{m}</div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="finance" className="flex-1 flex flex-col overflow-hidden">
          {props.renderFinanceTab()}
        </TabsContent>

        <TabsContent value="emails" className="flex-1 flex flex-col overflow-hidden">
          {props.renderEmailsTab()}
        </TabsContent>

        <TabsContent value="documents" className="flex-1 flex flex-col overflow-hidden">
          {props.renderDocumentsTab()}
        </TabsContent>
      </Tabs>
    </>
  );
}

function TaskDateEditor({ task, updateTask }: { task: any; updateTask: (id: string, data: any) => void }) {
  const [startDate, setStartDate] = useState(task.startDate || '');
  const [dueDate, setDueDate] = useState(task.dueDate || '');
  
  const handleSave = () => {
    updateTask(task.id, { startDate, dueDate });
  };
  
  return (
    <div className="space-y-3 p-1">
      <div className="text-xs font-medium text-foreground mb-2">Pianifica attività</div>
      <div className="space-y-2">
        <div>
          <label className="text-[10px] text-muted-foreground block mb-1">Data Inizio</label>
          <Input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)} 
            className="h-7 text-xs"
          />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground block mb-1">Scadenza</label>
          <Input 
            type="date" 
            value={dueDate} 
            onChange={(e) => setDueDate(e.target.value)} 
            className="h-7 text-xs"
          />
        </div>
      </div>
      <Button onClick={handleSave} size="sm" className="w-full h-7 text-xs">
        Salva Date
      </Button>
    </div>
  );
}

function formatDateCompact(dateStr: string | null | undefined): string {
  if (!dateStr || dateStr === 'No Date') return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
  } catch {
    return '';
  }
}

function TasksSection(props: ProjectPanelProps) {
  const { project, tasks, newTask, setNewTask, handleAddTask, toggleTask, deleteTask, updateTask, authUserId, getProgress } = props;
  
  return (
    <>
      <div className="p-3 border-b bg-muted/30">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {tasks.filter((t: any) => t.done).length}/{tasks.length} completate
          </span>
          <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full bg-violet-500 transition-all" style={{ width: `${getProgress()}%` }} />
            </div>
            <span className="text-muted-foreground font-medium">{getProgress()}%</span>
          </div>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1">
          {tasks.map((task: any) => (
            <div key={task.id} className={`flex items-center gap-2 p-2 rounded-lg group transition-all ${task.done ? 'bg-green-50/50' : 'hover:bg-muted/50'}`}>
              <Checkbox checked={task.done} onCheckedChange={() => toggleTask(task.id, task.done)} className="h-4 w-4" />
              <div className="flex-1 min-w-0">
                <span className={`text-xs block ${task.done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{task.title}</span>
                {(task.startDate || (task.dueDate && task.dueDate !== 'No Date')) && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">
                      {task.startDate && formatDateCompact(task.startDate)}
                      {task.startDate && task.dueDate && task.dueDate !== 'No Date' && ' → '}
                      {task.dueDate && task.dueDate !== 'No Date' && formatDateCompact(task.dueDate)}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="text-muted-foreground hover:text-violet-600 p-1 rounded hover:bg-violet-50">
                      <Calendar className="h-3 w-3" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-52" align="end">
                    <TaskDateEditor task={task} updateTask={updateTask} />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="text-muted-foreground hover:text-blue-600 p-1 rounded hover:bg-blue-50">
                      <MessageCircle className="h-3 w-3" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-96" align="end">
                    <TaskComments taskId={task.id} taskTitle={task.title} currentUserId={authUserId} />
                  </PopoverContent>
                </Popover>
                <button onClick={() => deleteTask(task.id)} className="text-muted-foreground hover:text-red-600 p-1 rounded hover:bg-red-50">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
          {tasks.length === 0 && (
            <div className="text-center py-8">
              <ListTodo className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground">Nessuna attività</p>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="px-3 py-2 border-t bg-muted/20">
        <div className="flex gap-2">
          <Input placeholder="Aggiungi attività..." value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddTask()} className="flex-1 h-8 text-xs" />
          <Button onClick={handleAddTask} size="sm" className="h-8 px-3"><Plus className="h-3.5 w-3.5" /></Button>
        </div>
      </div>
    </>
  );
}
