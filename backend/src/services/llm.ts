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

// Free options:
//  - OpenRouter: LLM_API_URL=https://openrouter.ai/api/v1/chat/completions
//                LLM_MODEL=meta-llama/llama-3.3-70b-instruct:free  (check openrouter.ai/models for current free models)
//  - Ollama:     LLM_API_URL=http://localhost:11434/v1/chat/completions
//                LLM_MODEL=qwen2.5-coder:7b   (no API key needed)
const DEFAULT_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'meta-llama/llama-3.3-70b-instruct:free';

// Use || (not ??) so blank values like `LLM_API_URL=` fall back to the default.
function resolveApiUrl(): string {
  const url = env.LLM_API_URL?.trim().replace(/^["']|["']$/g, '') || DEFAULT_API_URL;
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
export const LLM_MODEL = env.LLM_MODEL?.trim() || DEFAULT_MODEL;

console.log(
  '[llm] config',
  JSON.stringify({ API_URL, LLM_MODEL, hasKey: !!env.OPENROUTER_API_KEY })
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
  if (env.OPENROUTER_API_KEY) {
    headers.Authorization = `Bearer ${env.OPENROUTER_API_KEY}`;
  }
  if (env.APP_URL) headers['HTTP-Referer'] = env.APP_URL;
  if (process.env.APP_NAME) headers['X-Title'] = process.env.APP_NAME;

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers,
        signal: AbortSignal.timeout(60_000), // don't hang the Kafka consumer
        body: JSON.stringify({
          model: LLM_MODEL,
          temperature: 0,
          messages: [{ role: 'user', content: buildPrompt(ctx) }],
        }),
      });

      if (res.status === 429) {
        // rate limited: back off and retry
        await new Promise((r) => setTimeout(r, 5000 * (attempt + 1)));
        throw new Error('rate limited (429)');
      }
      if (!res.ok) throw new Error(`LLM HTTP ${res.status}: ${await res.text()}`);

      const data = (await res.json()) as any;
      const raw: string = data?.choices?.[0]?.message?.content ?? '';
      const cleaned = raw.replace(/```json|```/g, '').trim();
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      if (start === -1 || end === -1) throw new Error('no JSON object in LLM output');

      return RootCauseSchema.parse(JSON.parse(cleaned.slice(start, end + 1)));
    } catch (err) {
      lastError = err;
      console.error(
        `[llm] attempt ${attempt + 1}/${retries + 1} failed for cluster ${ctx.clusterId}:`,
        err,
        'URL:',
        JSON.stringify(API_URL)
      );

      // A bad URL will never succeed on retry, so fail fast.
      if (err instanceof TypeError && String(err).includes('Failed to parse URL')) {
        throw err;
      }
    }
  }

  throw new Error(`LLM failed after ${retries + 1} attempts: ${String(lastError)}`);
}