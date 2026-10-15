import type { IncomingMessage, ServerResponse } from "node:http";
import {
  completeVisaDocument,
  createSignedDocumentUpload,
  createVisaApplication,
} from "./visaApplicationService";

type RequestWithBody = IncomingMessage & { body?: unknown };

type JsonResponse = ServerResponse & {
  status?: (code: number) => JsonResponse;
  json?: (payload: unknown) => void;
};

function sendJson(res: JsonResponse, statusCode: number, payload: unknown) {
  if (typeof res.status === "function" && typeof res.json === "function") {
    const expressResponse = res.status(statusCode);
    expressResponse.json?.(payload);
    return;
  }
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req: RequestWithBody): Promise<unknown> {
  if (req.body !== undefined) {
    if (typeof req.body === "string") return JSON.parse(req.body);
    return req.body;
  }

  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.length;
    if (total > 1024 * 1024) throw new Error("Request body is too large.");
    chunks.push(buffer);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

async function handlePost(
  req: RequestWithBody,
  res: JsonResponse,
  action: (body: unknown) => Promise<unknown>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const result = await action(body);
    sendJson(res, 200, { ok: true, ...((result as object) ?? {}) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The request could not be completed.";
    console.error("[Visa API]", message);
    sendJson(res, 400, { ok: false, error: message });
  }
}

export function handleCreateVisaApplication(req: RequestWithBody, res: JsonResponse) {
  return handlePost(req, res, createVisaApplication);
}

export function handleSignVisaDocument(req: RequestWithBody, res: JsonResponse) {
  return handlePost(req, res, createSignedDocumentUpload);
}

export function handleCompleteVisaDocument(req: RequestWithBody, res: JsonResponse) {
  return handlePost(req, res, completeVisaDocument);
}
