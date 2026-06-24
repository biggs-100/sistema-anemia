use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri::Manager;
use tauri::State;

use crate::dto::ApiResponse;
use crate::services::auth_service::ALL_ROLES;
use crate::AppState;

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DashboardStats {
    pub total_pacientes: i64,
    pub controles_mes: i64,
    pub tratamientos_activos: i64,
    pub alertas_pendientes: i64,
    pub casos_severos: i64,
    pub distribucion_hb: Vec<HbDistribucion>,
    pub evolucion_mensual: Vec<EvolucionMensual>,
    pub alertas_recientes: Vec<AlertaResumen>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HbDistribucion {
    pub clasificacion: String,
    pub cantidad: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EvolucionMensual {
    pub mes: String,
    pub promedio_hb: f64,
    pub total_controles: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AlertaResumen {
    pub id: i64,
    pub paciente_id: i64,
    pub tipo: String,
    pub descripcion: String,
    pub fecha: String,
}

// ---------------------------------------------------------------------------
// Row mappers for sqlx query results
// ---------------------------------------------------------------------------

#[derive(sqlx::FromRow)]
struct HbDistribucionRow {
    clasificacion: String,
    cantidad: i64,
}

#[derive(sqlx::FromRow)]
struct EvolucionMensualRow {
    mes: String,
    promedio_hb: f64,
    total_controles: i64,
}

#[derive(sqlx::FromRow)]
struct AlertaResumenRow {
    id: i64,
    paciente_id: i64,
    tipo: String,
    descripcion: String,
    fecha: String,
}

// ---------------------------------------------------------------------------
// Command
// ---------------------------------------------------------------------------

#[tauri::command]
pub async fn get_dashboard_stats(
    app: AppHandle,
    token: String,
) -> Result<ApiResponse<DashboardStats>, String> {
    let state: State<AppState> = app.state();

    // All authenticated users can see the dashboard
    let _user = state
        .auth_service
        .require_role(&token, ALL_ROLES)
        .await
        .map_err(|e| e.to_string())?;

    let pool = &state.pool;

    // Run independent queries in parallel
    let (total_pacientes, controles_mes, tratamientos_activos, alertas_pendientes, casos_severos) = tokio::join!(
        sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM patients WHERE activo = 1")
            .fetch_one(pool),
        sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM controles \
             WHERE strftime('%Y-%m', fecha_control) = strftime('%Y-%m', 'now')"
        )
        .fetch_one(pool),
        sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM tratamientos WHERE estado = 'activo'"
        )
        .fetch_one(pool),
        sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM alertas WHERE resuelta = 0"
        )
        .fetch_one(pool),
        sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(DISTINCT paciente_id) FROM controles \
             WHERE hemoglobina < 7.0 AND fecha_control >= date('now', '-3 months')"
        )
        .fetch_one(pool),
    );

    let total_pacientes = total_pacientes.map_err(|e| e.to_string())?;
    let controles_mes = controles_mes.map_err(|e| e.to_string())?;
    let tratamientos_activos = tratamientos_activos.map_err(|e| e.to_string())?;
    let alertas_pendientes = alertas_pendientes.map_err(|e| e.to_string())?;
    let casos_severos = casos_severos.map_err(|e| e.to_string())?;

    // Run the three remaining queries in parallel
    let (distribucion_hb, evolucion_mensual, alertas_recientes) = tokio::join!(
        sqlx::query_as::<_, HbDistribucionRow>(
            "SELECT \
                CASE \
                    WHEN hemoglobina >= 11.0 THEN 'normal' \
                    WHEN hemoglobina >= 10.0 THEN 'leve' \
                    WHEN hemoglobina >= 7.0 THEN 'moderada' \
                    ELSE 'severa' \
                END as clasificacion, \
                COUNT(*) as cantidad \
             FROM controles \
             WHERE fecha_control >= date('now', '-6 months') \
             GROUP BY clasificacion \
             ORDER BY clasificacion"
        )
        .fetch_all(pool),
        sqlx::query_as::<_, EvolucionMensualRow>(
            "SELECT \
                strftime('%Y-%m', fecha_control) as mes, \
                ROUND(AVG(hemoglobina), 2) as promedio_hb, \
                COUNT(*) as total_controles \
             FROM controles \
             WHERE fecha_control >= date('now', '-12 months') \
             GROUP BY mes \
             ORDER BY mes"
        )
        .fetch_all(pool),
        sqlx::query_as::<_, AlertaResumenRow>(
            "SELECT id, paciente_id, tipo, descripcion, fecha_generada as fecha \
             FROM alertas \
             WHERE resuelta = 0 \
             ORDER BY fecha_generada DESC \
             LIMIT 5"
        )
        .fetch_all(pool),
    );

    let distribucion_hb = distribucion_hb.map_err(|e| e.to_string())?;
    let evolucion_mensual = evolucion_mensual.map_err(|e| e.to_string())?;
    let alertas_recientes = alertas_recientes.map_err(|e| e.to_string())?;

    let stats = DashboardStats {
        total_pacientes,
        controles_mes,
        tratamientos_activos,
        alertas_pendientes,
        casos_severos,
        distribucion_hb: distribucion_hb
            .into_iter()
            .map(|r| HbDistribucion {
                clasificacion: r.clasificacion,
                cantidad: r.cantidad,
            })
            .collect(),
        evolucion_mensual: evolucion_mensual
            .into_iter()
            .map(|r| EvolucionMensual {
                mes: r.mes,
                promedio_hb: r.promedio_hb,
                total_controles: r.total_controles,
            })
            .collect(),
        alertas_recientes: alertas_recientes
            .into_iter()
            .map(|r| AlertaResumen {
                id: r.id,
                paciente_id: r.paciente_id,
                tipo: r.tipo,
                descripcion: r.descripcion,
                fecha: r.fecha,
            })
            .collect(),
    };

    Ok(ApiResponse::success(stats))
}
