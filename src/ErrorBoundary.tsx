import * as React from "react";

interface ErrorBoundaryProps {
  fallback: (clear: () => void) => React.ReactNode;
  children: React.ReactNode;
}
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  { hasError: boolean }
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: any, info: any) {
    console.error("Error happened: ", error, info);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback(() => this.setState({ hasError: false }));
    }

    return this.props.children;
  }
}
