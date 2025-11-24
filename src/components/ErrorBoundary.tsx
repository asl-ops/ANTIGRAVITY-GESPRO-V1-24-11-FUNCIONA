import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
          <div className="max-w-xl bg-white p-8 rounded-xl shadow-lg text-center border border-red-200">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Algo salió mal.</h1>
            <p className="text-slate-600 mb-6">
              La aplicación ha encontrado un error inesperado. Por favor, intenta recargar la página. Si el problema persiste, contacta con el soporte.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              Recargar Página
            </button>
          </div>
        </div>
      );
    }

    // Explicitly cast this to any to access props property if TS fails to infer it correctly from Component generic
    return (this as any).props.children;
  }
}

export default ErrorBoundary;