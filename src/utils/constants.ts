// src/utils/constants.ts

export const LISTA_COMERCIALES = ["Marcos", "Alfonso", "Jesus", "Maria Jesús"];

export const LISTA_ESTADOS = ["Por hacer", "Imprimiendo", "Manipulado", "Terminado", "Urgente"];

export const LISTA_AREAS = ["Digital", "Offset", "Plotter", "OPX", "DTF", "Mimaki"];

/**
 * Estilos de badge para cada estado. Fuente única de verdad para toda la app.
 * Paleta monocromática con acentos desaturados (migración de sesión 2026-07-22).
 */
export const ESTADOS_ESTILOS: Record<string, string> = {
    "Terminado": "bg-gray-100 text-gray-500 border border-gray-200 dark:bg-white/5 dark:text-gray-400 dark:border-white/10",
    "Imprimiendo": "bg-gray-100 text-gray-700 border border-gray-200 dark:bg-white/8 dark:text-gray-300 dark:border-white/15",
    "Manipulado": "bg-gray-100 text-gray-700 border border-gray-200 dark:bg-white/8 dark:text-gray-300 dark:border-white/15",
    "Urgente": "bg-gray-900 text-white border border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white animate-pulse",
    "Por hacer": "bg-white text-gray-500 border border-gray-200 dark:bg-transparent dark:text-gray-500 dark:border-white/10",
};

export const ICONOS_ESTADO: Record<string, string> = {
    "Terminado": "check_circle",
    "Imprimiendo": "print",
    "Manipulado": "package_2",
    "Urgente": "bolt",
    "Por hacer": "radio_button_unchecked",
};
