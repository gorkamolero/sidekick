import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { X, CheckCircle, AlertCircle, Loader2, Download, ArrowRight } from 'lucide-react';
import { AbletonOSC } from '../lib/ableton-osc';

interface FirstTimeSetupProps {
  onComplete: () => void;
}

export function FirstTimeSetup({ onComplete }: FirstTimeSetupProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abletonOSC = AbletonOSC.getInstance();

  useEffect(() => {
    checkAbletonOSC();
  }, []);
  
  // Auto-complete if already connected
  useEffect(() => {
    if (isConnected && !isChecking) {
      // Already connected, skip setup
      onComplete();
    }
  }, [isConnected, isChecking, onComplete]);

  const checkAbletonOSC = async () => {
    setIsChecking(true);
    try {
      const installed = await abletonOSC.checkInstalled();
      setIsInstalled(installed);
      
      if (installed) {
        const connected = await abletonOSC.testConnection();
        setIsConnected(connected);
      }
    } catch (err) {
      setError('Failed to check AbletonOSC status');
    } finally {
      setIsChecking(false);
    }
  };

  const handleInstall = async () => {
    setIsInstalling(true);
    setError(null);
    try {
      const result = await abletonOSC.install();
      if (result.success) {
        setIsInstalled(true);
        // Re-check connection after install
        const connected = await abletonOSC.testConnection();
        setIsConnected(connected);
      } else {
        setError(result.message || 'Installation failed');
      }
    } catch (err) {
      setError('Failed to install AbletonOSC');
    } finally {
      setIsInstalling(false);
    }
  };

  const canContinue = isInstalled;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Connect to Ableton Live</h1>
          <p className="text-gray-400">Let's set up the connection to your DAW</p>
        </div>

        <div className="space-y-6">
          <div className={`p-4 rounded-lg border ${
            isChecking ? 'bg-gray-800 border-gray-700' :
            isConnected ? 'bg-green-500/10 border-green-500/30' :
            isInstalled ? 'bg-yellow-500/10 border-yellow-500/30' :
            'bg-red-500/10 border-red-500/30'
          }`}>
            <div className="flex items-center gap-3">
              {isChecking ? (
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              ) : isConnected ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : isInstalled ? (
                <AlertCircle className="w-5 h-5 text-yellow-400" />
              ) : (
                <X className="w-5 h-5 text-red-400" />
              )}
              
              <div className="flex-1">
                <h3 className="font-medium">
                  {isChecking ? 'Checking AbletonOSC...' :
                   isConnected ? 'Connected to Ableton Live' :
                   isInstalled ? 'AbletonOSC installed (Not configured in Ableton)' :
                   'AbletonOSC not installed'}
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  {isChecking ? 'Looking for AbletonOSC in your Ableton installation' :
                   isConnected ? 'Ready to sync with your DAW' :
                   isInstalled ? 'Configure AbletonOSC in Ableton Preferences > Link/MIDI > Control Surface' :
                   'Required for DAW integration'}
                </p>
              </div>
            </div>
          </div>

          {!isInstalled && !isChecking && (
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="font-medium mb-2">What is AbletonOSC?</h3>
                <p className="text-sm text-gray-400">
                  AbletonOSC is a Max for Live device that enables communication between Sidekick and Ableton Live. 
                  It allows real-time sync of tempo, key, and track information.
                </p>
              </div>

              <Button
                onClick={handleInstall}
                disabled={isInstalling}
                className="w-full"
                size="lg"
              >
                {isInstalling ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Installing...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Install AbletonOSC
                  </>
                )}
              </Button>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-400">
                  {error}
                </div>
              )}
            </div>
          )}

          {isInstalled && !isConnected && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <h3 className="font-medium text-blue-400 mb-2">Configure AbletonOSC in Ableton:</h3>
              <ol className="text-sm text-blue-400/80 space-y-1 list-decimal list-inside">
                <li>Open Ableton Preferences (Cmd+, or Ctrl+,)</li>
                <li>Go to Link/Tempo/MIDI tab</li>
                <li>In Control Surface dropdown, select "AbletonOSC"</li>
                <li>Leave Input and Output as "None"</li>
                <li>Sidekick will connect automatically</li>
              </ol>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-8">
          <Button
            variant="secondary"
            onClick={onComplete}
            className="flex-1"
          >
            Skip Setup
          </Button>
          
          <Button
            onClick={onComplete}
            disabled={!canContinue}
            className="flex-1"
          >
            {canContinue ? (
              <>
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            ) : (
              'Install Required'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}