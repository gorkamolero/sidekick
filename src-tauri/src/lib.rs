use std::fs;
use tauri::Manager;

#[tauri::command]
async fn save_audio_file(buffer: Vec<u8>, filename: String) -> Result<String, String> {
    let temp_dir = std::env::temp_dir().join("sidekick-audio");
    fs::create_dir_all(&temp_dir).map_err(|e| e.to_string())?;
    
    let filepath = temp_dir.join(filename);
    fs::write(&filepath, buffer).map_err(|e| e.to_string())?;
    
    Ok(filepath.to_string_lossy().to_string())
}

#[tauri::command]
async fn get_project_info() -> Result<serde_json::Value, String> {
    // This would connect to Ableton via OSC or file parsing
    // For now, return mock data
    Ok(serde_json::json!({
        "bpm": 120,
        "key": "C minor",
        "timeSignature": "4/4"
    }))
}

#[tauri::command]
async fn get_temp_audio_path(filename: String) -> Result<String, String> {
    let temp_dir = std::env::temp_dir().join("sidekick-audio");
    fs::create_dir_all(&temp_dir).map_err(|e| e.to_string())?;
    let filepath = temp_dir.join(filename);
    Ok(filepath.to_string_lossy().to_string())
}

// Agent functionality moved to frontend using AI SDK directly

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_drag::init())
    .invoke_handler(tauri::generate_handler![
        save_audio_file,
        get_project_info,
        get_temp_audio_path
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      
      // Enable drag and drop
      let _window = app.get_webview_window("main").unwrap();
      
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
