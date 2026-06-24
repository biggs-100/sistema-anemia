use crate::dto::{ApiResponse, CentroPobladoResponse};
use crate::errors::AppError;
use crate::repositories::centro_poblado_repository::CentroPobladoRepository;

/// Centro poblado service — thin wrapper calling the repository.
pub struct CentroPobladoService {
    repo: Box<dyn CentroPobladoRepository>,
}

impl CentroPobladoService {
    pub fn new(repo: Box<dyn CentroPobladoRepository>) -> Self {
        Self { repo }
    }

    /// Returns all active centros poblados as DTOs.
    pub async fn list_all(&self) -> Result<ApiResponse<Vec<CentroPobladoResponse>>, AppError> {
        let centros = self.repo.list_all().await?;
        let response = centros
            .into_iter()
            .map(|c| CentroPobladoResponse {
                id: c.id,
                nombre: c.nombre,
                distrito: c.distrito.unwrap_or_default(),
                provincia: c.provincia.unwrap_or_default(),
                departamento: c.departamento.unwrap_or_default(),
            })
            .collect();
        Ok(ApiResponse::success(response))
    }
}
