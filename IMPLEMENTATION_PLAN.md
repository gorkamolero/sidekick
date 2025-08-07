# Sidekick Implementation Plan

## Overview
This document outlines the step-by-step implementation plan for building Sidekick, an AI-powered music loop generator for Ableton Live.

## Phase Breakdown

### ✅ Phase 1: Core Setup (COMPLETED)
- [x] Initialize Electron + Vite + TypeScript
- [x] Configure React integration
- [x] Set up Git repository
- [x] Create basic app structure

### 📋 Phase 2: Install Dependencies (NEXT)
**Core Dependencies:**
- `ai` - Vercel AI SDK
- `@ai-sdk/google` - Google AI provider
- `@ai-sdk/openai` - OpenAI provider
- `zustand` - State management
- `@tanstack/react-query` - Data fetching
- `react-dropzone` - Drag & drop
- `wavesurfer.js` - Audio visualization
- `framer-motion` - Animations
- `lucide-react` - Icons
- `axios` - HTTP client
- `dotenv` - Environment variables

**Dev Dependencies:**
- `tailwindcss` - Styling
- `postcss` - CSS processing
- `autoprefixer` - CSS vendor prefixes
- `@types/wavesurfer.js` - TypeScript types

### 📋 Phase 3: Configure Tailwind CSS
1. Initialize Tailwind configuration
2. Set up custom Ableton-themed colors
3. Update index.css with Tailwind directives

### 📋 Phase 4: Create Project Structure
- Set up organized folder structure
- Create component directories
- Set up hooks and utilities
- Configure TypeScript types

### 📋 Phase 5: Build Core Components
1. **Main Process Updates**
   - Configure window properties (always on top, narrow panel)
   - Set up IPC handlers for file operations
   - Implement project info detection

2. **Core Components**
   - GenerationPanel: Main UI for prompt input
   - HistoryPanel: Display generated loops
   - AudioPreview: Waveform visualization
   - ProjectInfo: Show current BPM/key

3. **State Management**
   - Zustand store setup
   - Generation history management
   - Project context tracking

### 📋 Phase 6: Implement AI Generation
1. Set up API providers structure
2. Implement Google Lyria integration
3. Create audio generation hooks
4. Handle file saving and management
5. Configure environment variables

### 📋 Phase 7: Testing & Refinement
1. Test drag-and-drop with Ableton
2. Verify audio generation workflow
3. Test file management
4. Ensure UI responsiveness

### 📋 Phase 8: Polish & Deployment
1. Add loading states and animations
2. Implement error handling
3. Add keyboard shortcuts
4. Create distribution builds

## Implementation Order

1. **Start with Phase 2** - Install all dependencies
2. **Move to Phase 3** - Set up Tailwind for consistent styling
3. **Phase 4** - Create the folder structure (can create folders as needed)
4. **Phase 5** - Build components incrementally:
   - Start with main process updates
   - Build GenerationPanel first
   - Add HistoryPanel
   - Implement state management
5. **Phase 6** - Wire up AI generation
6. **Phase 7** - Test everything
7. **Phase 8** - Polish for release

## Key Milestones

- [ ] **Milestone 1**: Basic UI visible and running
- [ ] **Milestone 2**: Can input prompts and trigger generation
- [ ] **Milestone 3**: AI generation working with mock data
- [ ] **Milestone 4**: Real AI integration complete
- [ ] **Milestone 5**: Drag-and-drop to Ableton working
- [ ] **Milestone 6**: Full feature set complete

## Development Commands

```bash
# Development
npm run start    # Start Electron app
npm run dev      # Run in dev mode with hot reload

# Building
npm run make     # Create distribution package

# Testing
npm run lint     # Run linter
npm run typecheck # Run TypeScript checks
```

## Next Immediate Steps

1. Run `npm install` for all dependencies listed in Phase 2
2. Configure Tailwind CSS
3. Start building the GenerationPanel component

Ready to begin Phase 2!