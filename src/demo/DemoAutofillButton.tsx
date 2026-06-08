import { Wand2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { isDemoMode } from "./demoMode";

interface DemoAutofillButtonProps extends Omit<ButtonProps, "onClick" | "type" | "variant"> {
  onFill: () => void;
  label?: string;
}

export function DemoAutofillButton({
  onFill,
  label = "Preencher exemplo",
  size = "sm",
  ...props
}: DemoAutofillButtonProps) {
  if (!isDemoMode()) return null;

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      onClick={onFill}
      {...props}
    >
      <Wand2 className="h-4 w-4" />
      {label}
    </Button>
  );
}
