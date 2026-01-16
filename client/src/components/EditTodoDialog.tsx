import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Clock, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface EditTodoDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    todo: any;
    onSave: (id: string, data: any) => void;
    onDelete?: (id: string) => void;
}

export function EditTodoDialog({ open, onOpenChange, todo, onSave, onDelete }: EditTodoDialogProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("medium");
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [time, setTime] = useState("");

    useEffect(() => {
        if (todo) {
            setTitle(todo.title || "");
            setDescription(todo.description || "");
            setPriority(todo.priority || "medium");

            if (todo.dueDate) {
                const d = new Date(todo.dueDate);
                setDate(d);
                setTime(d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }));
            } else {
                setDate(undefined);
                setTime("");
            }
        }
    }, [todo, open]);

    const handleSave = () => {
        let newDueDate = todo?.dueDate;

        if (date) {
            const d = new Date(date);
            if (time) {
                const [h, m] = time.split(':').map(Number);
                d.setHours(h, m);
            } else {
                d.setHours(9, 0); // Default to 9 AM if no time
            }
            newDueDate = d.toISOString();
        } else {
            newDueDate = null;
        }

        onSave(todo.id, {
            title,
            description,
            priority,
            dueDate: newDueDate
        });
        onOpenChange(false);
    };

    if (!todo) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Modifica Attività</DialogTitle>
                    <DialogDescription>
                        Modifica i dettagli dell'attività selezionata
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Titolo</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Cosa devi fare?"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Descrizione / Note</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Dettagli aggiuntivi..."
                            className="resize-none min-h-[100px]"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Priorità</Label>
                            <Select value={priority} onValueChange={setPriority}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Bassa</SelectItem>
                                    <SelectItem value="medium">Media</SelectItem>
                                    <SelectItem value="high">Alta</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Data Scadenza</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date ? format(date, "d MMM yyyy", { locale: it }) : "Seleziona data"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={setDate}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <Label>Orario</Label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="time"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex sm:justify-between items-center gap-2">
                    {onDelete && (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                                if (confirm('Sei sicuro di voler eliminare questa attività?')) {
                                    onDelete(todo.id);
                                    onOpenChange(false);
                                }
                            }}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Elimina
                        </Button>
                    )}
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
                        <Button onClick={handleSave}>Salva Modifiche</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
