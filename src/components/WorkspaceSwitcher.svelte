<script lang="ts">
  import {
    Factory,
    GraduationCap,
    Briefcase,
    Receipt,
    ChevronsUpDown,
    Plus,
  } from "lucide-svelte";
  import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuGroup,
  } from "./ui/dropdown-menu";

  let {
    workspaceActivo = "produccion",
  }: {
    workspaceActivo?: string;
  } = $props();

  const equipos = [
    {
      id: "produccion",
      nombre: "Imprenta",
      plan: "Producción",
      icon: Factory,
      shortcut: "⌘1",
    },
    {
      id: "escolar",
      nombre: "Agendas Escolares",
      plan: "Educativo",
      icon: GraduationCap,
      shortcut: "⌘2",
    },
    {
      id: "profesional",
      nombre: "Agendas Profesionales",
      plan: "Empresarial",
      icon: Briefcase,
      shortcut: "⌘3",
    },
    {
      id: "facturacion",
      nombre: "Facturación",
      plan: "Fiscal & Comercial",
      icon: Receipt,
      shortcut: "⌘4",
    },
  ];

  const equipoActivo = $derived(
    equipos.find((e) => e.id === workspaceActivo) || equipos[0]
  );
  const IconActivo = $derived(equipoActivo.icon);

  function seleccionarWorkspace(id: string) {
    if (id !== workspaceActivo) {
      if (id === "facturacion") {
        window.location.href = `/w/facturacion/facturacion`;
      } else {
        window.location.href = `/w/${id}`;
      }
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.metaKey || e.ctrlKey) {
      if (e.key === "1") {
        e.preventDefault();
        seleccionarWorkspace("produccion");
      } else if (e.key === "2") {
        e.preventDefault();
        seleccionarWorkspace("escolar");
      } else if (e.key === "3") {
        e.preventDefault();
        seleccionarWorkspace("profesional");
      } else if (e.key === "4") {
        e.preventDefault();
        seleccionarWorkspace("facturacion");
      }
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="w-full px-3">
  <DropdownMenu>
    <DropdownMenuTrigger
      class="w-full flex items-center gap-3 p-2 rounded-2xl hover:bg-gray-100 dark:hover:bg-[#1E2228] transition-colors cursor-pointer outline-none select-none group data-[state=open]:bg-gray-100 dark:data-[state=open]:bg-[#1E2228]"
    >
      <div
        class="flex size-9 items-center justify-center rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-xs flex-shrink-0"
      >
        <IconActivo class="size-4" strokeWidth={2.2} />
      </div>

      <div class="grid flex-1 text-left leading-tight min-w-0">
        <span class="truncate font-semibold text-xs text-[#1A1D21] dark:text-[#EDF0F3]">
          {equipoActivo.nombre}
        </span>
        <span class="truncate text-[11px] font-medium text-gray-400 dark:text-gray-500 mt-0.5">
          {equipoActivo.plan}
        </span>
      </div>

      <ChevronsUpDown class="size-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
    </DropdownMenuTrigger>

    <DropdownMenuContent
      side="right"
      align="start"
      sideOffset={8}
      class="w-64 p-1.5 rounded-2xl border border-gray-100 dark:border-[#232830] bg-white dark:bg-[#1E2228] shadow-xl"
    >
      <DropdownMenuGroup>
        <DropdownMenuLabel class="text-xs text-gray-400 dark:text-gray-500 px-2 py-1.5 font-semibold">
          Equipos
        </DropdownMenuLabel>

        {#each equipos as equipo}
          {@const EquipoIcon = equipo.icon}
          <DropdownMenuItem
            onSelect={() => seleccionarWorkspace(equipo.id)}
            class="gap-2.5 p-2 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/60 {workspaceActivo === equipo.id ? 'bg-gray-50 dark:bg-gray-800/60' : ''}"
          >
            <div
              class="flex size-6 items-center justify-center rounded-lg border border-gray-200 dark:border-[#232830] bg-gray-50 dark:bg-gray-800/40 text-gray-700 dark:text-gray-300 flex-shrink-0"
            >
              <EquipoIcon class="size-3.5" strokeWidth={2} />
            </div>

            <span class="font-semibold text-xs text-[#1A1D21] dark:text-[#EDF0F3] flex-1 truncate">
              {equipo.nombre}
            </span>

            <DropdownMenuShortcut>{equipo.shortcut}</DropdownMenuShortcut>
          </DropdownMenuItem>
        {/each}
      </DropdownMenuGroup>

      <DropdownMenuSeparator class="my-1 border-t border-gray-100 dark:border-[#232830]" />

      <DropdownMenuItem
        class="gap-2.5 p-2 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/60"
      >
        <div
          class="flex size-6 items-center justify-center rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-transparent text-gray-400 flex-shrink-0"
        >
          <Plus class="size-3.5" strokeWidth={2.2} />
        </div>
        <span class="font-medium text-xs text-gray-500 dark:text-gray-400">
          Añadir equipo
        </span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</div>