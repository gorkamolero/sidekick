import React, { useState, useEffect } from 'react';
import { AbletonOSC } from '../lib/ableton-osc';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CheckCircle2, XCircle, Loader2, Download, RefreshCw, Music } from 'lucide-react';

export function AbletonOSCSetup() {
  const [isInstalled, setIsInstalled] = useState<boolean | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [installMessage, setInstallMessage] = useState<string>('');
  const [abletonInfo, setAbletonInfo] = useState<any>(null);

  const abletonOSC = AbletonOSC.getInstance();

  useEffect(() => {
    checkInstallation();
    
    // Start monitoring connection if installed
    if (isInstalled) {
      abletonOSC.startConnectionMonitoring((connected) => {
        setIsConnected(connected);
        if (connected) {
          updateAbletonInfo();
        }
      });
    }

    return () => {
      abletonOSC.stopConnectionMonitoring();
    };
  }, [isInstalled]);

  const checkInstallation = async () => {
    const installed = await abletonOSC.checkInstalled();
    setIsInstalled(installed);
    
    if (installed) {
      const connected = await abletonOSC.testConnection();
      setIsConnected(connected);
      if (connected) {
        updateAbletonInfo();
      }
    }
  };

  const updateAbletonInfo = async () => {
    const info = await abletonOSC.getInfo();
    if (info) {
      setAbletonInfo(info);
    }
  };

  const handleInstall = async () => {
    setIsInstalling(true);
    setInstallMessage('');
    
    try {
      const result = await abletonOSC.install();
      setInstallMessage(result.message);
      
      if (result.success) {
        setIsInstalled(true);
        // Check installation after a short delay
        setTimeout(() => checkInstallation(), 1000);
      }
    } catch (error) {
      setInstallMessage(`Installation failed: ${error}`);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    
    try {
      const connected = await abletonOSC.testConnection();
      setIsConnected(connected);
      
      if (connected) {
        await updateAbletonInfo();
      } else {
        setInstallMessage('Could not connect to Ableton. Make sure Ableton Live is running and AbletonOSC is selected in Preferences > Link/MIDI > Control Surface');
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleTogglePlayback = async () => {
    if (abletonInfo) {
      await abletonOSC.setPlaying(!abletonInfo.is_playing);
      await updateAbletonInfo();
    }
  };

  return (
    <div className="p-4 bg-black/20 rounded-lg border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Ableton OSC Integration</h3>
        <div className="flex gap-2">
          {isInstalled !== null && (
            <Badge variant={isInstalled ? "default" : "secondary"}>
              {isInstalled ? (
                <>
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Installed
                </>
              ) : (
                <>
                  <XCircle className="w-3 h-3 mr-1" />
                  Not Installed
                </>
              )}
            </Badge>
          )}
          
          {isInstalled && (
            <Badge variant={isConnected ? "default" : "secondary"}>
              {isConnected ? (
                <>
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Connected
                </>
              ) : (
                <>
                  <XCircle className="w-3 h-3 mr-1" />
                  Disconnected
                </>
              )}
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {!isInstalled && (
          <div>
            <p className="text-sm text-white/60 mb-3">
              AbletonOSC enables communication between Sidekick and Ableton Live. 
              Click below to install it to your Ableton Remote Scripts folder.
            </p>
            
            <Button 
              onClick={handleInstall}
              disabled={isInstalling}
              className="w-full"
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
          </div>
        )}

        {isInstalled && !isConnected && (
          <div>
            <p className="text-sm text-white/60 mb-3">
              AbletonOSC is installed. Now:
            </p>
            <ol className="text-sm text-white/60 mb-3 list-decimal list-inside space-y-1">
              <li>Open Ableton Live</li>
              <li>Go to Preferences → Link/MIDI</li>
              <li>Under "Control Surface", select "AbletonOSC"</li>
              <li>Click "Test Connection" below</li>
            </ol>
            
            <Button 
              onClick={handleTestConnection}
              disabled={isTesting}
              variant="secondary"
              className="w-full"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Test Connection
                </>
              )}
            </Button>
          </div>
        )}

        {isConnected && abletonInfo && (
          <div className="space-y-3">
            <div className="bg-green-500/10 border border-green-500/30 rounded p-3">
              <p className="text-sm text-green-400 flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Connected to Ableton Live
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-white/5 rounded p-2">
                <p className="text-white/40 text-xs">Tempo</p>
                <p className="font-mono">{abletonInfo.tempo.toFixed(1)} BPM</p>
              </div>
              
              <div className="bg-white/5 rounded p-2">
                <p className="text-white/40 text-xs">Status</p>
                <p className="font-mono">{abletonInfo.is_playing ? 'Playing' : 'Stopped'}</p>
              </div>
              
              <div className="bg-white/5 rounded p-2">
                <p className="text-white/40 text-xs">Tracks</p>
                <p className="font-mono">{abletonInfo.track_count}</p>
              </div>
              
              <div className="bg-white/5 rounded p-2">
                <p className="text-white/40 text-xs">Scenes</p>
                <p className="font-mono">{abletonInfo.scene_count}</p>
              </div>
            </div>
            
            <Button 
              onClick={handleTogglePlayback}
              variant="secondary"
              className="w-full"
            >
              <Music className="w-4 h-4 mr-2" />
              {abletonInfo.is_playing ? 'Stop Playback' : 'Start Playback'}
            </Button>
          </div>
        )}

        {installMessage && (
          <div className={`text-sm p-3 rounded ${
            installMessage.includes('success') 
              ? 'bg-green-500/10 text-green-400 border border-green-500/30' 
              : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
          }`}>
            {installMessage}
          </div>
        )}
      </div>
    </div>
  );
}