pub mod alerta_generator;
pub mod auth_service;
pub mod centro_poblado_service;
pub mod control_service;
pub mod patient_service;
pub mod report_service;
pub mod treatment_service;
pub mod backup_service;

pub use auth_service::AuthService;
pub use centro_poblado_service::CentroPobladoService;
pub use control_service::ControlService;
pub use patient_service::PatientService;
pub use report_service::ReportService;
pub use treatment_service::TreatmentService;
pub use backup_service::BackupService;
