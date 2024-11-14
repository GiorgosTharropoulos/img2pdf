import type React from "react";

import { cn } from "~/lib/utils";

export interface FieldProps extends React.HtmlHTMLAttributes<HTMLDivElement> {}
export function Field({ children, className, ...rest }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)} {...rest}>
      {children}
    </div>
  );
}

export interface FieldErrorProps extends React.HtmlHTMLAttributes<HTMLDivElement> {}
export function FieldError({ children, className, ...rest }: FieldErrorProps) {
  return (
    <div className={cn("text-sm text-red-600", className)} {...rest}>
      {children}
    </div>
  );
}
