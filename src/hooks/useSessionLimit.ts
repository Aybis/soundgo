import { useEffect, useRef, useState } from "react";
import { loadSettings } from "../state/settings";

/**
 * Local child-session timer. It never interrupts a round: once time expires,
 * `shouldFinishAfterRound` becomes true. The activity calls `completeRound()`
 * after its current success/transition and gets a calm end-of-session overlay.
 */
export function useSessionLimit(active: boolean) {
  const [expired, setExpired] = useState(false);
  const [showWrapUp, setShowWrapUp] = useState(false);
  const startedAt = useRef<number | null>(null);
  const limitMs = useRef(0);

  useEffect(() => {
    if (!active) return;
    const minutes = loadSettings().sessionMinutes;
    limitMs.current = minutes > 0 ? minutes * 60_000 : 0;
    startedAt.current = Date.now();
    setExpired(false);
    setShowWrapUp(false);

    if (!limitMs.current) return;
    const id = window.setInterval(() => {
      if (startedAt.current && Date.now() - startedAt.current >= limitMs.current) {
        setExpired(true);
        window.clearInterval(id);
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [active]);

  /** Call after a success/current round finishes; returns true if UI should wrap up. */
  const completeRound = () => {
    if (!expired) return false;
    setShowWrapUp(true);
    return true;
  };

  return {
    shouldFinishAfterRound: expired,
    showWrapUp,
    completeRound,
  };
}