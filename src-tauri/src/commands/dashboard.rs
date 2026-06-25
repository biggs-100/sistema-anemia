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
    // Advanced stats (Batch 2)
    pub tasa_recuperacion: f64,
    pub tratamiento_mas_efectivo: Option<TratamientoEfectivo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TratamientoEfectivo {
    pub nombre: String,
    pub total: i64,
    pub tasa_exito: f64,
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
    // Advanced stats
    let tasa_recuperacion: f64 = sqlx::query_scalar(
        "SELECT ROUND(
            CAST(COUNT(DISTINCT CASE WHEN c.hemoglobina >= 11.0 THEN c.paciente_id END) AS REAL) * 100.0 /
            NULLIF(COUNT(DISTINCT c.paciente_id), 0), 1
         )
         FROM controles c
         WHERE c.fecha_control >= date('now', '-6 months')"
    )
    .fetch_one(pool)
    .await
    .map_err(|e| e.to_string())?;

    #[derive(sqlx::FromRow)]
    struct TratamientoRow {
        nombre: String,
        total: i64,
        tasa_exito: f64,
    }

    let tratamiento_row: Option<TratamientoRow> = sqlx::query_as::<_, TratamientoRow>(
        "SELECT m.nombre, COUNT(*) as total,
            ROUND(AVG(CASE WHEN c.hemoglobina >= 11.0 THEN 1.0 ELSE 0.0 END) * 100.0, 1) as tasa_exito
         FROM tratamientos t
         JOIN medicamentos m ON m.id = t.medicamento_id
         JOIN controles c ON c.paciente_id = t.paciente_id AND c.fecha_control > t.fecha_inicio
         WHERE t.estado = 'activo'
         GROUP BY m.id
         ORDER BY tasa_exito DESC
         LIMIT 1"
    )
    .fetch_optional(pool)
    .await
    .map_err(|e| e.to_string())?;

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
        tasa_recuperacion,
        tratamiento_mas_efectivo: tratamiento_row.map(|r| TratamientoEfectivo {
            nombre: r.nombre,
            total: r.total,
            tasa_exito: r.tasa_exito,
        }),
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

#[cfg(test)]
mod tests {
    use sqlx::SqlitePool;

    async fn setup_test_pool() -> SqlitePool {
        let pool = SqlitePool::connect("sqlite::memory:").await.unwrap();

        sqlx::query(
            "CREATE TABLE IF NOT EXISTS centros_poblados (
                id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT NOT NULL, activo INTEGER NOT NULL DEFAULT 1
            )",
        )
        .execute(&pool)
        .await
        .unwrap();

        sqlx::query(
            "CREATE TABLE IF NOT EXISTS patients (
                id INTEGER PRIMARY KEY AUTOINCREMENT, historia_clinica TEXT NOT NULL,
                dni TEXT NOT NULL, nombres TEXT NOT NULL, apellido_paterno TEXT NOT NULL,
                apellido_materno TEXT NOT NULL, fecha_nacimiento TEXT NOT NULL,
                sexo TEXT NOT NULL, activo INTEGER NOT NULL DEFAULT 1
            )",
        )
        .execute(&pool)
        .await
        .unwrap();

        sqlx::query(
            "CREATE TABLE IF NOT EXISTS controles (
                id INTEGER PRIMARY KEY AUTOINCREMENT, paciente_id INTEGER NOT NULL,
                fecha_control TEXT NOT NULL, edad_meses INTEGER, peso REAL, talla REAL,
                hemoglobina REAL, observaciones TEXT
            )",
        )
        .execute(&pool)
        .await
        .unwrap();

        sqlx::query(
            "CREATE TABLE IF NOT EXISTS tratamientos (
                id INTEGER PRIMARY KEY AUTOINCREMENT, paciente_id INTEGER NOT NULL,
                medicamento_id INTEGER NOT NULL, dosis TEXT, frecuencia TEXT,
                fecha_inicio TEXT NOT NULL, estado TEXT NOT NULL DEFAULT 'activo'
            )",
        )
        .execute(&pool)
        .await
        .unwrap();

        sqlx::query(
            "CREATE TABLE IF NOT EXISTS alertas (
                id INTEGER PRIMARY KEY AUTOINCREMENT, paciente_id INTEGER NOT NULL,
                tipo TEXT NOT NULL, descripcion TEXT, resuelta INTEGER NOT NULL DEFAULT 0
            )",
        )
        .execute(&pool)
        .await
        .unwrap();

        pool
    }

    #[tokio::test]
    async fn test_dashboard_queries_return_non_negative() {
        let pool = setup_test_pool().await;

        // Insert test data
        sqlx::query(
            "INSERT INTO patients (historia_clinica, dni, nombres, apellido_paterno, \
             apellido_materno, fecha_nacimiento, sexo, activo) \
             VALUES ('HC-D-01', '00000001', 'Dash', 'Board', 'Test', '2010-01-01', 'F', 1)",
        )
        .execute(&pool)
        .await
        .unwrap();

        sqlx::query(
            "INSERT INTO controles (paciente_id, fecha_control, hemoglobina) \
             VALUES (1, strftime('%Y-%m-%d', 'now'), 10.5)",
        )
        .execute(&pool)
        .await
        .unwrap();

        sqlx::query(
            "INSERT INTO tratamientos (paciente_id, medicamento_id, fecha_inicio, estado) \
             VALUES (1, 1, '2025-01-01', 'activo')",
        )
        .execute(&pool)
        .await
        .unwrap();

        sqlx::query(
            "INSERT INTO alertas (paciente_id, tipo, descripcion, resuelta) \
             VALUES (1, 'TEST', 'pending alert', 0)",
        )
        .execute(&pool)
        .await
        .unwrap();

        // Run the same query patterns as the dashboard command
        let total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM patients WHERE activo = 1")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert!(total >= 0, "total_pacientes should be non-negative");

        let controles_mes: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM controles \
             WHERE strftime('%Y-%m', fecha_control) = strftime('%Y-%m', 'now')",
        )
        .fetch_one(&pool)
        .await
        .unwrap();
        assert!(controles_mes >= 0, "controles_mes should be non-negative");

        let tratamientos_activos: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM tratamientos WHERE estado = 'activo'",
        )
        .fetch_one(&pool)
        .await
        .unwrap();
        assert!(
            tratamientos_activos >= 0,
            "tratamientos_activos should be non-negative"
        );

        let alertas_pendientes: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM alertas WHERE resuelta = 0",
        )
        .fetch_one(&pool)
        .await
        .unwrap();
        assert!(
            alertas_pendientes >= 0,
            "alertas_pendientes should be non-negative"
        );

        let casos_severos: i64 = sqlx::query_scalar(
            "SELECT COUNT(DISTINCT paciente_id) FROM controles \
             WHERE hemoglobina < 7.0 AND fecha_control >= date('now', '-3 months')",
        )
        .fetch_one(&pool)
        .await
        .unwrap();
        assert!(casos_severos >= 0, "casos_severos should be non-negative");

        // Verify with actual data returns expected values
        assert_eq!(total, 1, "Should have 1 active patient");
        assert_eq!(controles_mes, 1, "Should have 1 control this month");
        assert_eq!(tratamientos_activos, 1, "Should have 1 active treatment");
        assert_eq!(alertas_pendientes, 1, "Should have 1 pending alert");
        assert_eq!(casos_severos, 0, "Should have 0 severe cases (hb=10.5)");
    }

    #[tokio::test]
    async fn test_dashboard_queries_empty_db() {
        let pool = setup_test_pool().await;

        // Empty database should return 0 for all counts, not errors
        let total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM patients WHERE activo = 1")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(total, 0);

        let controles_mes: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM controles \
             WHERE strftime('%Y-%m', fecha_control) = strftime('%Y-%m', 'now')",
        )
        .fetch_one(&pool)
        .await
        .unwrap();
        assert_eq!(controles_mes, 0);

        let alertas_pendientes: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM alertas WHERE resuelta = 0",
        )
        .fetch_one(&pool)
        .await
        .unwrap();
        assert_eq!(alertas_pendientes, 0);
    }
}
