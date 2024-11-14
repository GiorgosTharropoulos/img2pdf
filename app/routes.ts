import type { RouteConfig } from "@react-router/dev/routes";
import { index, layout, route } from "@react-router/dev/routes";

export const routes: RouteConfig = [
  layout("./routes/layout.tsx", [
    route("/", "./routes/index.tsx"),
    route("/uploads", "./routes/uploads.tsx", [route(":id", "./routes/upload.tsx")]),
  ]),
];
