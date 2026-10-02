// Catches a crash inside one tool so the rest of the page (and the user's saved data) stays usable.
import { Component, type ReactNode } from "react";

type Props = { children: ReactNode; name: string };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="panel stack" style={{ gap: 12 }}>
        <span className="pill bad" style={{ alignSelf: "flex-start" }}>Something went wrong</span>
        <h2>{this.props.name} hit an error</h2>
        <p>Your saved data is safe. Reload the page to try again. If it keeps happening, use “Save backup” at the top and send it to us.</p>
        <p className="note" style={{ fontFamily: "var(--mono)" }}>{this.state.error.message}</p>
        <button className="btn primary" style={{ alignSelf: "flex-start" }} onClick={() => location.reload()}>Reload</button>
      </div>
    );
  }
}
