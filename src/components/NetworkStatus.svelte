<script lang="ts">
  import { onMount } from "svelte";
  import { WifiOff, Wifi, AlertTriangle } from "lucide-svelte";
  import { fade, slide } from "svelte/transition";

  let isOnline = $state(true);
  let showRestoredBanner = $state(false);
  let timerRestored: any = null;

  onMount(() => {
    // Estado inicial
    if (typeof navigator !== "undefined") {
      isOnline = navigator.onLine;
    }

    const handleOnline = () => {
      isOnline = true;
      showRestoredBanner = true;
      if (timerRestored) clearTimeout(timerRestored);
      timerRestored = setTimeout(() => {
        showRestoredBanner = false;
      }, 4000);
    };

    const handleOffline = () => {
      isOnline = false;
      showRestoredBanner = false;
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Comprobación periódica ligera de conectividad real cada 30 segundos
    const interval = setInterval(async () => {
      if (navigator.onLine) {
        try {
          const res = await fetch("/api/health", { method: "HEAD", cache: "no-store" });
          if (!res.ok && isOnline) {
            isOnline = false;
          } else if (res.ok && !isOnline) {
            handleOnline();
          }
        } catch {
          if (isOnline) isOnline = false;
        }
      } else {
        if (isOnline) isOnline = false;
      }
    }, 30000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
      if (timerRestored) clearTimeout(timerRestored);
    };
  });
</script>

<!-- Banner flotante superior para alertar del estado de red -->
{#if !isOnline}
  <div 
    transition:slide={{ duration: 250 }}
    class="fixed top-3 left-1/2 -translate-x-1/2 z-[300] w-[92%] max-w-xl pointer-events-auto"
  >
    <div class="flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-500/95 dark:bg-amber-600/95 text-amber-950 dark:text-amber-50 shadow-2xl backdrop-blur-md border border-amber-400/40 font-sans text-xs sm:text-sm font-medium">
      <div class="w-8 h-8 rounded-xl bg-amber-600/30 dark:bg-amber-500/30 flex items-center justify-center flex-shrink-0 animate-pulse">
        <WifiOff class="w-4 h-4 text-amber-950 dark:text-amber-100" />
      </div>
      <div class="flex-1 min-w-0">
        <p class="font-bold text-amber-950 dark:text-white">Modo sin conexión a internet</p>
        <p class="text-[11px] text-amber-900/90 dark:text-amber-150 leading-tight">
          Tus datos y borradores se guardan a salvo en este dispositivo. No cierres el navegador hasta recuperar la red.
        </p>
      </div>
    </div>
  </div>
{:else if showRestoredBanner}
  <div 
    transition:slide={{ duration: 250 }}
    class="fixed top-3 left-1/2 -translate-x-1/2 z-[300] w-[90%] max-w-md pointer-events-auto"
  >
    <div class="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-emerald-600/95 text-white shadow-xl backdrop-blur-md border border-emerald-400/40 font-sans text-xs sm:text-sm font-medium">
      <div class="w-7 h-7 rounded-xl bg-emerald-700/50 flex items-center justify-center flex-shrink-0">
        <Wifi class="w-4 h-4 text-white" />
      </div>
      <div class="flex-1 min-w-0">
        <p class="font-bold">Conexión restablecida</p>
        <p class="text-[11px] text-emerald-100 leading-tight">
          La app vuelve a estar conectada al servidor en tiempo real.
        </p>
      </div>
    </div>
  </div>
{/if}
