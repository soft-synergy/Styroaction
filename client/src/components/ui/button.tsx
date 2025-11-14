import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-lg text-base font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background shadow-sm",
          {
            "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md": variant === "default",
            "border-2 border-gray-300 bg-white text-gray-900 hover:bg-gray-50 hover:border-gray-400": variant === "outline",
            "hover:bg-gray-100 text-gray-900": variant === "ghost",
            "underline-offset-4 hover:underline text-blue-600": variant === "link",
            "h-12 py-3 px-6": size === "default",
            "h-10 px-4 rounded-lg": size === "sm",
            "h-14 px-10 rounded-lg": size === "lg",
            "h-12 w-12": size === "icon",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }

