import { AppLayout } from "@/components/layout/AppLayout";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Flag, Tag, User as UserIcon, Plus, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksApi } from "@/lib/api";

export default function Tasks() {
  const queryClient = useQueryClient();
  const [newTask, setNewTask] = useState("");

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: tasksApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: tasksApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setNewTask("");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => tasksApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const toggleTask = (id: string, done: boolean) => {
    updateMutation.mutate({ id, data: { done: !done } });
  };

  const handleAddTask = () => {
    if (newTask.trim()) {
      createMutation.mutate({ title: newTask, done: false, dueDate: "No Date", tag: "General" });
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="w-full px-8 py-12">
        <div className="flex items-center gap-3 mb-8">
           <span className="text-4xl">✅</span>
           <h1 className="text-3xl font-bold text-foreground">Task List</h1>
        </div>

        <div className="bg-card border border-border/60 rounded-lg shadow-sm overflow-hidden">
           <div className="grid grid-cols-[30px_1fr_100px_100px_40px] gap-4 p-3 px-4 border-b border-border/60 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <div></div>
              <div>Task Name</div>
              <div>Due Date</div>
              <div>Tag</div>
              <div></div>
           </div>

           <div className="divide-y divide-border/40">
              {tasks.map((task: any) => (
                 <div key={task.id} data-testid={`row-task-${task.id}`} className="grid grid-cols-[30px_1fr_100px_100px_40px] gap-4 p-3 px-4 items-center group hover:bg-muted/50/50 transition-colors">
                    <div className="flex items-center justify-center">
                       <Checkbox 
                          data-testid={`checkbox-task-${task.id}`}
                          checked={task.done} 
                          onCheckedChange={() => toggleTask(task.id, task.done)}
                          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary border-muted-foreground/40"
                       />
                    </div>
                    <div className={`${task.done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                       {task.title}
                    </div>
                    <div className={`text-sm flex items-center gap-1.5 ${task.dueDate === 'Today' ? 'text-red-600' : 'text-muted-foreground'}`}>
                       <CalendarIcon className="h-3.5 w-3.5" />
                       {task.dueDate}
                    </div>
                    <div>
                       <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded border border-border">
                          {task.tag}
                       </span>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 text-muted-foreground cursor-pointer hover:bg-neutral-200 rounded p-1">
                       <UserIcon className="h-4 w-4" />
                    </div>
                 </div>
              ))}
              
              <div className="grid grid-cols-[30px_1fr_auto] gap-4 p-3 px-4 items-center text-muted-foreground hover:text-foreground cursor-text group" onClick={() => document.getElementById('new-task-input')?.focus()}>
                 <div className="flex items-center justify-center">
                    <Plus className="h-4 w-4" />
                 </div>
                 <Input 
                    id="new-task-input"
                    data-testid="input-new-task"
                    placeholder="Nuovo task..." 
                    className="border-none shadow-none focus-visible:ring-0 p-0 h-auto bg-transparent text-sm placeholder:text-muted-foreground"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    onKeyDown={(e) => {
                       if (e.key === 'Enter') {
                          handleAddTask();
                       }
                    }}
                 />
                 <Button 
                    type="button"
                    size="sm" 
                    onClick={(e) => { e.stopPropagation(); handleAddTask(); }}
                    disabled={!newTask.trim() || createMutation.isPending}
                    className={newTask.trim() ? "opacity-100" : "opacity-0 group-hover:opacity-100 transition-opacity"}
                 >
                    {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aggiungi"}
                 </Button>
              </div>
           </div>
        </div>
      </div>
    </AppLayout>
  );
}
