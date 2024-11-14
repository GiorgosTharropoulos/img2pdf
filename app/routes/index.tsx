import fs from "node:fs/promises";
import path from "node:path";
import { getFormProps, useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import { Form, Outlet, redirect } from "react-router";
import { z } from "zod";

import type { Route } from "./+types.index";
import { InputConform } from "~/components/conform/input";
import { Field, FieldError } from "~/components/field";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";

const schema = z.object({
  files: z
    .array(z.instanceof(File))
    .min(1, "At least one file is required")
    .refine(
      (files) => files.every((file) => file.type.startsWith("image/")),
      "All files must be images",
    ),
});

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const { files } = submission.value;
  const now = new Date().toISOString();

  const uploadPath = path.resolve(".", "uploads", now);
  await fs.mkdir(uploadPath, { recursive: true });
  await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(uploadPath, file.name);
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await fs.writeFile(filePath, buffer);
    }),
  );

  throw redirect(`/uploads/${now}`);
}

export default function Home({ actionData }: Route.ComponentProps) {
  const [form, fields] = useForm({
    lastResult: actionData,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
  });

  return (
    <div className="container mx-auto mt-4 flex-1">
      <Form method="POST" {...getFormProps(form)} encType="multipart/form-data">
        <Field className="flex-1">
          <Label htmlFor={fields.files.id}>Name</Label>
          <InputConform meta={fields.files} type="file" multiple />
          {fields.files.errors && (
            <FieldError id={fields.files.errorId}>{fields.files.errors}</FieldError>
          )}
        </Field>
        <Button className="mt-2" type="submit">
          Submit
        </Button>
      </Form>
    </div>
  );
}
