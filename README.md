# Sidekick

AI copilot for music producers. A narrow desktop panel that sits next to Ableton Live, chats about the track, generates loops, analyzes audio, and moves files back into the producer workflow.

Sidekick is built around a practical bet: creative AI tools become much more useful when they live inside the working context instead of forcing the user into a separate web app. The app combines a Tauri desktop shell, a React chat interface, a Mastra sidecar agent, music generation adapters, audio analysis tools, and early Ableton OSC integration.

## What It Proves

- Product taste for creative tools: compact panel, fast prompts, multi-tab sessions, drag-and-drop audio, animated themes, and producer-friendly defaults.
- Agentic product architecture: a local desktop UI delegates to a sidecar agent with tool calls for generation, audio analysis, Ableton docs, and OSC actions.
- Practical AI integration: OpenRouter/AI SDK chat, Mastra tools, service adapters for MusicGen and Suno-style generation, and persistent conversation state.
- Native workflow thinking: Tauri replaces Electron for a smaller desktop footprint that can run beside Ableton.
- Domain translation: music-production concepts become concrete software surfaces, including loops, samples, inspiration mode, BPM/key context, audio uploads, and DAW handoff.

## Product Model

```text
Producer prompt or audio file
  -> Sidekick desktop panel
  -> React chat and generation UI
  -> Mastra sidecar agent
  -> tools: generate, analyze, search Ableton docs, send OSC actions
  -> local audio file
  -> drag back into Ableton Live
```

## Current Features

- Conversational AI interface with streaming, tool-call display, and multi-tab conversation management.
- Prompt modes for different creative jobs, including loop, sample, inspiration, and analysis workflows.
- Audio file drop/upload flow with local temporary storage.
- Music generation manager with adapter structure for multiple services.
- Audio analysis service using Essentia.js utilities.
- OpenRouter model access through AI SDK and Mastra.
- IndexedDB/Zustand persistence for conversations and generations.
- Tauri native shell with filesystem, dialog, shell, drag, positioner, and sidecar support.
- Ableton OSC command surface for installation checks, connection tests, project info, tempo, and playback controls.
- Compact always-on-top style panel designed to sit beside a DAW.

## Status

This is an active prototype, not a packaged public app.

Working or substantially implemented:

- Tauri desktop app.
- React/TypeScript UI.
- Chat interface and conversation state.
- Sidecar agent process.
- Tool calling surface.
- Audio upload and temporary file handling.
- Music generation service abstraction.
- Audio analysis infrastructure.
- Early Ableton OSC command layer.

Still in progress:

- Real Ableton project sync beyond partial OSC plumbing and mock defaults.
- Production-grade MusicGen/Suno service connections.
- Waveform visualization.
- Packaged distribution and updater.
- End-to-end DAW workflow QA.

## Quick Start

Requirements:

- Node.js and npm
- Rust toolchain for Tauri
- Ableton Live for the intended workflow
- API keys for the selected AI and music generation providers

Install dependencies:

```bash
npm install
cd sidecar
npm install
cd ..
```

Run the Tauri app in development:

```bash
npm run dev:all
```

Build a local desktop package:

```bash
npm run tauri:build
```

The app expects provider credentials in local environment configuration. Keep keys out of git.

## Architecture

Key files:

```text
src/App.tsx                         desktop UI composition and app lifecycle
src/components/GenerationPanel.tsx  prompt, mode, and audio attachment flow
src/components/ChatInterface.tsx    conversation surface
src/lib/store                       conversation, generation, and project state
src/lib/tauri-api.ts                frontend wrapper around Tauri commands
src/hooks/useAgent.ts               agent request flow
src/hooks/useAbleton.ts             Ableton sync state
sidecar/src/agent.ts                Mastra agent and tool registration
sidecar/src/music-generation        generation service manager and adapters
sidecar/src/tools                   audio, docs, and OSC tools
src-tauri/src/lib.rs                native commands, sidecar bridge, window behavior
src-tauri/src/ableton_osc.rs        Ableton OSC command layer
```

Desktop shape:

```text
Tauri shell
  -> React UI
  -> Tauri commands
  -> sidecar HTTP process
  -> Mastra agent
  -> provider APIs and local tools
```

## Development Commands

```bash
npm run dev          # Vite renderer only
npm run dev:all      # sidecar plus Tauri app
npm run tauri:dev    # Tauri app
npm run lint         # ESLint
npm test             # Vitest
```

## Portfolio Context

Sidekick is the clearest creative AI product in this portfolio. It shows the same engineering pattern as the agentic tooling projects, but applied to taste, flow, and music production rather than purely developer workflows.

The strongest hiring signal is the product judgment: Sidekick is not just a prompt box for music. It is an attempt to make an AI collaborator fit the physical rhythm of producing: small panel, fast iteration, audio in/out, DAW context, and native handoff.

## Public Packaging Needs

- Add screenshots of the panel, chat, generation mode selector, and audio analysis surface.
- Add a short demo clip showing prompt -> generated loop -> drag to Ableton.
- Replace any local-only setup assumptions with a clear `.env.example`.
- Decide which music generation provider path is the default public path.
- Add an honest release checklist before distributing builds.

## Built With

- Tauri
- React
- TypeScript
- Mastra
- AI SDK
- OpenRouter
- Zustand
- IndexedDB
- Essentia.js
- Tailwind CSS
- Ableton OSC
