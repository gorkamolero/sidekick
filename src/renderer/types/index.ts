export interface Generation {
  id: string;
  prompt: string;
  timestamp: Date;
  audioUrl: string;
  filePath?: string;
  duration: number;
  bpm: number;
  key: string;
  tags: string[];
}

export interface ProjectInfo {
  bpm: number;
  key: string;
  timeSignature: string;
}

declare global {
  interface Window {
    electron: {
      saveAudioFile: (buffer: ArrayBuffer, filename: string) => Promise<string>;
      getProjectInfo: () => Promise<ProjectInfo>;
    };
  }
}