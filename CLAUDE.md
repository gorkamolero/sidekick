# Sidekick Project Status

## Project Overview
Building an Electron app that sits beside Ableton Live, generates AI music loops, and allows drag-and-drop into DAW tracks.

## Current Status (Phase 1 ✓ Complete)
- ✅ Electron + Vite + TypeScript setup complete
- ✅ React integration configured
- ✅ Git repository initialized with remote origin: https://github.com/gorkamolero/sidekick.git
- ✅ Basic app structure ready with:
  - Vite configured for React
  - index.html with root div
  - index.tsx as main entry point
  - App.tsx component created
  - Dark theme CSS applied

## Project Structure
```
sidekick/
├── src/
│   ├── main.ts (Electron main process)
│   ├── preload.ts (Preload script)
│   ├── index.tsx (React entry point)
│   ├── App.tsx (Main React component)
│   └── index.css (Global styles)
├── index.html
├── package.json
├── vite.*.config.ts (Vite configs)
└── forge.config.ts (Electron Forge config)
```

## Next Steps
- Phase 2: Install all required dependencies
- Phase 3: Configure Tailwind CSS
- Phase 4: Create complete project structure
- Phase 5: Build core components
- Phase 6: Implement AI generation
- Phase 7: Testing
- Phase 8: Polish and deployment

## Key Features to Implement
1. AI music loop generation (Google Lyria, Suno, Udio)
2. Drag-and-drop to Ableton Live
3. Project context awareness (BPM, key detection)
4. Audio preview with waveform visualization
5. Generation history management
6. Always-on-top narrow panel UI

## Technical Stack
- Electron for desktop app
- React for UI
- TypeScript for type safety
- Tailwind CSS for styling
- AI SDK for generation
- WaveSurfer.js for audio visualization
- Zustand for state management
- React Query for API calls

## Important Development Guidelines
- **Tools should be in separate files**: Never put tool implementations in the same file as the agent. Each tool should have its own dedicated file for better organization and maintainability.