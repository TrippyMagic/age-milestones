import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "../ui";

type Props = { children: ReactNode };
type State = { error: Error | null };

/**
 * Global error boundary — catches runtime errors in the component tree
 * and renders a fallback UI instead of going completely blank.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="error-boundary">
          <h2 className="error-boundary__title">Something went wrong</h2>
          <p className="error-boundary__message">{this.state.error.message}</p>
          <Button
            onClick={() => { this.setState({ error: null }); window.location.href = "/"; }}
          >
            Go home
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

