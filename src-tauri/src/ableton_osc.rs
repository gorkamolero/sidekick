use std::fs;
use std::path::{Path, PathBuf};
use std::net::{SocketAddr, UdpSocket};
use std::time::Duration;
use rosc::{OscMessage, OscPacket, OscType};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct AbletonInfo {
    pub tempo: f32,
    pub is_playing: bool,
    pub current_time: f32,
    pub scene_count: i32,
    pub track_count: i32,
    pub signature_numerator: i32,
    pub signature_denominator: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InstallResult {
    pub success: bool,
    pub message: String,
    pub path: Option<String>,
}

/// Find the Ableton User Library path based on the OS
fn get_ableton_user_library_path() -> Result<PathBuf, String> {
    let home = dirs::home_dir().ok_or("Could not find home directory")?;
    
    #[cfg(target_os = "macos")]
    {
        let path = home.join("Music/Ableton/User Library/Remote Scripts");
        Ok(path)
    }
    
    #[cfg(target_os = "windows")]
    {
        let path = home.join("Documents/Ableton/User Library/Remote Scripts");
        Ok(path)
    }
    
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        Err("Unsupported operating system".to_string())
    }
}

/// Install AbletonOSC to Ableton's Remote Scripts folder
#[tauri::command]
pub async fn install_ableton_osc() -> Result<InstallResult, String> {
    // First, close Ableton if it's running
    #[cfg(target_os = "macos")]
    {
        let _ = std::process::Command::new("pkill")
            .args(&["-x", "Live"])
            .output();
        // Wait a moment for Ableton to close
        std::thread::sleep(std::time::Duration::from_secs(2));
    }
    
    #[cfg(target_os = "windows")]
    {
        let _ = std::process::Command::new("taskkill")
            .args(&["/IM", "Ableton Live*.exe", "/F"])
            .output();
        std::thread::sleep(std::time::Duration::from_secs(2));
    }
    
    let remote_scripts_path = get_ableton_user_library_path()?;
    
    // Create the Remote Scripts directory if it doesn't exist
    if !remote_scripts_path.exists() {
        fs::create_dir_all(&remote_scripts_path)
            .map_err(|e| format!("Failed to create Remote Scripts directory: {}", e))?;
    }
    
    let target_path = remote_scripts_path.join("AbletonOSC");
    
    // Check if AbletonOSC is already installed
    if target_path.exists() {
        // Remove old installation to ensure clean install
        fs::remove_dir_all(&target_path)
            .map_err(|e| format!("Failed to remove old installation: {}", e))?;
    }
    
    // Download AbletonOSC ZIP from GitHub
    let temp_dir = std::env::temp_dir();
    let zip_path = temp_dir.join("AbletonOSC.zip");
    let extract_dir = temp_dir.join("AbletonOSC-extract");
    
    // Clean up any existing temp files
    if extract_dir.exists() {
        fs::remove_dir_all(&extract_dir)
            .map_err(|e| format!("Failed to clean temp directory: {}", e))?;
    }
    
    // Download the ZIP file
    let output = std::process::Command::new("curl")
        .args(&["-L", "-o", zip_path.to_str().unwrap(), "https://github.com/ideoforms/AbletonOSC/archive/refs/heads/master.zip"])
        .output()
        .map_err(|e| format!("Failed to download AbletonOSC: {}. Make sure curl is installed.", e))?;
    
    if !output.status.success() {
        return Err(format!("Failed to download AbletonOSC: {}", String::from_utf8_lossy(&output.stderr)));
    }
    
    // Unzip the file
    let output = std::process::Command::new("unzip")
        .args(&["-q", zip_path.to_str().unwrap(), "-d", extract_dir.to_str().unwrap()])
        .output()
        .map_err(|e| format!("Failed to unzip AbletonOSC: {}", e))?;
    
    if !output.status.success() {
        return Err(format!("Failed to unzip AbletonOSC: {}", String::from_utf8_lossy(&output.stderr)));
    }
    
    // The extracted folder will be named AbletonOSC-master
    let source_path = extract_dir.join("AbletonOSC-master");
    
    // Copy to the Remote Scripts folder with the correct name
    copy_dir_recursive(&source_path, &target_path)
        .map_err(|e| format!("Failed to copy AbletonOSC: {}", e))?;
    
    // Clean up temp files
    let _ = fs::remove_file(&zip_path);
    let _ = fs::remove_dir_all(&extract_dir);
    
    // Reopen Ableton
    #[cfg(target_os = "macos")]
    {
        std::thread::sleep(std::time::Duration::from_secs(1));
        // Try to open any version of Ableton Live
        let _ = std::process::Command::new("open")
            .args(&["-b", "com.ableton.live"])
            .output();
    }
    
    #[cfg(target_os = "windows")]
    {
        // Try to find and launch Ableton
        let program_files = std::env::var("ProgramFiles").unwrap_or_else(|_| "C:\\Program Files".to_string());
        let ableton_path = format!("{}\\Ableton\\Live 12 Suite\\Program\\Ableton Live 12 Suite.exe", program_files);
        if Path::new(&ableton_path).exists() {
            let _ = std::process::Command::new(&ableton_path).spawn();
        }
    }
    
    Ok(InstallResult {
        success: true,
        message: format!(
            "AbletonOSC installed successfully! Ableton is restarting.\nPlease:\n1. Go to Preferences > Link/Tempo/MIDI\n2. Select 'AbletonOSC' from Control Surface dropdown"
        ),
        path: Some(target_path.to_string_lossy().to_string()),
    })
}

/// Check if AbletonOSC is installed
#[tauri::command]
pub async fn check_ableton_osc_installed() -> Result<bool, String> {
    let remote_scripts_path = get_ableton_user_library_path()?;
    let target_path = remote_scripts_path.join("AbletonOSC");
    
    // Log the path we're checking
    println!("Checking for AbletonOSC at: {:?}", target_path);
    println!("Path exists: {}", target_path.exists());
    
    // Check if the directory exists and contains the main Python file
    let exists = target_path.exists() && target_path.join("__init__.py").exists();
    println!("AbletonOSC installation check result: {}", exists);
    
    Ok(exists)
}

/// Recursively copy a directory
fn copy_dir_recursive(src: &Path, dst: &Path) -> std::io::Result<()> {
    fs::create_dir_all(dst)?;
    
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let file_type = entry.file_type()?;
        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());
        
        if file_type.is_dir() {
            copy_dir_recursive(&src_path, &dst_path)?;
        } else {
            fs::copy(&src_path, &dst_path)?;
        }
    }
    
    Ok(())
}

pub struct OscClient {
    socket: UdpSocket,
    ableton_addr: SocketAddr,
}

impl OscClient {
    pub fn new() -> Result<Self, String> {
        let socket = UdpSocket::bind("0.0.0.0:11001")
            .map_err(|e| format!("Failed to bind OSC socket: {}", e))?;
        
        socket.set_read_timeout(Some(Duration::from_millis(500)))
            .map_err(|e| format!("Failed to set socket timeout: {}", e))?;
        
        let ableton_addr = "127.0.0.1:11000".parse()
            .map_err(|e| format!("Failed to parse Ableton address: {}", e))?;
        
        Ok(Self {
            socket,
            ableton_addr,
        })
    }
    
    pub fn send_message(&self, address: &str, args: Vec<OscType>) -> Result<(), String> {
        let msg = OscMessage {
            addr: address.to_string(),
            args,
        };
        
        let packet = OscPacket::Message(msg);
        let buf = rosc::encoder::encode(&packet)
            .map_err(|e| format!("Failed to encode OSC message: {}", e))?;
        
        self.socket.send_to(&buf, self.ableton_addr)
            .map_err(|e| format!("Failed to send OSC message: {}", e))?;
        
        Ok(())
    }
    
    pub fn receive_message(&self) -> Result<OscPacket, String> {
        let mut buf = [0u8; 1024];
        let (size, _) = self.socket.recv_from(&mut buf)
            .map_err(|e| format!("Failed to receive OSC message: {}", e))?;
        
        rosc::decoder::decode_udp(&buf[..size])
            .map_err(|e| format!("Failed to decode OSC message: {}", e))
            .map(|(_, packet)| packet)
    }
}

/// Test OSC connection to Ableton
#[tauri::command]
pub async fn test_ableton_connection() -> Result<bool, String> {
    // Try to create the client first
    let client = match OscClient::new() {
        Ok(c) => c,
        Err(_) => return Ok(false),
    };
    
    // Send a ping message that AbletonOSC responds to
    if let Err(_) = client.send_message("/live/test", vec![]) {
        return Ok(false);
    }
    
    // Try to receive any response
    match client.receive_message() {
        Ok(_) => Ok(true),
        Err(_) => {
            // Try alternative message
            if let Ok(_) = client.send_message("/live/song/get/tempo", vec![]) {
                Ok(client.receive_message().is_ok())
            } else {
                Ok(false)
            }
        }
    }
}

/// Get Ableton Live info via OSC
#[tauri::command]
pub async fn get_ableton_info() -> Result<AbletonInfo, String> {
    let client = OscClient::new()?;
    
    // Get tempo
    client.send_message("/live/song/get/tempo", vec![])?;
    let tempo_response = client.receive_message()?;
    let tempo = extract_float_from_response(tempo_response)?;
    
    // Get playing status
    client.send_message("/live/song/get/is_playing", vec![])?;
    let playing_response = client.receive_message()?;
    let is_playing = extract_bool_from_response(playing_response)?;
    
    // Get current time
    client.send_message("/live/song/get/current_song_time", vec![])?;
    let time_response = client.receive_message()?;
    let current_time = extract_float_from_response(time_response)?;
    
    // Get time signature numerator
    client.send_message("/live/song/get/signature_numerator", vec![])?;
    let sig_num_response = client.receive_message()?;
    let signature_numerator = extract_int_from_response(sig_num_response).unwrap_or(4);
    
    // Get time signature denominator  
    client.send_message("/live/song/get/signature_denominator", vec![])?;
    let sig_denom_response = client.receive_message()?;
    let signature_denominator = extract_int_from_response(sig_denom_response).unwrap_or(4);
    
    // Get scene count
    client.send_message("/live/song/get/num_scenes", vec![])?;
    let scenes_response = client.receive_message()?;
    let scene_count = extract_int_from_response(scenes_response)?;
    
    // Get track count
    client.send_message("/live/song/get/num_tracks", vec![])?;
    let tracks_response = client.receive_message()?;
    let track_count = extract_int_from_response(tracks_response)?;
    
    Ok(AbletonInfo {
        tempo,
        is_playing,
        current_time,
        scene_count,
        track_count,
        signature_numerator,
        signature_denominator,
    })
}

fn extract_int_from_response(packet: OscPacket) -> Result<i32, String> {
    match packet {
        OscPacket::Message(msg) => {
            if let Some(OscType::Int(val)) = msg.args.get(0) {
                Ok(*val)
            } else if let Some(OscType::Float(val)) = msg.args.get(0) {
                Ok(*val as i32)
            } else {
                Err("Response did not contain an integer value".to_string())
            }
        }
        _ => Err("Response was not a message".to_string())
    }
}

/// Start/stop playback in Ableton
#[tauri::command]
pub async fn set_ableton_playing(playing: bool) -> Result<(), String> {
    let client = OscClient::new()?;
    
    if playing {
        client.send_message("/live/song/start_playing", vec![])?;
    } else {
        client.send_message("/live/song/stop_playing", vec![])?;
    }
    
    Ok(())
}

/// Set tempo in Ableton
#[tauri::command]
pub async fn set_ableton_tempo(tempo: f32) -> Result<(), String> {
    let client = OscClient::new()?;
    client.send_message("/live/song/set/tempo", vec![OscType::Float(tempo)])?;
    Ok(())
}

// Helper functions to extract values from OSC responses
fn extract_float_from_response(packet: OscPacket) -> Result<f32, String> {
    match packet {
        OscPacket::Message(msg) => {
            msg.args.get(0)
                .and_then(|arg| match arg {
                    OscType::Float(f) => Some(*f),
                    _ => None,
                })
                .ok_or("Expected float in response".to_string())
        }
        _ => Err("Expected OSC message".to_string()),
    }
}

fn extract_bool_from_response(packet: OscPacket) -> Result<bool, String> {
    match packet {
        OscPacket::Message(msg) => {
            msg.args.get(0)
                .and_then(|arg| match arg {
                    OscType::Int(i) => Some(*i != 0),
                    OscType::Bool(b) => Some(*b),
                    _ => None,
                })
                .ok_or("Expected bool in response".to_string())
        }
        _ => Err("Expected OSC message".to_string()),
    }
}

