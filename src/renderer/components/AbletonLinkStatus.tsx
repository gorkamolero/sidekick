import React, { useEffect, useState } from 'react';
import { useStore } from '../lib/store';

interface LinkState {
  isEnabled: boolean;
  isConnected: boolean;
  tempo: number;
  phase: number;
  beat: number;
  numPeers: number;
  isPlaying: boolean;
}

export const AbletonLinkStatus: React.FC = () => {
  const { setLinkState: updateStoreLinkState } = useStore();
  const [linkState, setLinkState] = useState<LinkState>({
    isEnabled: false,
    isConnected: false,
    tempo: 120,
    phase: 0,
    beat: 0,
    numPeers: 0,
    isPlaying: false,
  });
  
  const [tempTempo, setTempTempo] = useState('120');

  useEffect(() => {
    const unsubscribe = window.electron.abletonLink.onUpdate((state: LinkState) => {
      setLinkState(state);
      updateStoreLinkState(state);
      setTempTempo(state.tempo.toFixed(1));
    });

    window.electron.abletonLink.getState().then((state) => {
      setLinkState(state);
      updateStoreLinkState(state);
    });

    return unsubscribe;
  }, [updateStoreLinkState]);

  const handleToggleLink = async () => {
    if (linkState.isEnabled) {
      await window.electron.abletonLink.disable();
    } else {
      await window.electron.abletonLink.enable();
    }
  };

  const handleSetTempo = async () => {
    const tempo = parseFloat(tempTempo);
    if (!isNaN(tempo) && tempo > 0 && tempo < 999) {
      await window.electron.abletonLink.setTempo(tempo);
    }
  };

  const handleTogglePlay = async () => {
    if (linkState.isPlaying) {
      await window.electron.abletonLink.stopPlaying();
    } else {
      await window.electron.abletonLink.startPlaying();
    }
  };

  return (
    <div className="bg-gray-800 border-b border-gray-700 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleLink}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              linkState.isEnabled
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            {linkState.isEnabled ? 'Link ON' : 'Link OFF'}
          </button>
          
          <div className="flex items-center gap-1">
            <div
              className={`w-2 h-2 rounded-full ${
                linkState.isConnected ? 'bg-green-500' : 'bg-gray-600'
              }`}
            />
            <span className="text-xs text-gray-400">
              {linkState.numPeers} {linkState.numPeers === 1 ? 'peer' : 'peers'}
            </span>
          </div>
        </div>

        {linkState.isEnabled && (
          <button
            onClick={handleTogglePlay}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              linkState.isPlaying
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            {linkState.isPlaying ? '⏸' : '▶'}
          </button>
        )}
      </div>

      {linkState.isEnabled && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 flex-1">
            <span className="text-xs text-gray-400">BPM:</span>
            <input
              type="text"
              value={tempTempo}
              onChange={(e) => setTempTempo(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSetTempo()}
              className="bg-gray-700 text-white px-2 py-1 rounded text-xs w-16"
            />
            <button
              onClick={handleSetTempo}
              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-300"
            >
              Set
            </button>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>Beat: {Math.floor(linkState.beat)}</span>
            <div className="w-12 h-1 bg-gray-700 rounded overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-100"
                style={{ width: `${(linkState.phase % 1) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};