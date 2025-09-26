"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-right" // top-right placement
      richColors // allows full color customization
      toastOptions={{
        success: {
          style: {
            background: '#166534', // dark green background
            color: '#bbf7d0',      // light green text
            border: '1px solid #22c55e',
            fontWeight: '600',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
          },
        },
        error: {
          style: {
            background: '#7f1d1d', // dark red background
            color: '#fecaca',      // light red text
            border: '1px solid #ef4444',
            fontWeight: '600',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
          },
        },
      }}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
