import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "h-5 gap-1 rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium transition-all has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&>svg]:size-3! inline-flex items-center justify-center w-fit whitespace-nowrap shrink-0 [&>svg]:pointer-events-none focus-visible:border-focus focus-visible:ring-focus/50 focus-visible:ring-[3px] aria-invalid:ring-danger/20 dark:aria-invalid:ring-danger/40 aria-invalid:border-danger transition-colors overflow-hidden group/badge",
  {
    variants: {
      variant: {
        default: "bg-selected text-selected-fg [a]:hover:bg-selected/80",
        secondary: "bg-surface-2 text-fg [a]:hover:bg-surface-2/80",
        destructive: "bg-danger/10 [a]:hover:bg-danger/20 focus-visible:ring-danger/20 dark:focus-visible:ring-danger/40 text-danger dark:bg-danger/20",
        outline: "border-default text-fg [a]:hover:bg-surface-2 [a]:hover:text-fg-muted",
        ghost: "hover:bg-surface-2 hover:text-fg-muted dark:hover:bg-surface-2/50",
        link: "text-selected-fg underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ className, variant })),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
