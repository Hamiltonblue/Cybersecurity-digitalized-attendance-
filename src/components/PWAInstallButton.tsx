import React, { useState } from 'react';
import { Download, Smartphone, Share, PlusSquare, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'card';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  // If already running inside installed standalone PWA, suppress the install prompt
  if (isInstalled) {
    if (variant === 'card') {
      return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>RUN-CyberPass is installed on this device (Standalone Mode)</span>
        </div>
      );
    }
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setJustInstalled(true);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      // General instructions for desktop/Android browsers that haven't fired prompt yet
      setShowIOSModal(true);
    }
  };

  if (justInstalled) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 font-medium">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        <span>Installed!</span>
      </div>
    );
  }

  // Card Variant (placed inside StudentPortal check-in card)
  if (variant === 'card') {
    return (
      <>
        <div className={`p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-800/60 to-slate-800/40 border border-emerald-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${className}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-emerald-300 tracking-wide uppercase">Mobile App Ready</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">PWA</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Install RUN-CyberPass on your phone for instant 1-tap lecture hall check-ins without typing URLs.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleInstallClick}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-900/30 transition-all shrink-0 active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isIOS ? 'Install on iPhone' : 'Install App'}</span>
          </button>
        </div>

        {/* iOS Safari & Browser Install Modal */}
        {showIOSModal && (
          <IOSInstallGuideModal
            isIOS={isIOS}
            onClose={() => setShowIOSModal(false)}
          />
        )}
      </>
    );
  }

  // Compact Variant (placed in Navbar)
  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 transition-colors shrink-0 active:scale-95 cursor-pointer ${className}`}
        title="Install RUN-CyberPass to Home Screen"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{isIOS ? 'Install on iOS' : 'Install App'}</span>
        <span className="sm:hidden">Install</span>
      </button>

      {showIOSModal && (
        <IOSInstallGuideModal
          isIOS={isIOS}
          onClose={() => setShowIOSModal(false)}
        />
      )}
    </>
  );
};

interface IOSGuideProps {
  isIOS: boolean;
  onClose: () => void;
}

const IOSInstallGuideModal: React.FC<IOSGuideProps> = ({ isIOS, onClose }) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-install-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700/80 p-5 shadow-2xl relative text-slate-100">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Close installation guide"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 id="pwa-install-title" className="text-sm font-bold text-white">
              {isIOS ? 'Install on iPhone / iPad' : 'Add to Home Screen'}
            </h3>
            <p className="text-xs text-slate-400">Run RUN-CyberPass as a native app</p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-300 bg-slate-800/60 rounded-xl p-3.5 border border-slate-700/50">
          {isIOS ? (
            <>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-[11px] shrink-0">1</span>
                <div>
                  Tap the <strong className="text-white inline-flex items-center gap-1 mx-0.5"><Share className="w-3.5 h-3.5 text-sky-400 inline" /> Share</strong> button at the bottom of Safari.
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-[11px] shrink-0">2</span>
                <div>
                  Scroll down the menu and select <strong className="text-white inline-flex items-center gap-1 mx-0.5"><PlusSquare className="w-3.5 h-3.5 text-emerald-400 inline" /> Add to Home Screen</strong>.
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-[11px] shrink-0">3</span>
                <div>
                  Tap <strong className="text-white">Add</strong> in the top-right corner. RUN-CyberPass will appear on your home screen.
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-[11px] shrink-0">1</span>
                <div>
                  Tap the browser menu button (<strong className="text-white">⋮</strong> or three dots).
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-[11px] shrink-0">2</span>
                <div>
                  Select <strong className="text-white">Install app</strong> or <strong className="text-white">Add to Home screen</strong>.
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-[11px] shrink-0">3</span>
                <div>
                  Confirm installation to launch RUN-CyberPass without browser navigation bars.
                </div>
              </div>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
        >
          Got it
        </button>
      </div>
    </div>
  );
};
