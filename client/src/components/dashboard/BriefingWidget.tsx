
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, Play, Square, Settings, Download, Volume2, AlarmClock } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { pulseVoice } from "@/lib/voiceAssistant";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import YouTube from 'react-youtube';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface BriefingWidgetProps {
    userName: string;
    data: {
        unreadEmails: number;
        tasksDueToday: number;
        overdueTasks: number;
        weather: { temp: number; condition: string };
    };
}

export function BriefingWidget({ userName, data }: BriefingWidgetProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isRinging, setIsRinging] = useState(false);

    // Lazy load settings from localStorage to prevent overwriting on mount
    const [alarmTime, setAlarmTime] = useState(() => localStorage.getItem("briefing_time") || "08:00");
    const [autoPlay, setAutoPlay] = useState(false);
    const [showConfig, setShowConfig] = useState(false);

    // Load saved days or default to full week
    const [selectedDays, setSelectedDays] = useState<string[]>(() => {
        const saved = localStorage.getItem("briefing_days");
        return saved ? JSON.parse(saved) : ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'];
    });

    const [useOpenAI, setUseOpenAI] = useState(() => localStorage.getItem("briefing_use_ai") === "true");
    const [openAIKey, setOpenAIKey] = useState(() => localStorage.getItem("briefing_openai_key") || "");
    const [selectedVoice, setSelectedVoice] = useState(() => localStorage.getItem("briefing_voice") || "alloy");

    const [youtubePlayer, setYoutubePlayer] = useState<any>(null);
    const [currentVolume, setCurrentVolume] = useState(20);
    const [secondsCounter, setSecondsCounter] = useState(0);
    const ALARM_VIDEO_ID = "26RIzBl0gPQ";

    // Progressive volume and timer logic
    useEffect(() => {
        let timerInterval: NodeJS.Timeout;

        if (isRinging) {
            timerInterval = setInterval(() => {
                setSecondsCounter(prev => {
                    const newSeconds = prev + 1;

                    // Specific logic: Increase volume every 20 seconds
                    if (newSeconds % 20 === 0) {
                        setCurrentVolume(prevVol => {
                            const newVol = Math.min(100, prevVol + 20); // Increase by 20%
                            if (selectedVoice === 'youtube' && youtubePlayer) {
                                youtubePlayer.setVolume(newVol);
                            }
                            // Sync system volume
                            fetch('/api/system/volume', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ volume: newVol })
                            }).catch(err => console.error("Failed to set system volume:", err));

                            return newVol;
                        });
                    }
                    return newSeconds;
                });
            }, 1000);
        } else {
            setSecondsCounter(0);
            setCurrentVolume(20);
        }

        return () => clearInterval(timerInterval);
    }, [isRinging, selectedVoice, youtubePlayer]);

    // Check URL params for auto-start
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get("start_briefing") === "true") {
            // If opened by task scheduler, start alarm immediately
            handleStartAlarm();
        }
    }, []);

    // Check time for alarm
    useEffect(() => {
        const interval = setInterval(() => {
            if (isRinging || isPlaying) return;

            const now = new Date();
            const currentHours = String(now.getHours()).padStart(2, '0');
            const currentMinutes = String(now.getMinutes()).padStart(2, '0');
            const currentTime = `${currentHours}:${currentMinutes}`;

            // Check days
            const dayMap: Record<number, string> = { 1: 'LUN', 2: 'MAR', 3: 'MER', 4: 'GIO', 5: 'VEN', 6: 'SAB', 0: 'DOM' };
            const currentDay = dayMap[now.getDay()];

            // Debug logging
            console.log('[Alarm Check]', {
                currentTime,
                alarmTime,
                currentDay,
                selectedDays,
                match: currentTime === alarmTime && selectedDays.includes(currentDay)
            });

            if (currentTime === alarmTime && selectedDays.includes(currentDay)) {
                console.log('🚨 ALARM TRIGGERED!');
                handleStartAlarm();
            }
        }, 5000); // Check every 5 seconds for better accuracy

        return () => clearInterval(interval);
    }, [alarmTime, selectedDays, isRinging, isPlaying]);

    // Save settings on change
    useEffect(() => {
        localStorage.setItem("briefing_use_ai", String(useOpenAI));
        if (openAIKey) localStorage.setItem("briefing_openai_key", openAIKey);
        localStorage.setItem("briefing_days", JSON.stringify(selectedDays));
        localStorage.setItem("briefing_time", alarmTime);
        localStorage.setItem("briefing_voice", selectedVoice);
    }, [useOpenAI, openAIKey, selectedDays, alarmTime, selectedVoice]);

    const handleStartAlarm = () => {
        setIsRinging(true);
        setCurrentVolume(20);
        setSecondsCounter(0);

        // Set system volume safely
        fetch('/api/system/volume', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ volume: 20 })
        }).catch(err => console.error("Failed to set system volume:", err));

        if (selectedVoice === 'youtube' && youtubePlayer) {
            youtubePlayer.unMute();
            youtubePlayer.setVolume(20); // Start at 20%
            youtubePlayer.playVideo();
        } else {
            pulseVoice.startAlarm();
        }
    };

    const handleStopAlarm = () => {
        if (selectedVoice === 'youtube' && youtubePlayer) {
            youtubePlayer.pauseVideo();
            youtubePlayer.seekTo(0);
        }
        pulseVoice.stopAlarm();
        setIsRinging(false);
        setSecondsCounter(0);
        // Auto-play briefing after alarm stops?
        // User request: "Stop -> Briefing starts"
        setTimeout(() => handlePlay(), 500);
    };

    const handlePlay = () => {
        if (isRinging) {
            handleStopAlarm();
            return;
        }

        if (isPlaying) {
            pulseVoice.stop();
            setIsPlaying(false);
        } else {
            const text = pulseVoice.generateBriefingText({
                userName,
                ...data
            });

            if (useOpenAI && openAIKey) {
                pulseVoice.speakOpenAI(text, openAIKey, selectedVoice);
            } else {
                pulseVoice.speak(text);
            }

            setIsPlaying(true);
        }
    };

    const downloadAlarmScript = () => {
        // Generate content for a .bat script to set scheduled task
        const taskName = "PulseERP_Briefing";
        const appUrl = "http://localhost:5000/dashboard?start_briefing=true";

        // Map IT days to EN days for schtasks
        const dayMap: Record<string, string> = {
            'LUN': 'MON', 'MAR': 'TUE', 'MER': 'WED', 'GIO': 'THU', 'VEN': 'FRI', 'SAB': 'SAT', 'DOM': 'SUN'
        };

        let frequency = "DAILY";
        let daysArg = "";

        if (selectedDays.length > 0 && selectedDays.length < 7) {
            frequency = "WEEKLY";
            daysArg = "/D " + selectedDays.map(d => dayMap[d]).join(",");
        }

        // Create a PowerShell command to register the task
        // We use schtasks for simplicity in a batch file
        const batContent = `@echo off
echo Configurazione Sveglia Pulse ERP...
echo.
echo 1. Creazione Task pianificata per le ore ${alarmTime}
echo 2. Giorni: ${selectedDays.length === 7 || selectedDays.length === 0 ? "Tutti i giorni" : selectedDays.join(", ")}
echo 3. Il PC si accendera' automaticamente (se BIOS supporta Wake Timers)
echo.

set TIME=${alarmTime}
set TASKNAME="${taskName}"
set URL="${appUrl}"

REM Delete existing if any
schtasks /Delete /TN %TASKNAME% /F >nul 2>&1

REM Create new task
REM /SC ${frequency} ${daysArg} /TM %TIME% /TR "cmd /c start %URL%" /RL HIGHEST /WAKE
schtasks /Create /SC ${frequency} ${daysArg} /TN %TASKNAME% /ST %TIME% /TR "explorer \"%URL%\"" /RL HIGHEST 

echo.
echo ✅ Sveglia configurata per le %TIME%!
echo Verifica che 'Wake Timers' siano abilitati nel tuo BIOS e Opzioni Risparmio Energia.
echo.
pause
`;

        const blob = new Blob([batContent], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "setup_pulse_alarm.bat";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Calculate time remaining
    const getTimeRemaining = () => {
        const now = new Date();
        const [hours, minutes] = alarmTime.split(':').map(Number);
        const alarmDate = new Date();
        alarmDate.setHours(hours, minutes, 0, 0);

        if (alarmDate <= now) {
            alarmDate.setDate(alarmDate.getDate() + 1);
        }

        const diffMs = alarmDate.getTime() - now.getTime();
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        return `- ${diffHrs}h ${diffMins}m`;
    };

    return (
        <Card className="shadow-lg border-0 bg-gradient-to-br from-indigo-50 to-purple-50">
            <CardHeader className="border-b border-indigo-100 py-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2 text-indigo-900">
                        <AlarmClock className={`h-4 w-4 text-indigo-600 ${selectedDays.length > 0 ? 'animate-pulse' : ''}`} />
                        Assistente Personale
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Dialog open={showConfig} onOpenChange={setShowConfig}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                    <Settings className="h-4 w-4 text-indigo-600" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Configura Sveglia & Briefing</DialogTitle>
                                    <DialogDescription>
                                        Imposta l'orario in cui il PC deve svegliarsi e leggerti il riepilogo.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="time" className="text-right">Orario</Label>
                                        <Input id="time" type="time" value={alarmTime} onChange={(e) => setAlarmTime(e.target.value)} className="col-span-3" />
                                    </div>

                                    <div className="grid grid-cols-4 items-start gap-4">
                                        <Label className="text-right pt-2">Giorni</Label>
                                        <div className="col-span-3 flex flex-wrap gap-1">
                                            {['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'].map((day) => (
                                                <div
                                                    key={day}
                                                    onClick={() => {
                                                        if (selectedDays.includes(day)) {
                                                            setSelectedDays(selectedDays.filter(d => d !== day));
                                                        } else {
                                                            setSelectedDays([...selectedDays, day]);
                                                        }
                                                    }}
                                                    className={`
                                                      cursor-pointer text-[10px] font-bold px-2 py-1 rounded-md border transition-colors
                                                      ${selectedDays.includes(day)
                                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                                            : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300'}
                                                    `}
                                                >
                                                    {day}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label className="text-right">Auto-Start</Label>
                                        <div className="col-span-3 flex items-center space-x-2">
                                            <Switch id="auto-play" checked={autoPlay} onCheckedChange={setAutoPlay} />
                                            <Label htmlFor="auto-play" className="font-normal text-xs text-muted-foreground">Avvia briefing all'apertura</Label>
                                        </div>
                                    </div>

                                    <div className="border-t pt-2 mt-2">
                                        <div className="grid grid-cols-4 items-center gap-4 mb-2">
                                            <Label className="text-right">Voce AI</Label>
                                            <div className="col-span-3 flex items-center space-x-2">
                                                <Switch id="use-ai" checked={useOpenAI} onCheckedChange={setUseOpenAI} />
                                                <Label htmlFor="use-ai" className="font-normal text-xs text-muted-foreground">Usa voce neurale OpenAI (Richiede Chiave)</Label>
                                            </div>
                                        </div>

                                        {useOpenAI && (
                                            <div className="grid gap-2 mb-2 animate-in fade-in slide-in-from-top-1">
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                    <Label htmlFor="apikey" className="text-right">API Key</Label>
                                                    <Input
                                                        id="apikey"
                                                        type="password"
                                                        value={openAIKey}
                                                        onChange={(e) => setOpenAIKey(e.target.value)}
                                                        placeholder="sk-..."
                                                        className="col-span-3 font-mono text-xs h-8"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                    <Label htmlFor="voice" className="text-right">Voce</Label>
                                                    <div className="col-span-3">
                                                        <select
                                                            id="voice"
                                                            value={selectedVoice}
                                                            onChange={(e) => setSelectedVoice(e.target.value)}
                                                            className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            <option value="shimmer">Shimmer (Chiaro)</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-4 items-center gap-4 mt-2">
                                            <Label className="text-right">Suoneria</Label>
                                            <div className="col-span-3 flex items-center space-x-2">
                                                <Switch
                                                    id="use-youtube"
                                                    checked={selectedVoice === 'youtube'}
                                                    onCheckedChange={(c) => setSelectedVoice(c ? 'youtube' : 'alloy')}
                                                />
                                                <Label htmlFor="use-youtube" className="font-normal text-xs text-muted-foreground">Usa "Musica New Age" (YouTube)</Label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-muted p-3 rounded-md text-xs text-muted-foreground">
                                        <p className="font-bold mb-1">Nota Importante:</p>
                                        <p>Per accendere il PC da sospensione/ibernazione, devi scaricare ed eseguire lo script di configurazione una volta.</p>
                                    </div>

                                    <Button onClick={downloadAlarmScript} className="w-full flex items-center gap-2">
                                        <Download className="h-4 w-4" />
                                        Scarica Script Configurazione (.bat)
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">Sveglia impostata</p>
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-indigo-700">{alarmTime}</span>
                            <Badge variant="outline" className="bg-white/50 text-indigo-600 border-indigo-200">
                                {isRinging ? (
                                    <span className="flex items-center gap-2 animate-pulse">
                                        <span>Vol: {currentVolume}%</span>
                                        <span>•</span>
                                        <span>{secondsCounter}s</span>
                                    </span>
                                ) : (
                                    getTimeRemaining()
                                )}
                            </Badge>
                        </div>
                    </div>

                    <Button
                        size="icon"
                        className={`
                            h-12 w-12 rounded-full shadow-md transition-all 
                            ${isRinging
                                ? 'bg-red-500 hover:bg-red-600 animate-pulse ring-4 ring-red-300'
                                : isPlaying
                                    ? 'bg-red-500 hover:bg-red-600'
                                    : 'bg-indigo-600 hover:bg-indigo-700'
                            }
                        `}
                        onClick={isRinging ? handleStopAlarm : handlePlay}
                        title={isRinging ? "Ferma Sveglia" : isPlaying ? "Stop Briefing" : "Ascolta Briefing ora"}
                    >
                        {isRinging ? (
                            <AlarmClock className="h-6 w-6 text-white" />
                        ) : isPlaying ? (
                            <Square className="h-5 w-5 fill-current" />
                        ) : (
                            <Play className="h-6 w-6 ml-1 fill-current" />
                        )}
                    </Button>
                </div>

                <div className="hidden">
                    <YouTube
                        videoId={ALARM_VIDEO_ID}
                        opts={{
                            height: '0',
                            width: '0',
                            playerVars: {
                                autoplay: 0,
                                controls: 0,
                                loop: 1,
                                playlist: ALARM_VIDEO_ID
                            },
                        }}
                        onReady={(event) => setYoutubePlayer(event.target)}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
