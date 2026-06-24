use tauri::AppHandle;
use tauri::State;
use tauri::Manager;

use crate::dto::{ApiResponse, LoginDTO};
use crate::models::User;
use crate::AppState;

#[tauri::command]
pub async fn login(
    app: AppHandle,
    usuario: String,
    password: String,
) -> Result<ApiResponse<String>, String> {
    let state: State<AppState> = app.state();
    let dto = LoginDTO { usuario, password };
    state
        .auth_service
        .login(&dto)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn logout(app: AppHandle, token: String) -> Result<(), String> {
    let state: State<AppState> = app.state();
    state
        .auth_service
        .logout(&token)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn current_user(app: AppHandle, token: String) -> Result<ApiResponse<User>, String> {
    let state: State<AppState> = app.state();
    state
        .auth_service
        .current_user(&token)
        .await
        .map_err(|e| e.to_string())
}
