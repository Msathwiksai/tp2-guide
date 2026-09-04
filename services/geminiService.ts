import { AIResponse, CommandExplanation, CommandOS, ExploringMode } from '../types';

type VerifyResponse = { exists: boolean; correctedName?: string; reason?: string };

/**
 * Carries the HTTP status so callers can branch on it. Sniffing `message` for
 * words like "quota" is unreliable — the server deliberately returns generic
 * text, so string matching silently never fired.
 */
export type ApiErrorCode = 'NOT_CONFIGURED' | 'RATE_LIMITED' | 'UPSTREAM_BUSY' | 'INTERNAL';

export class ApiError extends Error {
  readonly status: number;
  readonly code?: ApiErrorCode;
  constructor(message: string, status: number, code?: ApiErrorCode) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
  /** 429 = our own rate limiter or the upstream provider's. */
  get isRateLimited() { return this.status === 429 || this.code === 'RATE_LIMITED'; }
  /** 503 = the server has no API key configured. Needs setup instructions. */
  get isUnavailable() { return this.status === 503 || this.code === 'NOT_CONFIGURED'; }
  /** 502 = the key is fine but every model is overloaded. Just retry. */
  get isUpstreamBusy() { return this.status === 502 || this.code === 'UPSTREAM_BUSY'; }
}

/**
 * Generation can be slow, but never minutes. Without a ceiling a stalled
 * request leaves the UI spinning indefinitely with no way out.
 *
 * Set well above the worst observed latency: free-tier calls have taken 50s+
 * under load, and the server may also walk a fallback list of models, so a
 * tighter ceiling would abort requests that were about to succeed.
 */
const TIMEOUT_MS = 120_000;

async function request<T>(path: string, body: object): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError('The request timed out. The AI service may be unreachable.', 504);
    }
    throw new ApiError('Could not reach the server. Check that the API is running.', 0);
  } finally {
    clearTimeout(timer);
  }
  const data = await response.json().catch(() => ({} as { error?: string; code?: ApiErrorCode }));
  if (!response.ok) {
    // A failure with no JSON body is almost always the dev proxy reporting that
    // the API server is unreachable, not the API rejecting the request. Saying
    // "Request failed." there sends people hunting in the wrong place.
    const message =
      data.error ||
      (response.status >= 500
        ? 'The API server is not responding. It may have stopped — restart it with `npm run dev`.'
        : `Request failed (HTTP ${response.status}).`);
    throw new ApiError(message, response.status, data.code);
  }
  return data as T;
}

function validGuide(value: unknown): value is AIResponse {
  const guide = value as AIResponse;
  return !!guide && typeof guide.overview === 'string' && Array.isArray(guide.steps) && guide.steps.length > 0 &&
    guide.steps.every(step => typeof step.title === 'string' && typeof step.description === 'string' && ['Beginner', 'Intermediate', 'Advanced'].includes(step.difficulty));
}

export async function verifyApplicationExistence(target: string): Promise<VerifyResponse> { return request<VerifyResponse>('/api/verify', { target }); }
export async function getGuideContent(target: string, topic: string, version: string, mode: ExploringMode = ExploringMode.STANDARD): Promise<AIResponse> {
  const data = await request<unknown>('/api/guide', { target, topic, version, mode });
  if (!validGuide(data)) throw new Error('The AI returned an incomplete guide. Please try again.');
  return data;
}
export async function explainCommand(command: string, os: CommandOS): Promise<CommandExplanation> {
  const data = await request<CommandExplanation>('/api/command', { command, os });
  if (!data || !Array.isArray(data.parts)) {
    throw new Error('The AI returned an incomplete explanation. Please try again.');
  }
  return data;
}
export type Capabilities = { ai: boolean; images: boolean; video: boolean };

/** Lets the UI hide features this deployment cannot perform. */
export async function getCapabilities(): Promise<Capabilities> {
  try {
    const response = await fetch('/api/capabilities');
    if (!response.ok) throw new Error('unavailable');
    return await response.json();
  } catch {
    return { ai: false, images: false, video: false };
  }
}

export type VideoJob = { status: 'pending' | 'ready' | 'failed'; videoUrl?: string; error?: string };

/** Starts a Veo job. Generation takes minutes, so this only returns a job id. */
export async function startStepVideo(app: string, stepTitle: string, description: string): Promise<string> {
  const data = await request<{ jobId: string }>('/api/video', { app, stepTitle, description });
  return data.jobId;
}

export async function pollStepVideo(jobId: string): Promise<VideoJob> {
  const response = await fetch(`/api/video/${encodeURIComponent(jobId)}`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(data.error || 'Could not check the video job.', response.status, data.code);
  return data as VideoJob;
}

export async function generateStepImage(app: string, version: string, stepTitle: string, visualCue: string): Promise<string | null> { return (await request<{ image: string | null }>('/api/image', { app, version, stepTitle, visualCue })).image; }
export type ChatTurn = { role: 'user' | 'assistant'; text: string };

/**
 * `history` is what gives the mentor memory. Without it every question was
 * answered in isolation, so follow-ups like "explain that again" or "what about
 * the other flag" had nothing to refer to. The server bounds and sanitises it.
 */
export async function askAIQuestion(
  context: string,
  question: string,
  history: ChatTurn[] = [],
): Promise<string> {
  const data = await request<{ text: string }>('/api/chat', { context, question, history });
  return data.text || "I'm sorry, I couldn't generate an answer right now.";
}
