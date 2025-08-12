use std::fs;
use tauri::{Manager, Emitter};
use tauri_plugin_shell::ShellExt;
use tauri_plugin_positioner::{WindowExt, Position};
use serde_json::Value;

mod ableton_osc;

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

// Start the sidecar process
#[tauri::command]
async fn start_sidecar(app_handle: tauri::AppHandle) -> Result<String, String> {
    use tauri_plugin_shell::process::CommandEvent;
    
    let sidecar_command = app_handle
        .shell()
        .sidecar("sidecar")
        .map_err(|e| e.to_string())?
        .env("SIDECAR_PORT", "3001");
    
    let (mut rx, _child) = sidecar_command
        .spawn()
        .map_err(|e| format!("Failed to spawn sidecar: {}", e))?;
    
    // Listen for output
    tauri::async_runtime::spawn(async move {
        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Stdout(line) => {
                    println!("Sidecar stdout: {}", String::from_utf8_lossy(&line));
                }
                CommandEvent::Stderr(line) => {
                    eprintln!("Sidecar stderr: {}", String::from_utf8_lossy(&line));
                }
                CommandEvent::Error(err) => {
                    eprintln!("Sidecar error: {}", err);
                }
                CommandEvent::Terminated(status) => {
                    println!("Sidecar terminated with status: {:?}", status);
                    break;
                }
                _ => {}
            }
        }
    });
    
    Ok("Sidecar started".to_string())
}

// Call the sidecar API
#[tauri::command]
async fn call_sidecar_agent(messages: Vec<Value>, metadata: Option<Value>) -> Result<String, String> {
    let client = reqwest::Client::new();
    let body = serde_json::json!({
        "messages": messages,
        "metadata": metadata
    });
    
    // Call the sidecar HTTP endpoint
    let response = client
        .post("http://localhost:3001/agent/stream")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Failed to call sidecar: {}", e))?;
    
    let text = response
        .text()
        .await
        .map_err(|e| format!("Failed to read response: {}", e))?;
    
    Ok(text)
}

#[tauri::command]
async fn create_new_tab() -> Result<(), String> {
    // This command will be called when the shortcut is pressed
    // The actual logic will be handled in the frontend
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() -> Result<(), Box<dyn std::error::Error>> {
  tauri::Builder::default()
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_drag::init())
    .plugin(tauri_plugin_positioner::init())
    .invoke_handler(tauri::generate_handler![
        save_audio_file,
        get_project_info,
        get_temp_audio_path,
        start_sidecar,
        call_sidecar_agent,
        create_new_tab,
        ableton_osc::install_ableton_osc,
        ableton_osc::check_ableton_osc_installed,
        ableton_osc::test_ableton_connection,
        ableton_osc::get_ableton_info,
        ableton_osc::set_ableton_playing,
        ableton_osc::set_ableton_tempo,
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      
      // Get the main window and set it to full height
      let window = app.get_webview_window("main").unwrap();
      
      // Clone window for the closure
      let window_clone = window.clone();
      
      // Prevent Cmd+W from closing the window
      window.on_window_event(move |event| {
        if let tauri::WindowEvent::CloseRequested { api, .. } = event {
          api.prevent_close();
          // Emit event to frontend to close tab instead
          let _ = window_clone.emit("close-tab-shortcut", ());
        }
      });
      
      // Get the current monitor's size
      if let Some(monitor) = window.current_monitor().unwrap() {
        let screen_size = monitor.size();
        let screen_height = screen_size.height;
        
        // Set window to full height but keep width at 400px
        window.set_size(tauri::LogicalSize::new(400.0, screen_height as f64)).unwrap();
        
        // Set max width constraint to prevent resizing beyond 400px
        window.set_max_size(Some(tauri::LogicalSize::new(400.0, screen_height as f64))).unwrap();
        
        // Position it at the right edge using the positioner plugin
        let _ = window.move_window(Position::RightCenter);
      }
      
      
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
  
  Ok(())
}
