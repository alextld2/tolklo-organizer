// src/utils/constants.ts

export const LISTA_COMERCIALES = ["Marcos", "Alfonso", "Jesus", "Maria Jesús"];

export const LISTA_ESTADOS = ["Por hacer", "Imprimiendo", "Manipulado", "Terminado", "Urgente"];

export const LISTA_AREAS = ["Digital", "Offset", "Plotter", "OPX", "DTF", "Mimaki"];

export const ESTADOS_ESTILOS: Record<string, string> = {
    "Terminado": "bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    "Imprimiendo": "bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
    "Manipulado": "bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
    "Urgente": "bg-red-50 text-red-700 border border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20 animate-pulse",
    "Por hacer": "bg-gray-50 text-gray-600 border border-gray-100 dark:bg-[#1E2228] dark:text-gray-400 dark:border-[#232830]"
};

export const ICONOS_ESTADO: Record<string, string> = {
    "Terminado": "check_circle",
    "Imprimiendo": "print",
    "Manipulado": "package_2",
    "Urgente": "bolt",
    "Por hacer": "radio_button_unchecked"
};
