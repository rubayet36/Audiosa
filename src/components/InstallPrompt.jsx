import { useEffect, useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';

function isStandalone() {
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone;
}

export default function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState(null);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('audiosa_install_dismissed') === 'true');
  const [showIosHint] = useState(() => /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !isStandalone());

  useEffect(() => {
    const onBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallEvent(event);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);

    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
  }, []);

  if (dismissed || isStandalone() || (!installEvent && !showIosHint)) {
    return null;
  }

  const dismiss = () => {
    localStorage.setItem('audiosa_install_dismissed', 'true');
    setDismissed(true);
  };

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    setInstallEvent(null);
    dismiss();
  };

  return (
    <div className="fixed inset-x-3 bottom-28 z-[70] mx-auto max-w-md rounded-3xl border border-white/10 bg-[#121216]/95 p-4 text-white shadow-2xl backdrop-blur-xl md:bottom-6">
      <button
        onClick={dismiss}
        className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-white/45 hover:bg-white/8 hover:text-white"
        title="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex gap-3 pr-8">
        <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/30">
          <Smartphone className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold">Install Audiosa</h3>
          <p className="mt-1 text-sm text-white/55">
            {installEvent
              ? 'Add Audiosa to your home screen for a full-screen app experience.'
              : 'On iPhone, tap Share, then Add to Home Screen.'}
          </p>
          {installEvent && (
            <button
              onClick={install}
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-black"
            >
              <Download className="h-4 w-4" />
              Install
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
