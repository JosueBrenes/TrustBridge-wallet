"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface InteractiveHoverButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const InteractiveHoverButton = React.forwardRef<
  HTMLButtonElement,
  InteractiveHoverButtonProps
>(({ children, className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "group bg-background relative w-auto cursor-pointer overflow-hidden rounded-full border px-8 py-3 text-center font-semibold transition-all duration-300",
        className
      )}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      {/* Efecto shimmer/hover si querés, pero sin puntito ni flecha */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition duration-500"></div>
    </button>
  );
});

InteractiveHoverButton.displayName = "InteractiveHoverButton";
