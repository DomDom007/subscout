// Read data passed in a share link (?d=...). Returns undefined when the page was opened normally.
import { useEffect, useState } from "react";
import { decodeState } from "./share";

export function useShared<T>() {
  const [params] = useState(() => new URLSearchParams(window.location.search));
  const d = params.get("d");
  const [state, setState] = useState<{ data?: T; error?: string; loading: boolean }>({ loading: !!d });
  useEffect(() => {
    if (!d) { setState({ loading: false }); return; }
    decodeState<T>(d).then(
      data => setState({ data, loading: false }),
      () => setState({ loading: false, error: "This link is damaged or incomplete. Ask for it to be sent again." })
    );
  }, [d]);
  return { ...state, mode: params.get("m") ?? "" };
}
