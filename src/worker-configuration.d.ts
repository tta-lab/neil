interface Env {
  ASSETS: Fetcher;
}

interface ExportedHandler<Environment = unknown> {
  fetch(request: Request, env: Environment): Response | Promise<Response>;
}
