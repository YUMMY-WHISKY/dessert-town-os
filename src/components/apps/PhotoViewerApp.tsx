import React, { useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Search,
  CheckCircle2,
  Image as ImageIcon,
  ArrowLeft,
} from 'lucide-react';
import { FSNode, PhotoHotspot } from '../../os/types';
import { soundEngine } from '../../os/sound';

interface PhotoViewerAppProps {
  nodes: FSNode[];
  activeFileId?: string;
  chapter: number;
  discoveredClues: string[];
  onDiscoverClue: (clueId: string) => void;
  onFlag: (flag: string) => void;
}

/** 哪些 hotspot action 会打开哪个内部图层 */
const LAYER_ACTION_MAP: Record<string, string> = {
  'open-box-inside': 'file_photo_box_inside',
};

export const PhotoViewerApp: React.FC<PhotoViewerAppProps> = ({
  nodes,
  activeFileId,
  chapter,
  discoveredClues,
  onDiscoverClue,
  onFlag,
}) => {
  const allImageFiles = nodes.filter(
    (n) => n.type === 'image' && !n.inTrash && !n.hiddenFromSidebar
  );
  const [selectedId, setSelectedId] = useState(
    activeFileId && allImageFiles.some((f) => f.id === activeFileId)
      ? activeFileId
      : allImageFiles[0]?.id ?? ''
  );
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [inspectedHotspot, setInspectedHotspot] = useState<PhotoHotspot | null>(null);
  const [imgError, setImgError] = useState(false);
  /** 覆盖层：点击铜锁后打开的内部图 */
  const [layerOver, setLayerOver] = useState<FSNode | null>(null);

  const currentImage =
    layerOver ??
    nodes.find((n) => n.id === selectedId && !n.inTrash) ??
    allImageFiles[0];

  // 点击铜锁 → 底部面板显示 detail + "打开盒盖"按钮，而不是直接开 layer
  const handleInspectHotspot = (hs: PhotoHotspot) => {
    setInspectedHotspot(hs);
    soundEngine.playClueFound();
    if (hs.clueId) onDiscoverClue(hs.clueId);
    if (hs.id === 'hs_wifi_all' || hs.id === 'hs_wifi_poppy') {
      onFlag('zoom_poppy_phone');
    }
  };

  /** 点击 "打开盒盖查看内部" → 真正切到内部图 */
  const openLayer = (hs: PhotoHotspot) => {
    const targetId = LAYER_ACTION_MAP[hs.action ?? ''];
    if (!targetId) return;
    const target = nodes.find((n) => n.id === targetId);
    if (!target) return;
    soundEngine.playClueFound();
    setLayerOver(target);
    setInspectedHotspot(null);
    setImgError(false);
  };

  const closeLayer = () => {
    setLayerOver(null);
    setInspectedHotspot(null);
    setImgError(false);
  };

  const handleSelectPhoto = (id: string) => {
    setSelectedId(id);
    setZoom(1);
    setRotation(0);
    setInspectedHotspot(null);
    setLayerOver(null);
    setImgError(false);
  };

  // 内部图层强制 100% 缩放（小图，不需要放大）
  const effectiveZoom = layerOver ? Math.max(1, zoom) : zoom;

  const visibleHotspots = (currentImage?.hotspots ?? []).filter((hs) => {
    if ((hs.minZoom ?? 0) > effectiveZoom) return false;
    if ((hs.minChapter ?? 1) > chapter) return false;
    if (hs.requiresHotspotId) {
      const dependency = (currentImage?.hotspots ?? []).find(
        (d) => d.id === hs.requiresHotspotId
      );
      if (dependency?.clueId && !discoveredClues.includes(dependency.clueId)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#FFFDF7]">
      {/* 工具条 */}
      <div className="px-3 py-2 bg-[#F6EFE2] border-b-2 border-[#3A2D28] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {allImageFiles.map((img) => (
            <button
              key={img.id}
              type="button"
              onClick={() => handleSelectPhoto(img.id)}
              className={`px-2.5 py-1 rounded-lg border-2 border-[#3A2D28] text-[11px] font-bold whitespace-nowrap transition-colors ${
                img.id === selectedId && !layerOver
                  ? 'bg-[#BAE6FD] text-[#3A2D28]'
                  : 'bg-[#FFFDF7] text-[#6E5A52] hover:bg-[#FFF8EB]'
              }`}
            >
              {img.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {layerOver ? (
            <button
              type="button"
              onClick={closeLayer}
              aria-label="返回外部"
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#BAE6FD] border-2 border-[#3A2D28] text-[11px] font-bold text-[#3A2D28]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              返回外部
            </button>
          ) : null}
        </div>
      </div>

      {/* 画布 */}
      <div className="relative flex-1 min-h-0">
        <div className="absolute inset-0 overflow-auto cartoon-scroll bg-[#EFE6D5] p-3 flex flex-col items-center justify-start">
          {!currentImage ? (
            <p className="text-sm text-[#6E5A52] mt-10">图片文件夹中暂无照片</p>
          ) : (
          <div
            style={{
              transform: `scale(${effectiveZoom}) rotate(${rotation}deg)`,
              transition: 'transform 160ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            className={`relative max-w-[500px] w-full rounded-2xl border-[2.5px] border-[#3A2D28] shadow-[4px_4px_0_#3A2D28] overflow-hidden bg-[#FFFDF7] ${
              layerOver ? 'ring-4 ring-[#FFB830] ring-offset-2 ring-offset-[#EFE6D5]' : ''
            }`}
          >
            {imgError || !currentImage.imageUrl ? (
              <div className="aspect-[4/3] w-full bg-[#F6EFE2] flex flex-col items-center justify-center p-6 text-center">
                <ImageIcon className="w-9 h-9 text-[#6E5A52] mb-2" />
                <p className="text-sm font-bold text-[#3A2D28]">{currentImage.name}</p>
              </div>
            ) : (
              <img
                src={currentImage.imageUrl}
                alt={currentImage.name}
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="w-full h-auto block select-none"
              />
            )}

            {/* 图层标记 */}
            {layerOver ? (
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#FFB830] border-2 border-[#3A2D28] text-[10px] font-black text-[#3A2D28] shadow-[1px_1px_0_#3A2D28]">
                🔍 内部视角
              </div>
            ) : null}

            {visibleHotspots.map((hs) => {
              const found = hs.clueId ? discoveredClues.includes(hs.clueId) : false;
              return (
                <button
                  key={hs.id}
                  type="button"
                  onClick={() => handleInspectHotspot(hs)}
                  aria-label={`检查：${hs.label}`}
                  style={{ left: `${hs.xPercent}%`, top: `${hs.yPercent}%` }}
                  className={`-translate-x-1/2 -translate-y-1/2 absolute px-2 py-0.5 rounded-lg border-2 border-[#3A2D28] shadow-[2px_2px_0_#3A2D28] text-[10px] font-bold flex items-center gap-1 whitespace-nowrap transition-transform hover:scale-105 ${
                    found ? 'bg-[#A7F3D0] text-[#3A2D28]' : 'bg-[#FFB830] text-[#3A2D28]'
                  }`}
                >
                  {found ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <Search className="w-3 h-3" />
                  )}
                  <span>{hs.label}</span>
                </button>
              );
            })}
          </div>
        )}
        </div>

        {/* 右侧缩放/旋转工具 */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-1 rounded-xl bg-[#FFFDF7]/95 border-2 border-[#3A2D28] p-1.5 shadow-[2px_2px_0_#3A2D28]">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(2.25, +(z + 0.25).toFixed(2)))}
            aria-label="放大"
            className="w-7 h-7 rounded-lg bg-[#FFFDF7] border-2 border-[#3A2D28] flex items-center justify-center hover:bg-[#FEF3C7]"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-bold font-mono-tabular w-9 text-center">
            {Math.round(effectiveZoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.75, +(z - 0.25).toFixed(2)))}
            aria-label="缩小"
            className="w-7 h-7 rounded-lg bg-[#FFFDF7] border-2 border-[#3A2D28] flex items-center justify-center hover:bg-[#FEF3C7]"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setRotation((r) => (r + 90) % 360)}
            aria-label="旋转照片"
            className="w-7 h-7 rounded-lg bg-[#FFFDF7] border-2 border-[#3A2D28] flex items-center justify-center hover:bg-[#FEF3C7]"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 状态条 */}
      <div className="px-4 py-2 bg-[#FFFDF7] border-t-2 border-[#3A2D28] min-h-[64px] flex items-center gap-3">
        {inspectedHotspot ? (
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs font-black text-[#3A2D28]">
                放大镜观察 · {inspectedHotspot.label}
              </p>
              {inspectedHotspot.action === 'open-box-inside' ? (
                <button
                  type="button"
                  onClick={() => openLayer(inspectedHotspot)}
                  className="px-2 py-0.5 rounded-lg bg-[#FFE29A] border-2 border-[#3A2D28] text-[11px] font-black text-[#3A2D28] hover:bg-[#FFB830]"
                >
                  🔓 打开盒盖查看内部 →
                </button>
              ) : null}
            </div>
            <p className="text-[11px] text-[#6E5A52] whitespace-pre-line leading-relaxed">
              {inspectedHotspot.detail}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
};
