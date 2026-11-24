/**
 * 云存档通用层：把任意 JSON blob 读写到 lumimaker-sdk。
 * SDK 本地开发自动 fallback 到内存存储（不走 localStorage），发布到平台自动走云。
 * 上层模块自己决定 blob 里放什么。
 */
import { sdk } from '@66rpg/lumimaker-sdk';

export interface CloudPayload {
  version: number;
  [key: string]: unknown;
}

function decodeText(buf: ArrayBuffer): string {
  return new TextDecoder('utf-8').decode(buf);
}

function encodeText(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/** 从 SDK 读 JSON blob，失败返回 null */
export async function readCloudBlob(): Promise<CloudPayload | null> {
  try {
    const raw = await sdk.readSave();
    if (!raw) return null;
    const text = decodeText(raw);
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object') return parsed as CloudPayload;
    return null;
  } catch {
    return null;
  }
}

/** 写 JSON blob 到 SDK */
export async function writeCloudBlob(blob: CloudPayload): Promise<void> {
  const text = JSON.stringify(blob);
  await sdk.writeSave(encodeText(text));
}
