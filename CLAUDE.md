# Sidekick Project Status

## Project Overview
AI-powered music loop generator that integrates with Ableton Live, featuring conversational AI, music generation, and drag-and-drop functionality.

## Linear Project Information
- **Team**: GorkaMolero (ID: 26ed7749-d07f-4aa0-aff1-be669067d430)
- **Project**: Sidekick (ID: 767c232e-198b-4425-82ab-9cc47218c459)
- **Active Issues**: Track progress at https://linear.app/gorkamolero/

## Current Status (~70-80% Complete)

### ✅ Implemented & Working
- **Tauri desktop app** (not Electron) with React + TypeScript
- **Full conversational AI interface** using AI SDK v5
- **Multi-tab conversation management** with persistent storage
- **Message streaming and tool calling** 
- **AI Elements UI components** (conversation, message, response, reasoning, task)
- **Agent system** using Mastra framework in sidecar process
- **OpenRouter integration** with multiple model support
- **Music generation manager** with adapter pattern (MusicGen, Suno)
- **Audio analysis** using Essentia.js
- **Drag-and-drop audio files** with native OS support
- **IndexedDB persistence** for conversations and generations
- **Multiple theme support** including animated themes
- **Zustand state management** with persistence
- **Tailwind CSS** fully configured with custom themes

### 🚧 Partially Implemented
- **Ableton Live integration** - Mock data only, no real connection
- **Music generation services** - Structure exists, needs API connections
- **Audio preview** - Basic implementation, needs enhancement

### ❌ Not Yet Implemented
- **Real Ableton Live communication** via Ableton Link or Max4Live
- **Actual BPM/key detection** from DAW projects
- **Waveform visualization** (WaveSurfer.js installed but unused)
- **Google Lyria integration**
- **Stem separation**

## Project Structure
```
sidekick/
├── src/
│   ├── main/           # Tauri main process
│   ├── components/     # React components
│   │   ├── ai/        # AI SDK Elements components
│   │   ├── ui/        # UI components
│   │   └── ...
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utilities and helpers
│   ├── services/      # Service layer
│   │   ├── ai/       # AI service implementations
│   │   └── music/     # Music generation services
│   ├── stores/        # Zustand stores
│   └── types/         # TypeScript types
├── sidecar/           # Mastra agent sidecar process
├── src-tauri/         # Tauri backend
└── ...
```

## API Keys Required
- `OPENROUTER_API_KEY` - For AI models ✅ Added
- `REPLICATE_API_TOKEN` - For music generation ✅ Added

## Key Features
1. **Conversational AI** - Working with streaming and tool calls
2. **Music generation** - Structure ready, needs service connections
3. **Drag-and-drop to DAW** - OS-level working, DAW integration pending
4. **Project context awareness** - Mock data, needs real DAW connection
5. **Audio preview** - Basic implementation exists
6. **Generation history** - Fully implemented with persistence
7. **Always-on-top panel** - UI ready, window config needed

## Technical Stack
- **Tauri** for desktop app (not Electron)
- **React** for UI
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **AI SDK v5** for AI features
- **Mastra** for agent framework
- **Zustand** for state management
- **IndexedDB** for persistence
- **Essentia.js** for audio analysis
- **WaveSurfer.js** for visualization (not yet integrated)

## Next Priority Tasks
1. Fix MusicGen service path issues
2. Complete real Ableton Live integration
3. Implement waveform visualization
4. Ensure sidecar process is properly connected
5. Test and fix music generation APIs

## Important Development Guidelines
- **NEVER BUILD; NEVER DEV**: Do not run npm run build, npm run dev, or any build/dev commands
- **Tools should be in separate files**: Never put tool implementations in the same file as the agent
- **I will not try to guide models, models are intelligent**: Trust AI models' intelligence
- **This is AI SDK v5**: Always refer to v5 docs for implementation
- **Never change subjects on the user**: Stay focused on user's concerns
- **The app uses Tauri, not Electron**: Important for native features and APIs
- **COMMIT FILES ONE-BY-ONE**: Use git add for individual files, not git add -A or git add . Then use git commit with a message