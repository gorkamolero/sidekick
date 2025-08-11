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
    let remote_scripts_path = get_ableton_user_library_path()?;
    
    // Create the Remote Scripts directory if it doesn't exist
    if !remote_scripts_path.exists() {
        fs::create_dir_all(&remote_scripts_path)
            .map_err(|e| format!("Failed to create Remote Scripts directory: {}", e))?;
    }
    
    let target_path = remote_scripts_path.join("AbletonOSC");
    
    // Check if AbletonOSC is already installed
    if target_path.exists() {
        return Ok(InstallResult {
            success: true,
            message: "AbletonOSC is already installed".to_string(),
            path: Some(target_path.to_string_lossy().to_string()),
        });
    }
    
    // Get the source AbletonOSC folder from resources
    let source_path = Path::new("resources/ableton/AbletonOSC");
    
    if !source_path.exists() {
        return Err("AbletonOSC source files not found in resources".to_string());
    }
    
    // Copy AbletonOSC to the Remote Scripts folder
    copy_dir_recursive(source_path, &target_path)
        .map_err(|e| format!("Failed to copy AbletonOSC: {}", e))?;
    
    Ok(InstallResult {
        success: true,
        message: format!(
            "AbletonOSC installed successfully. Please restart Ableton Live and select 'AbletonOSC' in Preferences > Link/MIDI > Control Surface"
        ),
        path: Some(target_path.to_string_lossy().to_string()),
    })
}

/// Check if AbletonOSC is installed
#[tauri::command]
pub async fn check_ableton_osc_installed() -> Result<bool, String> {
    let remote_scripts_path = get_ableton_user_library_path()?;
    let target_path = remote_scripts_path.join("AbletonOSC");
    Ok(target_path.exists())
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
        
        socket.set_read_timeout(Some(Duration::from_secs(2)))
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
    let client = OscClient::new()?;
    
    // Send a simple query to get the tempo
    client.send_message("/live/song/get/tempo", vec![])?;
    
    // Try to receive a response
    match client.receive_message() {
        Ok(_) => Ok(true),
        Err(_) => Ok(false),
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
    })
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

fn extract_int_from_response(packet: OscPacket) -> Result<i32, String> {
    match packet {
        OscPacket::Message(msg) => {
            msg.args.get(0)
                .and_then(|arg| match arg {
                    OscType::Int(i) => Some(*i),
                    _ => None,
                })
                .ok_or("Expected int in response".to_string())
        }
        _ => Err("Expected OSC message".to_string()),
    }
}