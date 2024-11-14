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
  directoryName: z
    .string()
    .min(1, "Directory name is required")
    .regex(
      /^[a-zA-Z0-9-_]+$/,
      "Directory name can only contain letters, numbers, hyphens and underscores",
    ),
  files: z
    .array(z.instanceof(File))
    .min(1, "At least one file is required")
    .refine(
      (files) =>
        files.every(
          (file) =>
            file.type.startsWith("image/") &&
            !file.type.includes("svg") &&
            !file.name.toLowerCase().endsWith(".svg")
        ),
      "All files must be images (SVG files are not supported)",
    ),
});

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const { files, directoryName } = submission.value;
  const uploadPath = path.resolve(".", "uploads", directoryName);

  try {
    await fs.access(uploadPath);
    // Directory exists, return error
    return submission.reply({
      fieldErrors: {
        directoryName: [`Directory "${directoryName}" already exists`],
      },
    });
  } catch {
    // Directory doesn't exist, create it
    await fs.mkdir(uploadPath, { recursive: true });
  }
  await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(uploadPath, file.name);
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await fs.writeFile(filePath, buffer);
    }),
  );

  throw redirect(`/uploads/${directoryName}`);
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
    <div className="container mx-auto mt-4 flex-1 p-6">
      <Form method="POST" {...getFormProps(form)} encType="multipart/form-data">
        <div className="space-y-4">
          <Field className="flex-1">
            <Label htmlFor={fields.directoryName.id}>Directory Name</Label>
            <InputConform meta={fields.directoryName} type="text" />
            {fields.directoryName.errors && (
              <FieldError id={fields.directoryName.errorId}>
                {fields.directoryName.errors}
              </FieldError>
            )}
          </Field>
          <Field className="flex-1">
            <Label htmlFor={fields.files.id}>Name</Label>
            <InputConform meta={fields.files} type="file" multiple />
            {fields.files.errors && (
              <FieldError id={fields.files.errorId}>{fields.files.errors}</FieldError>
            )}
          </Field>
          <Button type="submit">Submit</Button>
        </div>
      </Form>
    </div>
  );
}
