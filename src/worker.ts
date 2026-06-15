export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    const assetResponse = await env.ASSETS.fetch(request);

    if (assetResponse.status !== 404) {
      return assetResponse;
    }

    if (request.method === "GET" && acceptsHtml(request)) {
      return env.ASSETS.fetch(new Request(new URL("/", url), request));
    }

    return assetResponse;
  },
} satisfies ExportedHandler<Env>;

function acceptsHtml(request: Request): boolean {
  return request.headers.get("accept")?.includes("text/html") ?? false;
}
