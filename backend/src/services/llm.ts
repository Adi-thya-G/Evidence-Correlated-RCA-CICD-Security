// services/llm.ts
import { z } from 'zod';
import { env } from '@config/env';

export const RootCauseSchema = z.object({
  root_cause: z.string().min(1),
  culprit_commit: z.string().min(1),
  confidence: z.number().min(0).max(1),
  fix_suggestion: z.string().min(1),
  evidence_used: z.array(z.string()),
});
export type RootCause = z.infer<typeof RootCauseSchema>;

// version 1.1
export interface ClusterContext {
  clusterId: string;
  findings: {
    tool: string;
    ruleId: string;
    cwe?: string;
    file: string;
    line: number;
    message: string;
  }[];
  candidateCommits: { sha: string; author: string; score: number; diff: string }[];
  codeWindow: string;
}

// Provider examples (set in .env; URL, model and key must belong to the same provider):
//  - OpenRouter: https://openrouter.ai/api/v1/chat/completions
//  - Gemini:     https://generativelanguage.googleapis.com/v1beta/openai/chat/completions
//  - DeepSeek:   https://api.deepseek.com/chat/completions
//  - Ollama:     http://localhost:11434/v1/chat/completions  (no key needed)
const DEFAULT_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'meta-llama/llama-3.3-70b-instruct';

// Trim whitespace and stray quotes; an empty result means "not set".
const clean = (v?: string) =>
  (v ?? '').trim().replace(/^["']+|["']+$/g, '').trim();

function resolveApiUrl(): string {
  const url = clean(env.LLM_API_URL) || clean(env.LLM_API_URL) || DEFAULT_API_URL;
  try {
    new URL(url);
  } catch {
    throw new Error(
      `Invalid LLM_API_URL: ${JSON.stringify(url)} (must be a full URL including http:// or https://)`
    );
  }
  return url;
}

const API_URL = resolveApiUrl();
export const LLM_MODEL =
  clean(env.LLM_MODEL) || clean(env.LLM_MODEL) || DEFAULT_MODEL;
const API_KEY =
  clean(env.OPENROUTER_API_KEY) ||
  clean(env.OPENROUTER_API_KEY);

console.log(
  '[llm] config',
  JSON.stringify({ API_URL, LLM_MODEL, hasKey: !!API_KEY, cwd: process.cwd() })
);

export function buildPrompt(ctx: ClusterContext): string {
  const findings = ctx.findings
    .map((f) => `- [${f.tool}] ${f.ruleId} ${f.cwe ?? ''} ${f.file}:${f.line} ${f.message}`)
    .join('\n');

  const commits = ctx.candidateCommits
    .slice(0, 3)
    .map(
      (c) =>
        `### ${c.sha} by ${c.author} (evidence score ${c.score.toFixed(2)})\n${c.diff.slice(0, 1500)}`
    )
    .join('\n\n');

  return `You are a security root-cause analyst. Use ONLY the evidence below.

FINDINGS (correlated):
${findings}

CANDIDATE COMMITS (ranked):
${commits}

${ctx.codeWindow ? `CODE WINDOW:\n${ctx.codeWindow.slice(0, 2500)}\n` : ''}
Respond with JSON only, no markdown, with keys:
root_cause (string), culprit_commit (full sha copied from the candidate list),
confidence (number 0-1), fix_suggestion (string), evidence_used (array of strings).`;
}

export async function explainRootCause(ctx: ClusterContext, retries = 2): Promise<RootCause> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (API_KEY) headers.Authorization = `Bearer ${API_KEY}`;
  if (env.APP_URL) headers['HTTP-Referer'] = env.APP_URL;
  if (process.env.APP_NAME) headers['X-Title'] = process.env.APP_NAME;

  const prompt = buildPrompt(ctx);
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const t0 = Date.now();
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers,
        signal: AbortSignal.timeout(120_000),
        body: JSON.stringify({
          model: LLM_MODEL,
          temperature: 0,
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (res.status === 429) {
        await new Promise((r) => setTimeout(r, 5000 * (attempt + 1)));
        throw Object.assign(new Error('rate limited (429)'), { retryable: true });
      }
      if (!res.ok) {
        const body = await res.text();
        // 4xx (bad key, bad model, bad request) will not fix itself; only 5xx retries
        throw Object.assign(new Error(`LLM HTTP ${res.status}: ${body}`), {
          retryable: res.status >= 500,
        });
      }

      const data = (await res.json()) as any;
      const raw: string = data?.choices?.[0]?.message?.content ?? '';
      console.log(`[llm] cluster ${ctx.clusterId} ok in ${Date.now() - t0}ms`);

      const cleaned = raw
        .replace(/<think>[\s\S]*?<\/think>/g, '')
        .replace(/```json|```/g, '')
        .trim();
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      if (start === -1 || end === -1) {
        console.error('[llm] raw output was:', raw.slice(0, 500));
        throw Object.assign(new Error('no JSON object in LLM output'), { retryable: true });
      }

      const parsed = RootCauseSchema.parse(JSON.parse(cleaned.slice(start, end + 1)));

      // make sure the model returned a real candidate sha, normalize to the full sha
      const match = ctx.candidateCommits.find(
        (c) => c.sha === parsed.culprit_commit || c.sha.startsWith(parsed.culprit_commit)
      );
      if (!match) {
        throw Object.assign(new Error('culprit_commit not in candidate list'), {
          retryable: true,
        });
      }
      parsed.culprit_commit = match.sha;
      return parsed;
    } catch (err) {
      lastError = err;
      const isTimeout = err instanceof DOMException && err.name === 'TimeoutError';
      console.error(
        `[llm] attempt ${attempt + 1}/${retries + 1} failed after ${Date.now() - t0}ms for cluster ${ctx.clusterId}:`,
        isTimeout ? 'TIMEOUT' : err
      );

      if (err instanceof TypeError && String(err).includes('Failed to parse URL')) throw err;
      if ((err as any)?.retryable === false) throw err; // fail fast on 4xx
      if (isTimeout && attempt >= 1) throw err; // retry timeouts only once
    }
  }

  throw new Error(`LLM failed after ${retries + 1} attempts: ${String(lastError)}`);
}