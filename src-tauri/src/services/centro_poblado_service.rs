use crate::dto::{ApiResponse, CentroPobladoResponse, CreateCentroPobladoDTO};
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

    fn to_response(&self, c: crate::models::CentroPoblado) -> CentroPobladoResponse {
        CentroPobladoResponse {
            id: c.id,
            nombre: c.nombre,
            distrito: c.distrito.unwrap_or_default(),
            provincia: c.provincia.unwrap_or_default(),
            departamento: c.departamento.unwrap_or_default(),
        }
    }

    /// Returns all active centros poblados as DTOs.
    pub async fn list_all(&self) -> Result<ApiResponse<Vec<CentroPobladoResponse>>, AppError> {
        let centros = self.repo.list_all().await?;
        let response = centros.into_iter().map(|c| self.to_response(c)).collect();
        Ok(ApiResponse::success(response))
    }

    /// Creates a new centro poblado (admin only).
    pub async fn create(
        &self,
        dto: &CreateCentroPobladoDTO,
    ) -> Result<ApiResponse<CentroPobladoResponse>, AppError> {
        let centro = self.repo.create(dto).await?;
        Ok(ApiResponse::success(self.to_response(centro)))
    }

    /// Updates an existing centro poblado (admin only).
    pub async fn update(
        &self,
        id: i64,
        dto: &CreateCentroPobladoDTO,
    ) -> Result<ApiResponse<CentroPobladoResponse>, AppError> {
        let centro = self.repo.update(id, dto).await?;
        Ok(ApiResponse::success(self.to_response(centro)))
    }

    /// Soft-deletes a centro poblado (admin only).
    pub async fn delete(&self, id: i64) -> Result<ApiResponse<()>, AppError> {
        self.repo.delete(id).await?;
        Ok(ApiResponse::success(()))
    }
}
