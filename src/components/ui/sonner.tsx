import { Toaster as Sonner, ToasterProps } from "sonner"

type ToasterCustomProps = ToasterProps & {
  richColors?: boolean;
};

const Toaster = ({
  position = "bottom-right",
  theme = "system", // system, light, dark
  richColors = false,
  ...props
}: ToasterCustomProps) => {
  return (
    <Sonner
      theme={theme}
      position={position}
      richColors={richColors}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover, #fff)",
          "--normal-text": "var(--popover-foreground, #000)",
          "--normal-border": "var(--border, #e5e7eb)",
          "--success-bg": richColors ? undefined : "#fff",
          "--success-text": richColors ? undefined : "#000",
          "--success-border": richColors ? undefined : "#e5e7eb",
          "--error-bg": richColors ? undefined : "#fff",
          "--error-text": richColors ? undefined : "#000",
          "--error-border": richColors ? undefined : "#e5e7eb",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
