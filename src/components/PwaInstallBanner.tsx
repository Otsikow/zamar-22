import React from "react";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { Button } from "@/components/ui/button";

export default function PwaInstallBanner() {
  const { canPrompt, shouldShowUi, promptInstall, snoozeAWeek } = usePwaInstall();

  // iOS Safari lacks beforeinstallprompt
  const isIOS = typeof navigator !== "undefined" &&
    /iphone|ipad|ipod/i.test(navigator.userAgent) &&
    /safari/i.test(navigator.userAgent);

  if (!shouldShowUi) return null;

  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-[88px] z-[70] w-[95%] max-w-md rounded-2xl shadow-lg border border-border bg-background/90 backdrop-blur p-4 text-foreground">
      <div className="flex items-start gap-3">
        <img
          src="/lovable-uploads/eea63e8f-61ca-4fd6-9db2-366e8d4ee1b9.png"
          alt="Zamar app icon"
          className="h-10 w-10 rounded-lg"
          loading="lazy"
        />
        <div className="flex-1">
          <div className="font-semibold">Install Zamar</div>
          <div className="text-sm text-muted-foreground">
            Get faster access and a better offline experience.
          </div>
        </div>
      </div>

      {canPrompt && !isIOS && (
        <div className="mt-3 flex gap-2">
          <Button onClick={promptInstall}>Install</Button>
          <Button variant="outline" onClick={snoozeAWeek}>Not now</Button>
        </div>
      )}

      {!canPrompt && isIOS && (
        <div className="mt-3">
          <div className="text-sm text-muted-foreground">
            On iPhone/iPad: tap <span className="font-medium">Share</span> → <span className="font-medium">Add to Home Screen</span>.
          </div>
          <div className="mt-2">
            <Button variant="outline" onClick={snoozeAWeek}>Okay</Button>
          </div>
        </div>
      )}
    </div>
  );
}
