import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/api-docs")({
  head: () => ({
    meta: [
      { title: "REST API reference — Torque Motors" },
      {
        name: "description",
        content:
          "Endpoint reference for the Torque Motors dealership API: auth, vehicles, search, purchase and restock.",
      },
      { property: "og:title", content: "REST API reference — Torque Motors" },
      {
        property: "og:description",
        content: "Auth, vehicle CRUD, search, purchase and restock endpoints.",
      },
    ],
  }),
  component: ApiDocsPage,
});

const endpoints = [
  { method: "POST", path: "/api/auth/register", auth: "Public", description: "Create an account. The first account becomes admin." },
  { method: "POST", path: "/api/auth/login", auth: "Public", description: "Exchange email + password for an access token." },
  { method: "GET", path: "/api/vehicles", auth: "Public", description: "List every vehicle in the inventory." },
  { method: "GET", path: "/api/vehicles/search", auth: "Public", description: "Filter by make, model, category and price range." },
  { method: "POST", path: "/api/vehicles", auth: "Bearer", description: "Add a vehicle to the inventory." },
  { method: "PUT", path: "/api/vehicles/:id", auth: "Bearer", description: "Update a vehicle's details." },
  { method: "DELETE", path: "/api/vehicles/:id", auth: "Admin", description: "Delete a vehicle." },
  { method: "POST", path: "/api/vehicles/:id/purchase", auth: "Bearer", description: "Buy a unit; stock decreases atomically." },
  { method: "POST", path: "/api/vehicles/:id/restock", auth: "Admin", description: "Increase the stock of a vehicle." },
];

function ApiDocsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-14 sm:px-6">
      <h1 className="font-display text-3xl font-bold">REST API reference</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Token-based authentication. Send <code className="text-primary">Authorization: Bearer &lt;token&gt;</code>{" "}
        on protected endpoints. Permissions are enforced in the database, so the API and the app
        share exactly one set of rules.
      </p>

      <div className="mt-8 grid gap-3">
        {endpoints.map((endpoint) => (
          <Card key={`${endpoint.method}-${endpoint.path}`} className="surface-panel gap-2 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="border-primary/40 font-mono text-primary">
                {endpoint.method}
              </Badge>
              <code className="font-mono text-sm">{endpoint.path}</code>
              <Badge variant="secondary" className="ml-auto">
                {endpoint.auth}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{endpoint.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
