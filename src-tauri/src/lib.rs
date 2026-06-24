mod commands;
mod services;
mod repositories;
mod database;
mod models;
mod dto;
mod audit;
mod backup;
mod security;
mod errors;

use tauri::Manager;

pub struct AppState {
    pub pool: r2d2::Pool<r2d2_sqlite::SqliteConnectionManager>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "sistema_anemia=info".into()),
        )
        .init();

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_process::init())
        .setup(|_app| {
            let pool = database::init_db()?;
            database::run_migrations(&pool)?;
            _app.manage(AppState { pool });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::auth::login,
            commands::auth::logout,
            commands::auth::current_user,
            commands::patients::create_patient,
            commands::patients::update_patient,
            commands::patients::get_patient,
            commands::patients::search_patients,
            commands::controls::create_control,
            commands::controls::update_control,
            commands::controls::get_controls,
            commands::treatments::create_treatment,
            commands::treatments::finish_treatment,
            commands::treatments::get_treatments,
            commands::reports::generate_pdf,
            commands::reports::generate_excel,
            commands::backups::create_backup,
            commands::backups::restore_backup,
            commands::backups::list_backups,
            commands::users::list_users,
            commands::users::create_user,
            commands::users::update_user,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
