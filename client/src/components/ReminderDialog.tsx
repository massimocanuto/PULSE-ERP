import { useState, useEffect } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, AlertTriangle } from "lucide-react";
import { Link } from "wouter";

export function ReminderDialog() {
    const { activeReminders } = useNotifications();
    const [open, setOpen] = useState(false);

    const playGentleNotification = () => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;

            const ctx = new AudioContext();

            // Resume context if suspended (browser policy)
            if (ctx.state === 'suspended') {
                ctx.resume();
            }

            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, now); // A5

            // Pattern: 5 beeps over 5 seconds (Gentle)
            // Beep 1
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.1, now + 0.1);
            gain.gain.linearRampToValueAtTime(0, now + 0.5);

            // Beep 2
            gain.gain.setValueAtTime(0, now + 1);
            gain.gain.linearRampToValueAtTime(0.1, now + 1.1);
            gain.gain.linearRampToValueAtTime(0, now + 1.5);

            // Beep 3
            gain.gain.setValueAtTime(0, now + 2);
            gain.gain.linearRampToValueAtTime(0.1, now + 2.1);
            gain.gain.linearRampToValueAtTime(0, now + 2.5);

            // Beep 4
            gain.gain.setValueAtTime(0, now + 3);
            gain.gain.linearRampToValueAtTime(0.1, now + 3.1);
            gain.gain.linearRampToValueAtTime(0, now + 3.5);

            // Beep 5
            gain.gain.setValueAtTime(0, now + 4);
            gain.gain.linearRampToValueAtTime(0.1, now + 4.1);
            gain.gain.linearRampToValueAtTime(0, now + 4.5);

            osc.start(now);
            osc.stop(now + 5);

        } catch (error) {
            console.error("Audio playback failed", error);
        }
    };

    // Open the dialog only when NEW reminders appear (not previously seen in this session)
    useEffect(() => {
        if (activeReminders.length === 0) return;

        try {
            const seenIds = JSON.parse(sessionStorage.getItem("pulse_reminder_seen_ids") || "[]");
            const currentIds = activeReminders.map((t: any) => t.id);
            const hasNew = currentIds.some((id: string) => !seenIds.includes(id));

            if (hasNew) {
                setOpen(true);
                playGentleNotification();
            }
        } catch (e) {
            // Fallback if storage fails
            setOpen(true);
        }
    }, [activeReminders]);

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (!isOpen) {
            // When closing, mark all current active reminders as seen
            const currentIds = activeReminders.map((t: any) => t.id);
            sessionStorage.setItem("pulse_reminder_seen_ids", JSON.stringify(currentIds));
        }
    };

    if (activeReminders.length === 0) return null;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-amber-500 mb-2">
                        <AlertTriangle className="h-6 w-6" />
                        <DialogTitle>Promemoria Attivi</DialogTitle>
                    </div>
                    <DialogDescription>
                        Hai {activeReminders.length} attività in scadenza.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 max-h-[60vh] overflow-y-auto py-2">
                    {activeReminders.map((todo: any) => (
                        <div key={todo.id} className="p-3 border border-l-4 border-l-amber-500 rounded bg-amber-50/50 dark:bg-amber-950/30 dark:border-l-amber-600">
                            <h4 className="font-semibold text-sm">{todo.title}</h4>
                            {todo.description && <p className="text-xs text-muted-foreground truncate">{todo.description}</p>}
                            <div className="flex items-center text-xs text-muted-foreground mt-2 gap-3">
                                <span className="flex items-center"><Calendar className="h-3 w-3 mr-1" /> {new Date(todo.dueDate!).toLocaleDateString()}</span>
                                <span className="flex items-center"><Clock className="h-3 w-3 mr-1" /> {new Date(todo.dueDate!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>
                    ))}
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Link href="/projects">
                        <Button variant="outline" className="w-full sm:w-auto" onClick={() => handleOpenChange(false)}>Vai ai Task</Button>
                    </Link>
                    <Button variant="secondary" className="w-full sm:w-auto" onClick={() => handleOpenChange(false)}>Chiudi</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
