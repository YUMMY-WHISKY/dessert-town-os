import React, { createContext, useContext, useMemo } from 'react';
import { RELATION_NODES } from '../os/seedData';

interface CollectContextValue {
  collectClue: (clueId: string) => void;
  collectCharacter: (nodeId: string) => void;
  collectFlag: (flag: string) => void;
  discoveredClues: string[];
  metCharacters: string[];
  flags: Record<string, boolean>;
}

export const CollectContext = createContext<CollectContextValue>({
  collectClue: () => {},
  collectCharacter: () => {},
  collectFlag: () => {},
  discoveredClues: [],
  metCharacters: [],
  flags: {},
});

export const CollectProvider = CollectContext.Provider;

type Token =
  | { kind: 'text'; value: string }
  | { kind: 'clue'; label: string; id: string }
  | { kind: 'char'; label: string; id: string }
  | { kind: 'flag'; label: string; flag: string };

const CLUE_TOKEN = /\[\[([^\]|]+)\|([^\]]+)\]\]/g;

const NAME_MAP = new Map(RELATION_NODES.map((n) => [n.name, n.id]));
const NAME_PATTERN = RELATION_NODES.map((n) => n.name)
  .sort((a, b) => b.length - a.length)
  .join('|');
const NAME_SPLIT = new RegExp(`(${NAME_PATTERN})`, 'g');

function toTextTokens(value: string): Token[] {
  if (!value) return [];
  const out: Token[] = [];
  const pieces = value.split(NAME_SPLIT);
  for (const piece of pieces) {
    if (!piece) continue;
    const id = NAME_MAP.get(piece);
    if (id) out.push({ kind: 'char', label: piece, id });
    else out.push({ kind: 'text', value: piece });
  }
  return out;
}

function parse(text: string): Token[] {
  const out: Token[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  CLUE_TOKEN.lastIndex = 0;
  while ((m = CLUE_TOKEN.exec(text)) !== null) {
    if (m.index > last) out.push(...toTextTokens(text.slice(last, m.index)));
    if (m[2].startsWith('flag:')) {
      out.push({ kind: 'flag', label: m[1], flag: m[2].slice(5) });
    } else {
      out.push({ kind: 'clue', label: m[1], id: m[2] });
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(...toTextTokens(text.slice(last)));
  return out;
}

interface RichTextProps {
  text: string;
  className?: string;
}

/**
 * 富文本：`[[文字|clue_id]]` 是可搜集的线索句，
 * 六个角色名会自动变成可搜集的名字。
 * 鼠标移上去变红，点击才收集。
 */
export const RichText: React.FC<RichTextProps> = ({ text, className = '' }) => {
  const {
    collectClue,
    collectCharacter,
    collectFlag,
    discoveredClues,
    metCharacters,
    flags,
  } = useContext(CollectContext);
  const tokens = useMemo(() => parse(text), [text]);

  return (
    <span className={className}>
      {tokens.map((t, i) => {
        if (t.kind === 'text') return <React.Fragment key={i}>{t.value}</React.Fragment>;

        const done =
          t.kind === 'clue'
            ? discoveredClues.includes(t.id)
            : t.kind === 'char'
              ? metCharacters.includes(t.id)
              : !!flags[t.flag];

        return (
          <span
            key={i}
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              if (t.kind === 'clue') collectClue(t.id);
              else if (t.kind === 'char') collectCharacter(t.id);
              else collectFlag(t.flag);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (t.kind === 'clue') collectClue(t.id);
                else if (t.kind === 'char') collectCharacter(t.id);
                else collectFlag(t.flag);
              }
            }}
            className={`cursor-pointer rounded-sm px-0.5 transition-colors ${
              done
                ? 'text-[#059669] bg-[#D1FAE5]/70'
                : 'text-inherit bg-[#FFF3D6]/70 border-b-2 border-dotted border-[#E0A458] hover:text-[#DC2626] hover:bg-[#FFE4E9] hover:border-[#DC2626]'
            }`}
          >
            {t.label}
          </span>
        );
      })}
    </span>
  );
};
