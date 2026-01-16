
interface LogEntry {
    timestamp: string;
    type: 'db' | 'stdout' | 'stderr';
    message: string;
    params?: any;
    duration?: number;
}

const MAX_LOGS = 1000; // Increased buffer size to capture more history
export const systemLogBuffer: LogEntry[] = [];

export function addLog(entry: Omit<LogEntry, 'timestamp'>) {
    const logEntry: LogEntry = {
        timestamp: new Date().toISOString(),
        ...entry
    };

    systemLogBuffer.unshift(logEntry);
    if (systemLogBuffer.length > MAX_LOGS) {
        systemLogBuffer.pop();
    }
}
