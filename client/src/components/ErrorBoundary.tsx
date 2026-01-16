import { ComponentType, ReactNode } from 'react';
import { Component, ErrorInfo } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
    errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('❌ ErrorBoundary caught an error:', error, errorInfo);
        console.error('Component stack:', errorInfo.componentStack);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center justify-center h-screen bg-gray-100 p-8">
                    <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl">
                        <h2 className="text-2xl font-bold text-red-600 mb-4">❌ Errore nel Componente</h2>
                        <p className="text-gray-700 mb-4">
                            Si è verificato un errore durante il caricamento di questa pagina.
                        </p>
                        <details className="bg-gray-50 p-4 rounded border border-gray-200">
                            <summary className="cursor-pointer font-semibold text-gray-900 mb-2">
                                Dettagli Tecnici
                            </summary>
                            <div className="mt-4 space-y-2">
                                <div>
                                    <strong>Messaggio:</strong>
                                    <pre className="text-sm bg-red-50 p-2 rounded mt-1 overflow-auto">
                                        {this.state.error?.message}
                                    </pre>
                                </div>
                                <div>
                                    <strong>Stack Trace:</strong>
                                    <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-64">
                                        {this.state.error?.stack}
                                    </pre>
                                </div>
                                {this.state.errorInfo && (
                                    <div>
                                        <strong>Component Stack:</strong>
                                        <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-64">
                                            {this.state.errorInfo.componentStack}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </details>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-6 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
                        >
                            Ricarica Pagina
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
