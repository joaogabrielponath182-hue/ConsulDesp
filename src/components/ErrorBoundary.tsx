import React, { ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 my-4 bg-[#161B22] border-2 border-rose-500/30 rounded-2xl text-center max-w-xl mx-auto shadow-2xl space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <AlertTriangle size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-white uppercase tracking-wide">
              {this.props.fallbackTitle || 'Houve uma falha ao exibir esta tela'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Os dados foram protegidos. Clique abaixo para reiniciar este módulo com segurança.
            </p>
            {this.state.error && (
              <div className="mt-2 p-2 bg-[#0D1015] border border-slate-800 rounded-lg text-left text-[10px] font-mono text-rose-300/80 overflow-x-auto">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <RefreshCw size={14} />
            <span>Recarregar Módulo</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
