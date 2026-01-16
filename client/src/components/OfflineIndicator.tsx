import React from 'react';
import { Wifi, WifiOff, Cloud, CloudOff, Loader2 } from 'lucide-react';
import { useOfflineStatus } from '@/lib/offline-manager';
import { cn } from '@/lib/utils';

/**
 * Indicatore visivo dello stato online/offline
 * Da inserire nella topbar o sidebar
 */
export function OfflineIndicator() {
    const { status, pendingCount } = useOfflineStatus();

    const getStatusConfig = () => {
        switch (status) {
            case 'online':
                return {
                    icon: Wifi,
                    text: 'Online',
                    color: 'text-green-600 dark:text-green-400',
                    bgColor: 'bg-green-50 dark:bg-green-900/20',
                    borderColor: 'border-green-200 dark:border-green-800',
                };
            case 'offline':
                return {
                    icon: WifiOff,
                    text: 'Offline',
                    color: 'text-orange-600 dark:text-orange-400',
                    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
                    borderColor: 'border-orange-200 dark:border-orange-800',
                };
            case 'syncing':
                return {
                    icon: Loader2,
                    text: 'Sincronizzazione...',
                    color: 'text-blue-600 dark:text-blue-400',
                    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
                    borderColor: 'border-blue-200 dark:border-blue-800',
                };
        }
    };

    const config = getStatusConfig();
    const Icon = config.icon;

    return (
        <div
            className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-full border',
                config.bgColor,
                config.borderColor
            )}
        >
            <Icon
                className={cn(
                    'h-4 w-4',
                    config.color,
                    status === 'syncing' && 'animate-spin'
                )}
            />
            <span className={cn('text-sm font-medium', config.color)}>
                {config.text}
            </span>
            {pendingCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs font-semibold bg-orange-500 text-white rounded-full">
                    {pendingCount}
                </span>
            )}
        </div>
    );
}

/**
 * Banner floating per notificare cambio stato
 */
export function OfflineNotificationBanner() {
    const { status } = useOfflineStatus();
    const [show, setShow] = React.useState(false);
    const [message, setMessage] = React.useState('');
    const previousStatus = React.useRef(status);

    React.useEffect(() => {
        // Mostra banner solo quando lo stato cambia
        if (previousStatus.current !== status) {
            if (status === 'offline') {
                setMessage('📡 Modalità offline attivata. Continua a lavorare, i dati verranno sincronizzati.');
                setShow(true);
            } else if (status === 'online' && previousStatus.current === 'offline') {
                setMessage('🌐 Connessione ripristinata! Sincronizzazione in corso...');
                setShow(true);
            }

            previousStatus.current = status;

            // Nascondi dopo 5 secondi
            const timer = setTimeout(() => setShow(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [status]);

    if (!show) return null;

    return (
        <div className="fixed top-4 right-4 z-50 max-w-md animate-in slide-in-from-top-5">
            <div className={cn(
                'p-4 rounded-lg shadow-lg border-2',
                status === 'offline' ? 'bg-orange-50 border-orange-300 dark:bg-orange-900/20' : 'bg-green-50 border-green-300 dark:bg-green-900/20'
            )}>
                <div className="flex items-start gap-3">
                    {status === 'offline' ? (
                        <CloudOff className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    ) : (
                        <Cloud className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {message}
                        </p>
                    </div>
                    <button
                        onClick={() => setShow(false)}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
                    >
                        ×
                    </button>
                </div>
            </div>
        </div>
    );
}
