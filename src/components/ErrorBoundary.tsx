import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl border border-border/60 bg-card p-8 text-center space-y-4">
            <h1 className="font-display text-xl font-bold text-foreground">
              Algo deu errado nesta tela
            </h1>
            <p className="text-sm text-muted-foreground">
              Tivemos um problema ao carregar esta página. Recarregue para tentar de novo.
            </p>
            <p className="text-xs text-muted-foreground/70 break-words">
              {this.state.error.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"
            >
              Recarregar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
