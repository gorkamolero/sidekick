# Sidekick - Tauri Migration

This branch contains the Tauri version of Sidekick, migrated from Electron for better performance and smaller bundle size.

## Key Changes

### Performance Improvements
- **90% smaller app size**: ~3-10MB vs Electron's ~85MB
- **60-90% less RAM usage**: Better for running alongside Ableton
- **Faster startup and file operations**

### Architecture Changes
- Frontend: React/TypeScript (unchanged)
- Backend: Rust (replaced Electron main process)
- IPC: Tauri commands (replaced Electron IPC)
- Drag & Drop: @crabnebula/tauri-plugin-drag

### Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run tauri:dev

# Build for production
npm run tauri:build
```

### Migration Status
✅ Tauri setup and configuration
✅ Window configuration (always-on-top panel)
✅ Basic IPC commands (save audio, get project info)
✅ Drag & drop to external apps
✅ File system operations
✅ Frontend API wrapper

### TODO
- [ ] Implement agent streaming through Tauri
- [ ] Complete audio generation event system
- [ ] Test with Ableton Live drag & drop
- [ ] Add auto-updater
- [ ] Package for distribution

### Dependencies Removed
- All @electron-forge packages
- electron
- electron-squirrel-startup

### Dependencies Added
- @tauri-apps/cli
- @tauri-apps/api
- @crabnebula/tauri-plugin-drag
- Rust plugins: tauri-plugin-fs, tauri-plugin-dialog, tauri-plugin-shell