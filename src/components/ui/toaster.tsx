import { useToast } from "./use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "./toast"
import { CheckCircle2, XCircle, Info } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        let IconComponent;
        switch (variant) {
          case "destructive":
            IconComponent = <XCircle className="h-5 w-5" />;
            break;
          case "success":
            IconComponent = <CheckCircle2 className="h-5 w-5" />;
            break;
          default:
            IconComponent = <Info className="h-5 w-5" />;
            break;
        }

        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 pt-0.5">
                {IconComponent}
              </div>
              <div className="grid gap-1 flex-grow">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
} 