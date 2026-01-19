
export interface BriefingData {
    userName: string;
    weather: { temp: number; condition: string };
    unreadEmails: number;
    tasksDueToday: number;
    overdueTasks: number;
    nextAppointment?: string;
}

export class VoiceAssistant {
    private synth: SpeechSynthesis;
    private voice: SpeechSynthesisVoice | null = null;
    private isTalking: boolean = false;

    constructor() {
        this.synth = window.speechSynthesis;
        this.loadVoice();
        // Voices load asynchronously
        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = () => this.loadVoice();
        }
    }

    private loadVoice() {
        const voices = this.synth.getVoices();
        // Prefer Italian female voice or Google/Microsoft Italian
        this.voice = voices.find(v => v.lang.includes('it') && (v.name.includes('Google') || v.name.includes('Elsa') || v.name.includes('Cosimo')))
            || voices.find(v => v.lang.includes('it'))
            || null;
    }

    public speak(text: string) {
        if (this.synth.speaking) {
            this.synth.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        if (this.voice) {
            utterance.voice = this.voice;
        }

        // Adjust for natural flow
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        this.synth.speak(utterance);
        this.isTalking = true;

        utterance.onend = () => {
            this.isTalking = false;
        };
    }

    public async speakOpenAI(text: string, apiKey: string, voice: string = "alloy") {
        if (this.isTalking) {
            this.stop();
        }

        this.isTalking = true;

        // Basic Validation
        const cleanKey = apiKey?.trim();
        if (!cleanKey || cleanKey.length < 20 || !cleanKey.startsWith('sk-')) {
            console.warn("[VoiceAssistant] Invalid API Key format");
            alert("Attenzione: La chiave OpenAI inserita non sembra valida. Deve iniziare con 'sk-' ed essere lunga. Controlla di non aver copiato spazi vuoti.");
            this.speak(text); // Fallback immediately
            return;
        }

        console.log(`[VoiceAssistant] Requesting OpenAI Voice: ${voice}`);

        try {
            const response = await fetch("https://api.openai.com/v1/audio/speech", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "tts-1",
                    input: text,
                    voice: voice,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                console.error("OpenAI TTS Error:", error);

                // Alert the user so they know why it's not working
                alert(`Errore OpenAI: ${error.error?.message || "Errore sconosciuto"}`);

                // Fallback to browser voice if API fails
                this.speak(text);
                return;
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);

            audio.onended = () => {
                this.isTalking = false;
                URL.revokeObjectURL(url);
            };

            await audio.play();

            // Allow stopping via stop() method by tracking current audio
            (this as any).currentAudio = audio;

        } catch (error) {
            console.error("Failed to play OpenAI audio:", error);
            this.isTalking = false;
            this.speak(text); // Fallback
        }
    }

    public stop() {
        this.synth.cancel();
        if ((this as any).currentAudio) {
            (this as any).currentAudio.pause();
            (this as any).currentAudio = null;
        }
        this.isTalking = false;
    }

    public generateBriefingText(data: BriefingData): string {
        const time = new Date().getHours();
        let greeting = "Buongiorno";
        if (time >= 13 && time < 17) greeting = "Buon pomeriggio";
        if (time >= 17) greeting = "Buonasera";

        const dateStr = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });

        let text = `${greeting} ${data.userName}. Oggi è ${dateStr}. `;

        // Weather
        text += `Il meteo prevede ${data.weather.condition} con una temperatura di ${data.weather.temp} gradi. `;

        // Emails
        if (data.unreadEmails > 0) {
            text += `Hai ${data.unreadEmails} nuove email da leggere. `;
        } else {
            text += `Non ci sono nuove email. `;
        }

        // Tasks
        if (data.overdueTasks > 0) {
            text += `Attenzione, hai ${data.overdueTasks} attività scadute che richiedono il tuo intervento. `;
        }

        if (data.tasksDueToday > 0) {
            text += `Per oggi hai ${data.tasksDueToday} attività in scadenza. `;
        } else if (data.overdueTasks === 0) {
            text += `Sei in pari con le tue attività. `;
        }

        // Appointment
        if (data.nextAppointment) {
            text += `Il tuo prossimo appuntamento è: ${data.nextAppointment}. `;
        }

        text += "Buon lavoro!";
        return text;
    }

    // Alarm functionality
    private alarmContext: AudioContext | null = null;
    private alarmNodes: AudioNode[] = []; // Store nodes to stop them later

    public startAlarm() {
        if (this.alarmContext) return; // Already running

        try {
            this.alarmContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
            console.error("Web Audio API not supported", e);
            return;
        }

        const ctx = this.alarmContext;
        this.alarmNodes = [];

        // "New Age" Ambient Chord: C Major 7 (C4, E4, G4, B4)
        // Gentle Sine waves for a soothing, spiritual sound
        const frequencies = [261.63, 329.63, 392.00, 493.88];

        const masterGain = ctx.createGain();
        masterGain.connect(ctx.destination);
        masterGain.gain.setValueAtTime(0, ctx.currentTime); // Start silent
        this.alarmNodes.push(masterGain);

        frequencies.forEach((freq, index) => {
            const osc = ctx.createOscillator();
            const oscGain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.value = freq;

            // Slight detuning for richness (ethereal effect)
            if (index % 2 === 0) osc.detune.value = 5;
            else osc.detune.value = -5;

            osc.connect(oscGain);
            oscGain.connect(masterGain);

            // Lower volume for higher pitches to keep it balanced
            oscGain.gain.value = 0.25;

            osc.start(ctx.currentTime);
            this.alarmNodes.push(osc);
            this.alarmNodes.push(oscGain);
        });

        // "Breathing" Loop: Slow swell in and out
        // 4 seconds per cycle (2s in, 2s out)
        const breathe = () => {
            if (!this.alarmContext) return;
            const now = this.alarmContext.currentTime;
            // Fade In
            masterGain.gain.linearRampToValueAtTime(0.6, now + 2);
            // Fade Out (but not to zero, just softer)
            masterGain.gain.linearRampToValueAtTime(0.2, now + 4);
        };

        breathe(); // First breath
        const breatheInterval = setInterval(breathe, 4000);
        (this as any).breatheInterval = breatheInterval;
    }

    public stopAlarm() {
        if ((this as any).breatheInterval) {
            clearInterval((this as any).breatheInterval);
            (this as any).breatheInterval = null;
        }

        if (this.alarmNodes) {
            this.alarmNodes.forEach(node => {
                try {
                    if (node instanceof OscillatorNode) node.stop();
                    node.disconnect();
                } catch (e) { /* ignore */ }
            });
            this.alarmNodes = [];
        }

        if (this.alarmContext) {
            // Ramp down down before closing to avoid CLICK
            // But we need to close quickly.
            // Just close context.
            this.alarmContext.close().catch(e => console.error(e));
            this.alarmContext = null;
        }
    }
}

export const pulseVoice = new VoiceAssistant();
