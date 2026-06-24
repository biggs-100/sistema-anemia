use crate::errors::AppError;
use chrono::Local;
use sqlx::SqlitePool;
use std::path::PathBuf;

/// Report service for PDF, Excel, and CSV report generation.
///
/// All generated files are written to the configured `exports_dir`.
pub struct ReportService {
    pool: SqlitePool,
    exports_dir: PathBuf,
}

impl ReportService {
    pub fn new(pool: SqlitePool, exports_dir: PathBuf) -> Self {
        Self { pool, exports_dir }
    }

    /// Generates a PDF report for a specific patient's clinical history.
    ///
    /// Includes patient details and the last 20 controls in a table layout.
    /// Returns the file path to the generated PDF.
    pub async fn generate_pdf(&self, paciente_id: i64) -> Result<String, AppError> {
        use printpdf::*;

        // Ensure exports dir exists
        std::fs::create_dir_all(&self.exports_dir)
            .map_err(|e| AppError::Internal(format!("Failed to create exports dir: {e}")))?;

        // Query patient data
        let paciente = sqlx::query_as::<_, (String, String, String, String, String)>(
            "SELECT p.nombres || ' ' || p.apellido_paterno || ' ' || p.apellido_materno, \
                    p.historia_clinica, p.dni, p.fecha_nacimiento, p.sexo \
             FROM patients p WHERE p.id = ?1 AND p.activo = 1",
        )
        .bind(paciente_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?
        .ok_or_else(|| AppError::NotFound("Patient not found".into()))?;

        // Query controls
        let controles = sqlx::query_as::<_, (String, f64, f64, f64, Option<f64>, Option<String>)>(
            "SELECT c.fecha_control, c.peso, c.talla, c.hemoglobina, c.temperatura, c.observaciones \
             FROM controles c WHERE c.paciente_id = ?1 ORDER BY c.fecha_control DESC LIMIT 20",
        )
        .bind(paciente_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

        // Build PDF
        let (doc, page1, layer1) = PdfDocument::new(
            &format!("Ficha Clínica - {}", paciente.0),
            Mm(210.0),
            Mm(297.0),
            "Layer 1",
        );

        let font = doc.add_builtin_font(BuiltinFont::Helvetica).unwrap();
        let font_bold = doc.add_builtin_font(BuiltinFont::HelveticaBold).unwrap();

        let current_layer = doc.get_page(page1).get_layer(layer1);

        // Title
        current_layer.use_text(
            "Sistema de Seguimiento de Anemia",
            16.0,
            Mm(20.0),
            Mm(275.0),
            &font_bold,
        );
        current_layer.use_text(
            "Ficha de Seguimiento del Paciente",
            12.0,
            Mm(20.0),
            Mm(265.0),
            &font,
        );

        // Patient info
        current_layer.use_text(
            &format!("Paciente: {}", paciente.0),
            10.0,
            Mm(20.0),
            Mm(250.0),
            &font,
        );
        current_layer.use_text(
            &format!("HC: {}  |  DNI: {}", paciente.1, paciente.2),
            10.0,
            Mm(20.0),
            Mm(242.0),
            &font,
        );
        current_layer.use_text(
            &format!(
                "Fecha Nac.: {}  |  Sexo: {}",
                paciente.3,
                if paciente.4 == "M" {
                    "Masculino"
                } else {
                    "Femenino"
                }
            ),
            10.0,
            Mm(20.0),
            Mm(234.0),
            &font,
        );

        // Controls table header
        current_layer.use_text("Últimos Controles:", 11.0, Mm(20.0), Mm(222.0), &font_bold);
        let headers = ["Fecha", "Peso(kg)", "Talla(cm)", "Hb(g/dL)", "Clasificación", "T°C"];
        let col_widths = [35.0, 25.0, 25.0, 30.0, 35.0, 20.0];
        let mut x = 20.0;
        let y_start = 210.0;
        for (i, header) in headers.iter().enumerate() {
            current_layer.use_text(*header, 8.0, Mm(x), Mm(y_start), &font_bold);
            x += col_widths[i];
        }

        // Controls rows
        let mut y = y_start - 7.0;
        for (fecha, peso, talla, hb, temp, _obs) in &controles {
            if y < 30.0 {
                break;
            } // Page margin
            let clasif = if *hb >= 11.0 {
                "Normal"
            } else if *hb >= 10.0 {
                "Leve"
            } else if *hb >= 7.0 {
                "Moderada"
            } else {
                "Severa"
            };
            let mut x = 20.0;
            let row_data = [
                fecha.as_str(),
                &format!("{:.1}", peso),
                &format!("{:.1}", talla),
                &format!("{:.1}", hb),
                clasif,
                &temp.map(|t| format!("{:.1}", t)).unwrap_or_else(|| "-".into()),
            ];
            for (j, data) in row_data.iter().enumerate() {
                current_layer.use_text(*data, 7.0, Mm(x), Mm(y), &font);
                x += col_widths[j];
            }
            y -= 6.0;
        }

        // Footer
        let now = Local::now().format("%d/%m/%Y %H:%M").to_string();
        current_layer.use_text(&format!("Generado: {now}"), 8.0, Mm(20.0), Mm(15.0), &font);

        // Save
        let filename = format!(
            "ficha_paciente_{}_{}.pdf",
            paciente_id,
            Local::now().format("%Y%m%d_%H%M%S")
        );
        let filepath = self.exports_dir.join(&filename);
        let file = std::fs::File::create(&filepath)
            .map_err(|e| AppError::Internal(format!("Failed to create PDF file: {e}")))?;
        doc.save(&mut std::io::BufWriter::new(file))
            .map_err(|e| AppError::Internal(format!("Failed to save PDF: {e}")))?;

        Ok(filepath.to_string_lossy().to_string())
    }

    /// Generates an Excel report for controls in a date range.
    ///
    /// Returns the file path to the generated XLSX file.
    pub async fn generate_excel(&self, fecha_inicio: &str, fecha_fin: &str) -> Result<String, AppError> {
        use rust_xlsxwriter::*;

        std::fs::create_dir_all(&self.exports_dir)
            .map_err(|e| AppError::Internal(e.to_string()))?;

        let rows = sqlx::query_as::<_, (String, String, String, f64, f64, f64, Option<String>, String)>(
            "SELECT c.fecha_control, p.nombres || ' ' || p.apellido_paterno as paciente, \
                    p.dni, c.peso, c.talla, c.hemoglobina, c.observaciones, \
                    CASE WHEN c.hemoglobina >= 11.0 THEN 'Normal' \
                         WHEN c.hemoglobina >= 10.0 THEN 'Leve' \
                         WHEN c.hemoglobina >= 7.0 THEN 'Moderada' \
                         ELSE 'Severa' END as clasificacion \
             FROM controles c JOIN patients p ON p.id = c.paciente_id \
             WHERE c.fecha_control >= ?1 AND c.fecha_control <= ?2 \
             ORDER BY c.fecha_control",
        )
        .bind(fecha_inicio)
        .bind(fecha_fin)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

        let mut workbook = Workbook::new();
        let sheet = workbook.add_worksheet();
        sheet.set_name("Controles")?;

        let header_format = Format::new()
            .set_bold()
            .set_background_color(Color::RGB(0x2563EB))
            .set_font_color(Color::White);

        let headers = [
            "Fecha",
            "Paciente",
            "DNI",
            "Peso (kg)",
            "Talla (cm)",
            "Hb (g/dL)",
            "Clasificación",
            "Observaciones",
        ];
        for (col, h) in headers.iter().enumerate() {
            sheet.write_string_with_format(0, col as u16, *h, &header_format)?;
        }
        sheet.set_column_width(0, 12)?;
        sheet.set_column_width(1, 30)?;
        sheet.set_column_width(2, 10)?;
        sheet.set_column_width(3, 10)?;
        sheet.set_column_width(4, 10)?;
        sheet.set_column_width(5, 10)?;
        sheet.set_column_width(6, 15)?;
        sheet.set_column_width(7, 30)?;

        for (row, (fecha, paciente, dni, peso, talla, hb, obs, clasif)) in rows.iter().enumerate() {
            let r = (row + 1) as u32;
            sheet.write_string(r, 0, fecha.as_str())?;
            sheet.write_string(r, 1, paciente.as_str())?;
            sheet.write_string(r, 2, dni.as_str())?;
            sheet.write_number(r, 3, *peso)?;
            sheet.write_number(r, 4, *talla)?;
            sheet.write_number(r, 5, *hb)?;
            sheet.write_string(r, 6, clasif.as_str())?;
            sheet.write_string(r, 7, obs.as_deref().unwrap_or(""))?;
        }

        let filename = format!(
            "reporte_controles_{}_{}.xlsx",
            fecha_inicio.replace('-', ""),
            fecha_fin.replace('-', "")
        );
        let filepath = self.exports_dir.join(&filename);

        workbook
            .save(&filepath)
            .map_err(|e| AppError::Internal(format!("Failed to save Excel: {e}")))?;

        Ok(filepath.to_string_lossy().to_string())
    }

    /// Generates a CSV report for either `"pacientes"` or `"controles"`.
    ///
    /// Returns the file path to the generated CSV file.
    pub async fn generate_csv(&self, tipo: &str) -> Result<String, AppError> {
        use csv::Writer;

        std::fs::create_dir_all(&self.exports_dir)
            .map_err(|e| AppError::Internal(e.to_string()))?;

        let filename = format!("reporte_{}_{}.csv", tipo, Local::now().format("%Y%m%d_%H%M%S"));
        let filepath = self.exports_dir.join(&filename);

        let mut wtr = Writer::from_path(&filepath)
            .map_err(|e| AppError::Internal(e.to_string()))?;

        match tipo {
            "pacientes" => {
                wtr.write_record([
                    "HC",
                    "DNI",
                    "Nombres",
                    "Apellidos",
                    "Sexo",
                    "Centro Poblado",
                ])
                .map_err(|e| AppError::Internal(e.to_string()))?;

                let rows = sqlx::query_as::<_, (String, String, String, String, String, Option<String>)>(
                    "SELECT p.historia_clinica, p.dni, p.nombres, \
                            p.apellido_paterno || ' ' || p.apellido_materno, \
                            CASE WHEN p.sexo='M' THEN 'Masculino' ELSE 'Femenino' END, \
                            cp.nombre \
                     FROM patients p \
                     LEFT JOIN centros_poblados cp ON cp.id = p.centro_poblado_id \
                     WHERE p.activo = 1",
                )
                .fetch_all(&self.pool)
                .await
                .map_err(|e| AppError::Database(e.to_string()))?;

                for row in &rows {
                    wtr.write_record([
                        row.0.as_str(),
                        row.1.as_str(),
                        row.2.as_str(),
                        row.3.as_str(),
                        row.4.as_str(),
                        row.5.as_deref().unwrap_or(""),
                    ])
                    .map_err(|e| AppError::Internal(e.to_string()))?;
                }
            }
            "controles" => {
                wtr.write_record([
                    "Fecha",
                    "Paciente",
                    "DNI",
                    "Peso",
                    "Talla",
                    "Hb",
                    "Clasificacion",
                ])
                .map_err(|e| AppError::Internal(e.to_string()))?;

                let rows = sqlx::query_as::<_, (String, String, String, f64, f64, f64, String)>(
                    "SELECT c.fecha_control, p.nombres || ' ' || p.apellido_paterno, p.dni, \
                            c.peso, c.talla, c.hemoglobina, \
                            CASE WHEN c.hemoglobina >= 11.0 THEN 'Normal' \
                                 WHEN c.hemoglobina >= 10.0 THEN 'Leve' \
                                 WHEN c.hemoglobina >= 7.0 THEN 'Moderada' \
                                 ELSE 'Severa' END \
                     FROM controles c JOIN patients p ON p.id = c.paciente_id \
                     ORDER BY c.fecha_control DESC",
                )
                .fetch_all(&self.pool)
                .await
                .map_err(|e| AppError::Database(e.to_string()))?;

                for row in &rows {
                    let peso = row.3.to_string();
                    let talla = row.4.to_string();
                    let hb = row.5.to_string();
                    wtr.write_record([
                        row.0.as_str(),
                        row.1.as_str(),
                        row.2.as_str(),
                        peso.as_str(),
                        talla.as_str(),
                        hb.as_str(),
                        row.6.as_str(),
                    ])
                    .map_err(|e| AppError::Internal(e.to_string()))?;
                }
            }
            _ => return Err(AppError::Internal(format!("Unknown report type: {tipo}"))),
        }

        wtr.flush()
            .map_err(|e| AppError::Internal(e.to_string()))?;

        Ok(filepath.to_string_lossy().to_string())
    }
}
