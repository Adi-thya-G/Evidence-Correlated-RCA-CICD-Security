import crypto from 'crypto';

export const EMBED_VERSION = 'v1'; // bump when the model or template changes

export function buildEmbedText(f: any): string {
  return [
    `tool: ${f.tool}`,
    `category: ${f.category}`,
    `rule: ${f.ruleId ?? f.rule}`,
    `severity: ${f.severity}`,
    `message: ${f.message}`,
    `file: ${f.file}`,
    f.codeWindow ? `code:\n${f.codeWindow}` : '',
  ].filter(Boolean).join('\n');
}

export const embedHash = (text: string) =>
  crypto.createHash('sha256').update(`${EMBED_VERSION}|${text}`).digest('hex');