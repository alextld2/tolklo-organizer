<script lang="ts">
  import { sidebarOpen } from "../stores/sidebar";
</script>

<aside
  class="h-full flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden hidden lg:block {$sidebarOpen ? 'w-64 opacity-100 pr-1.5' : 'w-0 opacity-0 pr-0 pointer-events-none'}"
>
  <slot />
</aside>
