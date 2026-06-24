pub mod centro_poblado_repository;
pub mod control_repository;
pub mod patient_repository;
pub mod treatment_repository;
pub mod user_repository;

// Re-export concrete types for lib.rs construction
pub use centro_poblado_repository::SqliteCentroPobladoRepository;
pub use control_repository::SqliteControlRepository;
pub use patient_repository::SqlitePatientRepository;
pub use treatment_repository::SqliteTreatmentRepository;
pub use user_repository::SqliteUserRepository;
pub use user_repository::UserRepository; // Used in AppState via Box<dyn>
