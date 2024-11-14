import type { FieldMetadata } from "@conform-to/react";
import type { ComponentProps } from "react";
import { getInputProps } from "@conform-to/react";

import { Input } from "../ui/input";

export function InputConform<T>({
  meta,
  type,
  ...props
}: {
  meta: FieldMetadata<T>;
  type: Parameters<typeof getInputProps>[1]["type"];
} & ComponentProps<typeof Input>) {
  return <Input {...getInputProps(meta, { type, ariaAttributes: true })} {...props} />;
}
