use std::collections::HashMap;
use std::sync::Arc;

use chrono::{DateTime, Utc};
use tokio::sync::RwLock;
use uuid::Uuid;

use sqlx::SqlitePool;

use crate::audit::AuditService;
use crate::errors::AppError;
use crate::models::UserResponse;
use crate::repositories::user_repository::UserRepository;
use crate::security;

/// Role constants for RBAC guards.
pub const ALL_ROLES: &[i64] = &[1, 2, 3, 4];
pub const CLINICAL_ROLES: &[i64] = &[1, 3];
pub const ADMIN_ONLY: &[i64] = &[1];

/// Session data stored in-memory.
#[derive(Debug, Clone)]
pub struct SessionData {
    pub user_id: i64,
    pub username: String,
    pub rol_id: i64,
    pub created_at: DateTime<Utc>,
    pub last_accessed_at: DateTime<Utc>,
}

/// Session TTL in hours.
const SESSION_TTL_HOURS: i64 = 8;

/// Authentication service with in-memory session management, RBAC, and audit.
pub struct AuthService {
    user_repo: Arc<dyn UserRepository>,
    audit: AuditService,
    pool: SqlitePool,
    sessions: Arc<RwLock<HashMap<String, SessionData>>>,
}

impl AuthService {
    pub fn new(user_repo: Arc<dyn UserRepository>, pool: SqlitePool) -> Self {
        Self {
            user_repo,
            audit: AuditService::new(pool.clone()),
            pool,
            sessions: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Authenticates a user and returns a session token + public user info.
    ///
    /// Uses a generic error message for ALL failures to prevent user enumeration.
    pub async fn login(
        &self,
        usuario: &str,
        password: &str,
    ) -> Result<(String, UserResponse), AppError> {
        // Validate empty inputs
        if usuario.trim().is_empty() || password.is_empty() {
            self.audit
                .log_event(None, "LOGIN_FAILED", "users", None, None, None, None)
                .await?;
            return Err(AppError::Unauthorized(
                "Usuario o contraseña incorrectos".to_string(),
            ));
        }

        let user = self
            .user_repo
            .find_by_username(usuario)
            .await?
            .ok_or_else(|| {
                AppError::Unauthorized("Usuario o contraseña incorrectos".to_string())
            })?;

        if !user.activo {
            return Err(AppError::Unauthorized(
                "Usuario o contraseña incorrectos".to_string(),
            ));
        }

        let valid = security::verify_password(password, &user.password_hash)?;
        if !valid {
            // Log failed attempt
            self.audit
                .log_event(Some(user.id), "LOGIN_FAILED", "users", Some(user.id), None, None, None)
                .await?;
            return Err(AppError::Unauthorized(
                "Usuario o contraseña incorrectos".to_string(),
            ));
        }

        let token = Uuid::now_v7().to_string();
        let now = Utc::now();

        let session = SessionData {
            user_id: user.id,
            username: user.usuario.clone(),
            rol_id: user.rol_id,
            created_at: now,
            last_accessed_at: now,
        };

        self.sessions.write().await.insert(token.clone(), session);

        // Look up role name for the response
        let rol_nombre = self.get_role_name(user.rol_id).await?;

        let user_response = UserResponse {
            id: user.id,
            usuario: user.usuario,
            nombres: user.nombres,
            apellidos: user.apellidos,
            rol_id: user.rol_id,
            rol_nombre,
            activo: user.activo,
        };

        // Audit log: successful login
        self.audit
            .log_event(Some(user_response.id), "LOGIN", "users", Some(user_response.id), None, None, None)
            .await?;

        tracing::info!("User '{}' logged in (id={})", user_response.usuario, user_response.id);
        Ok((token, user_response))
    }

    /// Logs out a user by removing their session token.
    pub async fn logout(&self, token: &str) -> Result<(), AppError> {
        let session = self
            .sessions
            .write()
            .await
            .remove(token)
            .ok_or_else(|| AppError::Unauthorized("Sesión inválida o expirada".to_string()))?;

        self.audit
            .log_event(Some(session.user_id), "LOGOUT", "users", Some(session.user_id), None, None, None)
            .await?;

        tracing::debug!("User {} logged out", session.user_id);
        Ok(())
    }

    /// Validates a session token, checks 8h TTL, and updates last_accessed_at.
    pub async fn validate_token(&self, token: &str) -> Result<SessionData, AppError> {
        let mut sessions = self.sessions.write().await;

        // Scavenge expired sessions on access
        let now = Utc::now();
        sessions.retain(|_, s| {
            let expires_at = s.created_at + chrono::Duration::hours(SESSION_TTL_HOURS);
            expires_at > now
        });

        let session = sessions
            .get(token)
            .ok_or_else(|| AppError::Unauthorized("Sesión inválida o expirada".to_string()))?
            .clone();

        // Update last_accessed_at
        if let Some(entry) = sessions.get_mut(token) {
            entry.last_accessed_at = now;
        }

        Ok(session)
    }

    /// Validates a token AND checks that the user has one of the required roles.
    ///
    /// Returns `UserResponse` with role name on success.
    pub async fn require_role(
        &self,
        token: &str,
        roles: &[i64],
    ) -> Result<UserResponse, AppError> {
        let session = self.validate_token(token).await?;

        if !roles.contains(&session.rol_id) {
            // Log unauthorized access attempt
            self.audit
                .log_event(
                    Some(session.user_id),
                    "UNAUTHORIZED_ACCESS",
                    "users",
                    Some(session.user_id),
                    None,
                    None,
                    None,
                )
                .await?;
            return Err(AppError::Unauthorized(
                "No tiene permisos para realizar esta acción".to_string(),
            ));
        }

        let user = self
            .user_repo
            .find_by_id(session.user_id)
            .await?
            .ok_or_else(|| AppError::NotFound("Usuario no encontrado".to_string()))?;

        let rol_nombre = self.get_role_name(user.rol_id).await?;

        Ok(UserResponse {
            id: user.id,
            usuario: user.usuario,
            nombres: user.nombres,
            apellidos: user.apellidos,
            rol_id: user.rol_id,
            rol_nombre,
            activo: user.activo,
        })
    }

    /// Changes the user's password after verifying the old password.
    pub async fn change_password(
        &self,
        user_id: i64,
        old_password: &str,
        new_password: &str,
    ) -> Result<(), AppError> {
        security::validate_password_complexity(new_password)?;

        let user = self
            .user_repo
            .find_by_id(user_id)
            .await?
            .ok_or_else(|| AppError::NotFound("Usuario no encontrado".to_string()))?;

        let valid = security::verify_password(old_password, &user.password_hash)?;
        if !valid {
            return Err(AppError::Unauthorized(
                "La contraseña actual no es correcta".to_string(),
            ));
        }

        let new_hash = security::hash_password(new_password)?;
        self.user_repo.update_password(user_id, &new_hash).await?;

        self.audit
            .log_event(Some(user_id), "CHANGE_PASSWORD", "users", Some(user_id), None, None, None)
            .await?;

        tracing::info!("Password changed for user {user_id}");
        Ok(())
    }

    /// Returns the current user info for a valid session.
    pub async fn current_user(&self, token: &str) -> Result<UserResponse, AppError> {
        self.require_role(token, ALL_ROLES).await
    }

    /// Starts a background session scavenger that runs every 5 minutes.
    ///
    /// Removes expired sessions from the in-memory store.
    pub fn start_scavenger(self: &Arc<Self>) {
        let sessions = self.sessions.clone();
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(300));
            loop {
                interval.tick().await;
                let now = Utc::now();
                let mut sessions = sessions.write().await;
                let before = sessions.len();
                sessions.retain(|_, s| {
                    let expires_at = s.created_at + chrono::Duration::hours(SESSION_TTL_HOURS);
                    expires_at > now
                });
                let removed = before - sessions.len();
                if removed > 0 {
                    tracing::debug!("Scavenger removed {removed} expired sessions");
                }
            }
        });
    }

    /// Helper: looks up the role name by ID.
    async fn get_role_name(&self, rol_id: i64) -> Result<String, AppError> {
        let nombre: Option<String> = sqlx::query_scalar(
            "SELECT nombre FROM roles WHERE id = ?1",
        )
        .bind(rol_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| AppError::Database(format!("Failed to fetch role name: {e}")))?;

        nombre.ok_or_else(|| AppError::NotFound(format!("Rol {rol_id} no encontrado")))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::repositories::user_repository::SqliteUserRepository;

    /// Helper: create an in-memory SQLite pool with migrations.
    async fn setup_test_pool() -> SqlitePool {
        let pool = SqlitePool::connect("sqlite::memory:").await.unwrap();
        sqlx::query("CREATE TABLE IF NOT EXISTS roles (id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT NOT NULL UNIQUE)")
            .execute(&pool).await.unwrap();
        sqlx::query("INSERT INTO roles (id, nombre) VALUES (1, 'Admin'), (2, 'Supervisor'), (3, 'Operador'), (4, 'Consulta')")
            .execute(&pool).await.unwrap();
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                nombres TEXT NOT NULL,
                apellidos TEXT NOT NULL,
                rol_id INTEGER NOT NULL,
                activo INTEGER NOT NULL DEFAULT 1,
                creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (rol_id) REFERENCES roles(id)
            )"
        )
        .execute(&pool).await.unwrap();
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS audit_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario_id INTEGER,
                accion TEXT NOT NULL,
                tabla_afectada TEXT NOT NULL,
                registro_id INTEGER,
                datos_anteriores TEXT,
                datos_nuevos TEXT,
                fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
                ip_local TEXT
            )"
        )
        .execute(&pool).await.unwrap();
        pool
    }

    async fn create_test_user(pool: &SqlitePool, password_hash: &str, rol_id: i64) -> i64 {
        sqlx::query_scalar::<_, i64>(
            "INSERT INTO users (usuario, password_hash, nombres, apellidos, rol_id) VALUES (?1, ?2, ?3, ?4, ?5) RETURNING id"
        )
        .bind("testuser")
        .bind(password_hash)
        .bind("Test")
        .bind("User")
        .bind(rol_id)
        .fetch_one(pool)
        .await
        .unwrap()
    }

    #[tokio::test]
    async fn test_login_success() {
        let pool = setup_test_pool().await;
        let hash = crate::security::hash_password("password123").unwrap();
        create_test_user(&pool, &hash, 1).await;

        let repo = Arc::new(SqliteUserRepository::new(pool.clone()));
        let auth = AuthService::new(repo, pool.clone());

        let result = auth.login("testuser", "password123").await;
        assert!(result.is_ok());
        let (token, user) = result.unwrap();
        assert!(!token.is_empty());
        assert_eq!(user.usuario, "testuser");
        assert_eq!(user.rol_id, 1);
        assert_eq!(user.rol_nombre, "Admin");
        assert!(user.activo);
    }

    #[tokio::test]
    async fn test_login_wrong_password() {
        let pool = setup_test_pool().await;
        let hash = crate::security::hash_password("password123").unwrap();
        create_test_user(&pool, &hash, 1).await;

        let repo = Arc::new(SqliteUserRepository::new(pool.clone()));
        let auth = AuthService::new(repo, pool.clone());

        let result = auth.login("testuser", "wrongpassword").await;
        assert!(result.is_err());
        match result.unwrap_err() {
            AppError::Unauthorized(msg) => {
                assert_eq!(msg, "Usuario o contraseña incorrectos");
            }
            _ => panic!("Expected Unauthorized error"),
        }
    }

    #[tokio::test]
    async fn test_login_nonexistent_user() {
        let pool = setup_test_pool().await;
        let repo = Arc::new(SqliteUserRepository::new(pool.clone()));
        let auth = AuthService::new(repo, pool.clone());

        let result = auth.login("nonexistent", "password123").await;
        assert!(result.is_err());
        match result.unwrap_err() {
            AppError::Unauthorized(msg) => {
                assert_eq!(msg, "Usuario o contraseña incorrectos");
            }
            _ => panic!("Expected Unauthorized error"),
        }
    }

    #[tokio::test]
    async fn test_require_role_allowed() {
        let pool = setup_test_pool().await;
        let hash = crate::security::hash_password("password123").unwrap();
        create_test_user(&pool, &hash, 1).await;

        let repo = Arc::new(SqliteUserRepository::new(pool.clone()));
        let auth = Arc::new(AuthService::new(repo, pool.clone()));

        let (token, _) = auth.login("testuser", "password123").await.unwrap();

        let result = auth.require_role(&token, &[1, 3]).await;
        assert!(result.is_ok());
        let user = result.unwrap();
        assert_eq!(user.usuario, "testuser");
    }

    #[tokio::test]
    async fn test_require_role_denied() {
        let pool = setup_test_pool().await;
        // Create a user with rol_id=4 (Consulta)
        let hash = crate::security::hash_password("password123").unwrap();
        create_test_user(&pool, &hash, 4).await;

        let repo = Arc::new(SqliteUserRepository::new(pool.clone()));
        let auth = Arc::new(AuthService::new(repo, pool.clone()));

        let (token, _) = auth.login("testuser", "password123").await.unwrap();

        // CLINICAL_ROLES = [1, 3] — user 4 (Consulta) should be denied
        let result = auth.require_role(&token, CLINICAL_ROLES).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_logout_invalidates() {
        let pool = setup_test_pool().await;
        let hash = crate::security::hash_password("password123").unwrap();
        create_test_user(&pool, &hash, 1).await;

        let repo = Arc::new(SqliteUserRepository::new(pool.clone()));
        let auth = Arc::new(AuthService::new(repo, pool.clone()));

        let (token, _) = auth.login("testuser", "password123").await.unwrap();

        // Logout
        auth.logout(&token).await.unwrap();

        // Token should now be invalid
        let result = auth.validate_token(&token).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_change_password() {
        let pool = setup_test_pool().await;
        let hash = crate::security::hash_password("oldpassword").unwrap();
        let user_id = create_test_user(&pool, &hash, 1).await;

        let repo = Arc::new(SqliteUserRepository::new(pool.clone()));
        let auth = AuthService::new(repo.clone(), pool.clone());

        // Change password
        auth.change_password(user_id, "oldpassword", "newpassword123")
            .await
            .unwrap();

        // Verify old password no longer works
        let user = repo.find_by_id(user_id).await.unwrap().unwrap();
        let old_valid = crate::security::verify_password("oldpassword", &user.password_hash).unwrap();
        assert!(!old_valid);

        // Verify new password works
        let new_valid = crate::security::verify_password("newpassword123", &user.password_hash).unwrap();
        assert!(new_valid);
    }

    #[tokio::test]
    async fn test_change_password_wrong_old() {
        let pool = setup_test_pool().await;
        let hash = crate::security::hash_password("oldpassword").unwrap();
        let user_id = create_test_user(&pool, &hash, 1).await;

        let repo = Arc::new(SqliteUserRepository::new(pool.clone()));
        let auth = AuthService::new(repo, pool.clone());

        let result = auth.change_password(user_id, "wrongold", "newpassword123").await;
        assert!(result.is_err());
        match result.unwrap_err() {
            AppError::Unauthorized(msg) => {
                assert_eq!(msg, "La contraseña actual no es correcta");
            }
            _ => panic!("Expected Unauthorized error"),
        }
    }
}
