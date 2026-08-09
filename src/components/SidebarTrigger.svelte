<script lang="ts">
  import { onMount } from "svelte";
  import { sidebarOpen } from "../stores/sidebar";

  let currentPath = "";

  onMount(() => {
    currentPath = window.location.pathname;
    const handleAfterSwap = () => {
      currentPath = window.location.pathname;
    };
    document.addEventListener("astro:after-swap", handleAfterSwap);
    return () => {
      document.removeEventListener("astro:after-swap", handleAfterSwap);
    };
  });

  function toggleSidebar() {
    sidebarOpen.update((v) => !v);
  }

  $: workspace = currentPath.split("/")[2] || "produccion";
  $: section = currentPath.split("/")[3] || "";

  const nombresWorkspace: Record<string, string> = {
    produccion: "Imprenta",
    escolar: "Agendas Escolares",
    profesional: "Agendas Profesionales",
  };

  const nombresSecciones: Record<string, string> = {
    "": "Inicio",
    tasks: "Control de Tareas",
    calendar: "Calendario de Entregas",
    clients: "Directorio de Clientes",
    logs: "Historial de Registros",
    "nueva-tarea": "Nuevo Parte de Trabajo",
  };

  $: workspaceNombre = nombresWorkspace[workspace] || "Workspace";
  $: seccionNombre = nombresSecciones[section] || (section ? section.toUpperCase() : "Inicio");
</script>

<div class="flex items-center gap-2 font-sans select-none">
  <!-- Botón de Alternancia (Sidebar Trigger estilo Shadcn) -->
  <button
    type="button"
    on:click={toggleSidebar}
    aria-label="Alternar barra lateral"
    class="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/80 transition-all outline-none cursor-pointer border border-transparent hover:border-border/50 flex items-center justify-center"
    title={$sidebarOpen ? "Ocultar barra lateral" : "Mostrar barra lateral"}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M9 3v18" />
    </svg>
  </button>

  <!-- Separador Vertical -->
  <div class="w-px h-4 bg-border/80 mx-1 flex-shrink-0"></div>

  <!-- Migas de Pan (Breadcrumbs) -->
  <nav aria-label="Breadcrumb" class="flex items-center gap-1.5 text-xs">
    <a
      href={`/w/${workspace}`}
      class="text-muted-foreground hover:text-foreground font-medium transition-colors hidden sm:inline-block"
    >
      {workspaceNombre}
    </a>

    <span class="text-muted-foreground/60 text-[10px] hidden sm:inline-block">/</span>

    <span class="font-semibold text-foreground tracking-tight">
      {seccionNombre}
    </span>
  </nav>
</div>
