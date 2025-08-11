import { useEffect, useState, useCallback } from "react";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const LAST_PROMPT_KEY = "pwa:lastInstallPromptAt";

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    // iOS Safari
    (navigator as any)?.standalone
  );
}

export function usePwaInstall() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [shouldShowUi, setShouldShowUi] = useState(false);
  const [isInstalled, setIsInstalled] = useState(isStandalone());

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      (e as any).preventDefault?.(); // stop mini-infobar
      setDeferred(e as BIPEvent);

      const last = Number(localStorage.getItem(LAST_PROMPT_KEY) || 0);
      const now = Date.now();
      // Throttle: only show banner once per week
      if (!isStandalone() && now - last > WEEK_MS) {
        setShouldShowUi(true);
      }
    };

    const onAppInstalled = () => {
      setIsInstalled(true);
      setShouldShowUi(false);
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferred) return;
    // Must be triggered by user gesture
    localStorage.setItem(LAST_PROMPT_KEY, String(Date.now()));
    setShouldShowUi(false);
    await deferred.prompt();
    try {
      await deferred.userChoice;
    } finally {
      setDeferred(null); // can't reliably reuse
    }
  }, [deferred]);

  const snoozeAWeek = useCallback(() => {
    localStorage.setItem(LAST_PROMPT_KEY, String(Date.now()));
    setShouldShowUi(false);
  }, []);

  return {
    isInstalled,
    canPrompt: !!deferred,
    shouldShowUi,
    promptInstall,
    snoozeAWeek,
  };
}
