import { Component, type ErrorInfo, type ReactNode } from "react";

type SectionErrorBoundaryProps = {
  children: ReactNode;
  title?: string;
  message?: string;
  actionLabel?: string;
  compact?: boolean;
  onAction?: () => void;
};

type SectionErrorBoundaryState = {
  error: Error | null;
};

export class SectionErrorBoundary extends Component<
  SectionErrorBoundaryProps,
  SectionErrorBoundaryState
> {
  state: SectionErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): SectionErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[SectionErrorBoundary]", error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ error: null });
    this.props.onAction?.();
  };

  render() {
    const { children, title, message, actionLabel = "Try again", compact = false } = this.props;
    const { error } = this.state;

    if (error) {
      return (
        <div
          className={[
            "section-error-boundary",
            compact ? "section-error-boundary--compact" : "",
          ].filter(Boolean).join(" ")}
          role="status"
          aria-live="polite"
        >
          <h3 className="section-error-boundary__title">
            {title ?? "This section is temporarily unavailable"}
          </h3>
          <p className="section-error-boundary__message">
            {message ?? error.message}
          </p>
          <button
            type="button"
            className="section-error-boundary__action"
            onClick={this.handleReset}
          >
            {actionLabel}
          </button>
        </div>
      );
    }

    return children;
  }
}

