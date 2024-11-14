import type { Route } from "./+types.upload";

export async function loader({ params }: Route.LoaderArgs) {}

export async function action({ request, params }: Route.ActionArgs) {}

export default function Upload({ params, loaderData }: Route.ComponentProps) {}
