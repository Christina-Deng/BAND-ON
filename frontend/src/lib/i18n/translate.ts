import type { Locale } from './locale';
import { en } from './en';
import { zh } from './zh';

type MessageTree = typeof zh;

const catalogs: Record<Locale, MessageTree> = { zh, en: en as unknown as MessageTree };

function getByPath(obj: Record<string, unknown>, path: string): unknown {
  let cur: unknown = obj;
  for (const part of path.split('.')) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

export function translate(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>,
): string {
  const tree = catalogs[locale] as Record<string, unknown>;
  const fallback = catalogs.zh as Record<string, unknown>;
  const raw = getByPath(tree, key) ?? getByPath(fallback, key);
  if (typeof raw !== 'string') return key;
  let text = raw;
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.replaceAll(`{{${name}}}`, String(value));
    }
  }
  return text;
}
