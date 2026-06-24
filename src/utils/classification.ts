import { ANEMIA_THRESHOLDS } from "./constants";

export type HemoglobinaLevel = "normal" | "leve" | "moderada" | "severa";

/**
 * Classifies hemoglobin value according to anemia severity thresholds.
 *
 * Thresholds (g/dL):
 * - Normal: >= 11.0
 * - Leve (Mild): 10.0 – 10.9
 * - Moderada (Moderate): 7.0 – 9.9
 * - Severa (Severe): < 7.0
 */
export function classifyHemoglobina(value: number): HemoglobinaLevel {
  if (value >= ANEMIA_THRESHOLDS.NORMAL_MIN) return "normal";
  if (value >= ANEMIA_THRESHOLDS.LEVE_MIN) return "leve";
  if (value >= ANEMIA_THRESHOLDS.MODERADA_MIN) return "moderada";
  return "severa";
}

/**
 * Returns a TailwindCSS badge color class for a given hemoglobin classification.
 */
export function getColorForClassification(level: HemoglobinaLevel): string {
  switch (level) {
    case "normal":
      return "bg-green-100 text-green-800";
    case "leve":
      return "bg-yellow-100 text-yellow-800";
    case "moderada":
      return "bg-orange-100 text-orange-800";
    case "severa":
      return "bg-red-100 text-red-800";
  }
}

/**
 * Returns a human-readable label for the classification.
 */
export function getLabelForClassification(level: HemoglobinaLevel): string {
  switch (level) {
    case "normal":
      return "Normal";
    case "leve":
      return "Leve";
    case "moderada":
      return "Moderada";
    case "severa":
      return "Severa";
  }
}
