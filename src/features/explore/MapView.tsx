import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BaseEdge,
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { X } from 'lucide-react';
import type { Emotion, Entry } from '@/types';
import { useLang } from '@/hooks/useLang';
import { useTheme } from '@/hooks/useTheme';
import { emotionIcon, readableOn } from '@/lib/icons';
import { entryTitle } from '@/lib/entries';
import { EntryCard } from '@/components/EntryCard';

interface EmotionData extends Record<string, unknown> {
  emotion: Emotion;
  count: number;
  dim: boolean;
  label: string;
  rtl: boolean;
}

const hiddenHandle = { opacity: 0, top: '50%', left: '50%', pointerEvents: 'none' as const };

function CenterNode({ data }: NodeProps<Node<{ label: string; rtl: boolean }>>) {
  return (
    <div
      dir={data.rtl ? 'rtl' : 'ltr'}
      className="grid h-32 w-32 place-items-center rounded-full border-2 border-gold bg-card p-3 text-center font-semibold shadow-soft"
    >
      <span className="font-arabic text-lg leading-tight">{data.label}</span>
      <Handle type="source" position={Position.Top} style={hiddenHandle} isConnectable={false} />
    </div>
  );
}

function EmotionNode({ data }: NodeProps<Node<EmotionData>>) {
  const { emotion, count, dim, label, rtl } = data;
  const Icon = emotionIcon(emotion.icon);
  return (
    <div
      dir={rtl ? 'rtl' : 'ltr'}
      className={`flex min-h-12 items-center gap-2 rounded-full border-2 border-transparent px-4 py-2 text-sm font-semibold shadow-md transition ${
        dim ? 'opacity-30' : ''
      }`}
      style={{ background: emotion.color, color: readableOn(emotion.color) }}
    >
      <Icon className="h-4 w-4" aria-hidden />
      <span>{label}</span>
      <span className="rounded-full bg-black/10 px-2 text-xs">{count}</span>
      <Handle type="target" position={Position.Top} style={hiddenHandle} isConnectable={false} />
    </div>
  );
}

/** Sanft geschwungene Verbindung (quadratische Kurve mit seitlichem Versatz). */
function CurvedEdge({ id, sourceX, sourceY, targetX, targetY, style }: EdgeProps) {
  const mx = (sourceX + targetX) / 2;
  const my = (sourceY + targetY) / 2;
  const cx = mx + (targetY - sourceY) * 0.18;
  const cy = my - (targetX - sourceX) * 0.18;
  return <BaseEdge id={id} path={`M ${sourceX},${sourceY} Q ${cx},${cy} ${targetX},${targetY}`} style={style} />;
}

const nodeTypes = { center: CenterNode, emotion: EmotionNode };
const edgeTypes = { curved: CurvedEdge };

interface Props {
  emotions: Emotion[];
  entries: Entry[];
  query: string;
}

export function MapView({ emotions, entries, query }: Props) {
  const { t } = useTranslation();
  const { lang, rtl } = useLang();
  const { theme } = useTheme();
  const [selected, setSelected] = useState<string | null>(null);
  const [openEntry, setOpenEntry] = useState<Entry | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const e of entries) for (const id of e.emotionIds) c[id] = (c[id] ?? 0) + 1;
    return c;
  }, [entries]);

  const { nodes, edges } = useMemo(() => {
    const n = emotions.length;
    const R = 280;
    const sign = rtl ? -1 : 1; // Leserichtung spiegelt die Anordnung
    const q = query.trim();
    const ns: Node[] = [
      { id: 'center', type: 'center', position: { x: -64, y: -64 }, data: { label: t('map.center'), rtl }, draggable: false, selectable: false },
    ];
    const es: Edge[] = [];
    emotions.forEach((em, i) => {
      const a = -Math.PI / 2 + sign * ((i / n) * 2 * Math.PI);
      const count = counts[em.id] ?? 0;
      ns.push({
        id: em.id,
        type: 'emotion',
        position: { x: Math.cos(a) * R * 1.35 - 70, y: Math.sin(a) * R - 24 },
        data: { emotion: em, count, dim: Boolean(q) && count === 0, label: em.name[lang], rtl } satisfies EmotionData,
        draggable: false,
      });
      es.push({
        id: `e-${em.id}`,
        source: 'center',
        target: em.id,
        type: 'curved',
        style: { stroke: em.color, strokeWidth: 3, opacity: q && count === 0 ? 0.2 : 0.9 },
      });
    });
    return { nodes: ns, edges: es };
  }, [emotions, counts, lang, rtl, query, t]);

  const emotion = emotions.find((e) => e.id === selected) ?? null;
  const list = emotion ? entries.filter((e) => e.emotionIds.includes(emotion.id)) : [];

  const close = () => {
    setSelected(null);
    setOpenEntry(null);
  };

  return (
    <div className="relative h-[70vh] min-h-[420px] overflow-hidden rounded-xl2 border border-line bg-card/60" style={{ direction: 'ltr' }} data-testid="mindmap">
      <ReactFlow
        key={`${lang}`}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.3}
        maxZoom={1.8}
        nodesDraggable={false}
        nodesConnectable={false}
        colorMode={theme}
        onNodeClick={(_, node) => {
          if (node.id === 'center') return;
          setSelected(node.id);
          setOpenEntry(null);
        }}
        aria-label={t('map.title')}
      >
        <Background gap={28} color="rgb(var(--c-gold) / 0.25)" />
        <Controls showInteractive={false} />
      </ReactFlow>

      {emotion && (
        <aside
          dir={rtl ? 'rtl' : 'ltr'}
          className="absolute inset-x-0 bottom-0 z-10 max-h-[75%] overflow-y-auto rounded-t-xl2 border-t border-line bg-ivory p-4 shadow-soft sm:inset-y-0 sm:end-0 sm:start-auto sm:max-h-none sm:w-[26rem] sm:rounded-none sm:border-s sm:border-t-0"
          style={{ direction: rtl ? 'rtl' : 'ltr' }}
          aria-label={emotion.name[lang]}
          data-testid="map-panel"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-lg font-bold">{emotion.name[lang]} <span className="text-sm font-normal text-muted">({t('map.entries', { count: list.length })})</span></h3>
            <button type="button" onClick={close} className="grid h-11 w-11 place-items-center rounded-full hover:bg-line/50" aria-label={t('map.close')}>
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
          {openEntry ? (
            <>
              <button type="button" className="mb-3 text-sm font-semibold text-gold underline" onClick={() => setOpenEntry(null)}>
                ← {emotion.name[lang]}
              </button>
              <EntryCard entry={openEntry} emotions={emotions} accent={emotion.color} />
            </>
          ) : list.length === 0 ? (
            <p className="text-muted">{t('map.noEntries')}</p>
          ) : (
            <ul className="space-y-2">
              {list.map((e) => (
                <li key={e.id}>
                  <button type="button" onClick={() => setOpenEntry(e)} className="w-full rounded-2xl border border-line bg-card p-3 text-start hover:bg-line/40">
                    <span className="block text-xs font-semibold text-gold">{t(`entry.types.${e.type}`)} · {entryTitle(e, lang)}</span>
                    {e.arabic && <span lang="ar" dir="rtl" className="mt-1 line-clamp-2 block font-arabic text-lg">{e.arabic}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      )}
    </div>
  );
}
