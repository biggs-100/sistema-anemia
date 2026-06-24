use tauri;

#[tauri::command]
pub async fn login(
    _app: tauri::AppHandle,
    _usuario: String,
    _password: String,
) -> Result<String, String> {
    Err("Not implemented".to_string())
}

#[tauri::command]
pub async fn logout(_app: tauri::AppHandle) -> Result<(), String> {
    Err("Not implemented".to_string())
}

#[tauri::command]
pub async fn current_user(_app: tauri::AppHandle) -> Result<String, String> {
    Err("Not implemented".to_string())
}
