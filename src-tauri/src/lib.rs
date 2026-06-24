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
use std::sync::Arc;
use tauri::Manager;

use audit::AuditService;
use backup::BackupManager;
use repositories::{
    SqliteCentroPobladoRepository, SqliteControlRepository, SqlitePatientRepository,
    SqliteTreatmentRepository, SqliteUserRepository,
};
use services::{
    AuthService, BackupService, CentroPobladoService, ControlService, PatientService,
    ReportService, TreatmentService,
};

pub struct AppState {
    pub pool: sqlx::SqlitePool,
    pub audit_service: AuditService,
    pub auth_service: Arc<AuthService>,
    pub patient_service: PatientService,
    pub centro_poblado_service: CentroPobladoService,
    pub control_service: ControlService,
    pub treatment_service: TreatmentService,
    pub backup_service: BackupService,
    pub report_service: ReportService,
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

    // Create a Tokio runtime for async initialization (Tauri v2 setup runs on main thread)
    let rt = tokio::runtime::Runtime::new()
        .expect("Failed to create Tokio runtime");

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_process::init())
        .setup(move |app| {
            // Enter the Tokio runtime context so tokio::spawn works in setup
            let _rt_guard = rt.enter();

            let pool = rt.block_on(database::init_db())?;
            rt.block_on(database::run_migrations(&pool))?;

            // --- Admin seed: create default admin if DB is empty ---
            rt.block_on(seed_admin(&pool))?;

            // --- Resolve data directories ---
            let data_dir = resolve_data_dir();
            let db_path = data_dir.join("anemia.db");
            let backups_dir = resolve_backups_dir();

            // --- Repositories ---
            let patient_repo = SqlitePatientRepository::new(pool.clone());
            let control_repo = SqliteControlRepository::new(pool.clone());
            let treatment_repo = SqliteTreatmentRepository::new(pool.clone());
            let user_repo = SqliteUserRepository::new(pool.clone());
            let centro_poblado_repo = SqliteCentroPobladoRepository::new(pool.clone());

            // --- Services ---
            let audit_service = AuditService::new(pool.clone());
            let backup_manager = BackupManager::new(
                pool.clone(),
                backups_dir,
                db_path,
            );

            let patient_service = PatientService::new(
                Box::new(patient_repo),
                Box::new(centro_poblado_repo),
                AuditService::new(pool.clone()),
            );

            let centro_poblado_service = CentroPobladoService::new(
                Box::new(SqliteCentroPobladoRepository::new(pool.clone())),
            );

            let control_service = ControlService::new(
                Box::new(control_repo),
                AuditService::new(pool.clone()),
                pool.clone(),
            );

            let treatment_service = TreatmentService::new(
                Box::new(treatment_repo),
                AuditService::new(pool.clone()),
                pool.clone(),
            );

            let backup_mgr_for_scheduler = backup_manager.clone();
            let backup_service = BackupService::new(backup_manager);

            // --- ReportService ---
            let exports_dir = resolve_exports_dir();
            let report_service = ReportService::new(pool.clone(), exports_dir);

            // --- Daily backup scheduler (22:00) ---
            use chrono::Timelike;
            tokio::spawn(async move {
                loop {
                    let now = chrono::Local::now();
                    let next_run = if now.hour() >= 22 {
                        (chrono::Local::now().date_naive() + chrono::TimeDelta::days(1))
                            .and_hms_opt(22, 0, 0)
                            .unwrap()
                            .and_local_timezone(chrono::Local)
                            .unwrap()
                    } else {
                        now.date_naive()
                            .and_hms_opt(22, 0, 0)
                            .unwrap()
                            .and_local_timezone(chrono::Local)
                            .unwrap()
                    };
                    let duration = next_run - now;
                    let seconds = duration.num_seconds().max(0) as u64;
                    tracing::info!("Next auto-backup in {}s (22:00)", seconds);
                    tokio::time::sleep(tokio::time::Duration::from_secs(seconds)).await;
                    tracing::info!("Running scheduled daily backup...");
                    if let Err(e) = backup_mgr_for_scheduler.create_backup().await {
                        tracing::error!("Scheduled backup failed: {e}");
                    } else {
                        tracing::info!("Scheduled backup completed");
                    }
                }
            });

            // AuthService with Arc for shared ownership across commands + scavenger
            let auth_service = Arc::new(AuthService::new(
                Arc::new(SqliteUserRepository::new(pool.clone())),
                pool.clone(),
            ));

            // Start the background session scavenger
            auth_service.start_scavenger();

            // --- AppState ---
            app.manage(AppState {
                pool,
                audit_service,
                auth_service,
                patient_service,
                centro_poblado_service,
                control_service,
                treatment_service,
                backup_service,
                report_service,
                user_repo: Box::new(user_repo),
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::alertas::list_alertas,
            commands::alertas::resolver_alerta,
            commands::alertas::resolver_todas_alertas,
            commands::auth::login,
            commands::auth::logout,
            commands::auth::current_user,
            commands::auth::change_password,
            commands::patients::create_patient,
            commands::patients::update_patient,
            commands::patients::get_patient,
            commands::patients::search_patients,
            commands::patients::deactivate_patient,
            commands::controls::create_control,
            commands::controls::update_control,
            commands::controls::get_controls,
            commands::controls::get_controls_by_date_range,
            commands::treatments::create_treatment,
            commands::treatments::update_treatment,
            commands::treatments::finish_treatment,
            commands::treatments::suspend_treatment,
            commands::treatments::get_treatments,
            commands::medicamentos::list_medicamentos,
            commands::reports::generate_pdf,
            commands::reports::generate_excel,
            commands::reports::generate_csv,
            commands::backups::create_backup,
            commands::backups::restore_backup,
            commands::backups::list_backups,
            commands::users::list_users,
            commands::users::create_user,
            commands::users::update_user,
            commands::users::deactivate_user,
            commands::centros_poblados::list_centros_poblados,
            commands::dashboard::get_dashboard_stats,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// Seeds the default admin user if no users exist in the database.
async fn seed_admin(pool: &sqlx::SqlitePool) -> Result<(), Box<dyn std::error::Error>> {
    let count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM users")
        .fetch_one(pool)
        .await?;

    if count.0 == 0 {
        let hash = crate::security::hash_password("admin123")
            .map_err(|e| format!("Password hashing failed: {e}"))?;

        sqlx::query(
            "INSERT INTO users (usuario, password_hash, nombres, apellidos, rol_id) \
             VALUES ('admin', ?, 'Administrador', 'Sistema', 1)",
        )
        .bind(&hash)
        .execute(pool)
        .await?;

        tracing::info!("Initial admin user created with default credentials — change password on first login");
    } else {
        tracing::debug!("Users already exist, skipping admin seed");
    }
    Ok(())
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

fn resolve_exports_dir() -> PathBuf {
    let mut path = std::env::current_exe().unwrap_or_else(|_| PathBuf::from("."));
    path.pop();
    path.push("exports");
    path
}
