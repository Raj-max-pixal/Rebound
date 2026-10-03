const upstream = 'https://rebound-school-comeback.astrapro70.chatgpt.site';

export default async function handler(request, response) {
  const path = Array.isArray(request.query.path) ? request.query.path.join('/') : String(request.query.path || '');
  const target = new URL(`/api/${path}`, upstream);
  for (const [key, value] of Object.entries(request.query)) if (key !== 'path' && typeof value === 'string') target.searchParams.set(key, value);
  const headers = {};
  for (const key of ['authorization', 'content-type']) if (request.headers[key]) headers[key] = request.headers[key];
  const result = await fetch(target, { method: request.method, headers, body: ['GET', 'HEAD'].includes(request.method) ? undefined : JSON.stringify(request.body) });
  response.status(result.status);
  for (const [key, value] of result.headers) if (key === 'content-type' || key === 'cache-control') response.setHeader(key, value);
  response.send(Buffer.from(await result.arrayBuffer()));
}
