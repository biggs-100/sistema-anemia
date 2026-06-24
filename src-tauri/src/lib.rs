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

use std::path::PathBuf;
use tauri::Manager;

use audit::AuditService;
use backup::BackupManager;
use repositories::{
    SqliteControlRepository, SqlitePatientRepository, SqliteTreatmentRepository,
    SqliteUserRepository,
};
use services::{
    AuthService, BackupService, ControlService, PatientService, TreatmentService,
};

pub struct AppState {
    pub pool: sqlx::SqlitePool,
    pub audit_service: AuditService,
    pub auth_service: AuthService,
    pub patient_service: PatientService,
    pub control_service: ControlService,
    pub treatment_service: TreatmentService,
    pub backup_service: BackupService,
    pub user_repo: Box<dyn repositories::UserRepository>,
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
        .setup(|app| {
            let handle = tokio::runtime::Handle::current();

            let pool = handle.block_on(database::init_db())?;
            handle.block_on(database::run_migrations(&pool))?;

            // --- Resolve data directories ---
            let data_dir = resolve_data_dir();
            let db_path = data_dir.join("anemia.db");
            let backups_dir = resolve_backups_dir();

            // --- Repositories ---
            let patient_repo = SqlitePatientRepository::new(pool.clone());
            let control_repo = SqliteControlRepository::new(pool.clone());
            let treatment_repo = SqliteTreatmentRepository::new(pool.clone());
            let user_repo = SqliteUserRepository::new(pool.clone());

            // --- Services ---
            let audit_service = AuditService::new(pool.clone());
            let backup_manager = BackupManager::new(
                pool.clone(),
                backups_dir,
                db_path,
            );

            let auth_service = AuthService::new(
                Box::new(SqliteUserRepository::new(pool.clone())),
                AuditService::new(pool.clone()),
            );

            let patient_service = PatientService::new(
                Box::new(patient_repo),
                AuditService::new(pool.clone()),
            );

            let control_service = ControlService::new(
                Box::new(control_repo),
                AuditService::new(pool.clone()),
            );

            let treatment_service = TreatmentService::new(
                Box::new(treatment_repo),
                AuditService::new(pool.clone()),
            );

            let backup_service = BackupService::new(backup_manager);

            // --- AppState ---
            app.manage(AppState {
                pool,
                audit_service,
                auth_service,
                patient_service,
                control_service,
                treatment_service,
                backup_service,
                user_repo: Box::new(user_repo),
            });

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
            commands::patients::deactivate_patient,
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
            commands::users::deactivate_user,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn resolve_data_dir() -> PathBuf {
    let mut path = std::env::current_exe().unwrap_or_else(|_| PathBuf::from("."));
    path.pop();
    path.push("data");
    path
}

fn resolve_backups_dir() -> PathBuf {
    let mut path = std::env::current_exe().unwrap_or_else(|_| PathBuf::from("."));
    path.pop();
    path.push("backups");
    path
}
