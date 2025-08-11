import { useState, useEffect, useCallback } from 'react';
import { AbletonOSC } from '../lib/ableton-osc';
import { useStore } from '../lib/store';

export function useAbleton() {
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  
  const { currentProject, updateProject } = useStore();
  const abletonOSC = AbletonOSC.getInstance();
  
  // Manual sync function
  const syncWithAbleton = useCallback(async () => {
    setIsSyncing(true);
    try {
      const info = await abletonOSC.getInfo();
      if (info) {
        // Format time signature from numerator/denominator
        const timeSignature = `${info.signature_numerator}/${info.signature_denominator}`;
        
        updateProject({
          bpm: Math.round(info.tempo),
          timeSignature: timeSignature,
          // Note: Musical key is not available via AbletonOSC API
          // Would need Max4Live device or MIDI analysis to get key
        });
        setLastSyncTime(new Date());
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to sync with Ableton:', error);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [abletonOSC, updateProject]);
  
  // Auto-sync and connection monitoring
  useEffect(() => {
    let mounted = true;
    
    const checkAndSync = async () => {
      if (!mounted) return;
      
      try {
        const connected = await abletonOSC.testConnection();
        setIsConnected(connected);
        
        // Auto-sync if connected
        if (connected && currentProject) {
          const info = await abletonOSC.getInfo();
          if (info) {
            const timeSignature = `${info.signature_numerator}/${info.signature_denominator}`;
            
            // Only update if values changed
            if (info.tempo !== currentProject.bpm || timeSignature !== currentProject.timeSignature) {
              updateProject({
                bpm: Math.round(info.tempo),
                timeSignature: timeSignature,
              });
              setLastSyncTime(new Date());
            }
          }
        }
      } catch (error) {
        console.error('Auto-sync failed:', error);
        setIsConnected(false);
      }
    };
    
    // Initial check
    checkAndSync();
    
    // Set up interval for auto-sync
    const interval = setInterval(checkAndSync, 5000);
    
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [abletonOSC, currentProject, updateProject]);
  
  return {
    isConnected,
    isSyncing,
    lastSyncTime,
    syncWithAbleton,
  };
}