use tauri::State;
use tauri::AppHandle;
use tauri::Manager;

use crate::dto::ApiResponse;
use crate::models::UserResponse;
use crate::AppState;

#[tauri::command]
pub async fn login(
    app: AppHandle,
    usuario: String,
    password: String,
) -> Result<ApiResponse<serde_json::Value>, String> {
    let state: State<AppState> = app.state();
    let (token, user) = state
        .auth_service
        .login(&usuario, &password)
        .await
        .map_err(|e| e.to_string())?;

    Ok(ApiResponse::success(serde_json::json!({
        "token": token,
        "user": user,
    })))
}

#[tauri::command]
pub async fn logout(app: AppHandle, token: String) -> Result<ApiResponse<()>, String> {
    let state: State<AppState> = app.state();
    state
        .auth_service
        .logout(&token)
        .await
        .map_err(|e| e.to_string())?;
    Ok(ApiResponse::success(()))
}

#[tauri::command]
pub async fn current_user(
    app: AppHandle,
    token: String,
) -> Result<ApiResponse<UserResponse>, String> {
    let state: State<AppState> = app.state();
    let user = state
        .auth_service
        .current_user(&token)
        .await
        .map_err(|e| e.to_string())?;
    Ok(ApiResponse::success(user))
}

#[tauri::command]
pub async fn change_password(
    app: AppHandle,
    token: String,
    old_password: String,
    new_password: String,
) -> Result<ApiResponse<()>, String> {
    let state: State<AppState> = app.state();
    let user = state
        .auth_service
        .require_role(&token, crate::services::auth_service::ALL_ROLES)
        .await
        .map_err(|e| e.to_string())?;

    state
        .auth_service
        .change_password(user.id, &old_password, &new_password)
        .await
        .map_err(|e| e.to_string())?;
    Ok(ApiResponse::success(()))
}
