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

/**
 * 串行化「读 blob → 局部修改 → 写回」这类事务。
 * 成就、手动存档、自动快照共用同一个云存档槽，并发读改写会互相覆盖。
 */
let saveChain: Promise<unknown> = Promise.resolve();

export function withSaveLock<T>(job: () => Promise<T>): Promise<T> {
  const run = saveChain.then(job, job);
  saveChain = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}
