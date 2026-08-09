<script lang="ts" module>
  import { tv, type VariantProps } from "tailwind-variants";

  export const badgeVariants = tv({
    base: "inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-[10px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 tracking-wide uppercase",
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80 shadow-xs",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  });

  export type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];
</script>

<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";

  type Props = HTMLAttributes<HTMLDivElement> & {
    variant?: BadgeVariant;
    class?: string;
  };

  let { children, class: className, variant = "default", ...rest }: Props = $props();
</script>

<div class={cn(badgeVariants({ variant }), className)} {...rest}>
  {@render children?.()}
</div>
