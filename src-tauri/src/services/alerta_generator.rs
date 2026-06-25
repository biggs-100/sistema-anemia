use sqlx::SqlitePool;

/// Runs all alert generators.
pub async fn run_all(pool: &SqlitePool) {
    tracing::info!("Running alert generators...");

    match generar_alertas_control_vencido(pool).await {
        Ok(count) => {
            if count > 0 {
                tracing::info!("Generated {count} CONTROL_VENCIDO alert(s)");
            }
        }
        Err(e) => tracing::error!("Error generating CONTROL_VENCIDO alerts: {e}"),
    }

    match generar_alertas_tratamiento_vencido(pool).await {
        Ok(count) => {
            if count > 0 {
                tracing::info!("Generated {count} TRATAMIENTO_VENCIDO alert(s)");
            }
        }
        Err(e) => tracing::error!("Error generating TRATAMIENTO_VENCIDO alerts: {e}"),
    }
}

/// Generates CONTROL_VENCIDO alerts for patients whose last control was >30 days ago
/// and who don't already have an unresolved alert of this type.
async fn generar_alertas_control_vencido(pool: &SqlitePool) -> Result<i64, sqlx::Error> {
    let rows = sqlx::query_as::<_, (i64, String, String)>(
        "SELECT p.id, p.nombres, p.apellido_paterno \
         FROM pacientes p \
         WHERE p.activo = 1 \
           AND (\
             SELECT MAX(c.fecha_control) FROM controles c WHERE c.paciente_id = p.id\
           ) < date('now', '-30 days') \
           AND NOT EXISTS (\
             SELECT 1 FROM alertas a \
             WHERE a.paciente_id = p.id AND a.tipo = 'CONTROL_VENCIDO' AND a.resuelta = 0\
           )",
    )
    .fetch_all(pool)
    .await?;

    let mut count = 0i64;
    for (paciente_id, nombres, apellido) in rows {
        let descripcion = format!(
            "{} {} — Control vencido (último control hace más de 30 días)",
            nombres, apellido,
        );
        let result = sqlx::query(
            "INSERT INTO alertas (paciente_id, tipo, descripcion, fecha_generada, resuelta) \
             VALUES (?1, 'CONTROL_VENCIDO', ?2, datetime('now'), 0)",
        )
        .bind(paciente_id)
        .bind(&descripcion)
        .execute(pool)
        .await;

        match result {
            Ok(_) => count += 1,
            Err(e) => tracing::error!(
                "Failed to insert CONTROL_VENCIDO alert for patient {paciente_id}: {e}"
            ),
        }
    }

    Ok(count)
}

/// Generates TRATAMIENTO_VENCIDO alerts for treatments past their end date
/// that haven't been finalized and don't have an unresolved alert.
async fn generar_alertas_tratamiento_vencido(pool: &SqlitePool) -> Result<i64, sqlx::Error> {
    let rows = sqlx::query_as::<_, (i64, i64, String)>(
        "SELECT t.id, t.paciente_id, p.nombres \
         FROM tratamientos t \
         JOIN pacientes p ON p.id = t.paciente_id \
         WHERE t.fecha_fin < date('now') AND t.estado != 'finalizado' \
           AND NOT EXISTS (\
             SELECT 1 FROM alertas a \
             WHERE a.paciente_id = t.paciente_id AND a.tipo = 'TRATAMIENTO_VENCIDO' AND a.resuelta = 0\
           )",
    )
    .fetch_all(pool)
    .await?;

    let mut count = 0i64;
    for (_treatment_id, paciente_id, nombres) in rows {
        let descripcion = format!(
            "{} — Tratamiento vencido (fecha de fin ha pasado)",
            nombres,
        );
        let result = sqlx::query(
            "INSERT INTO alertas (paciente_id, tipo, descripcion, fecha_generada, resuelta) \
             VALUES (?1, 'TRATAMIENTO_VENCIDO', ?2, datetime('now'), 0)",
        )
        .bind(paciente_id)
        .bind(&descripcion)
        .execute(pool)
        .await;

        match result {
            Ok(_) => count += 1,
            Err(e) => tracing::error!(
                "Failed to insert TRATAMIENTO_VENCIDO alert for patient {paciente_id}: {e}"
            ),
        }
    }

    Ok(count)
}
