import { ROOT_IDS } from './seedData';
import { DeductionAnswer, DeductionResult, FSNode } from './types';

export function getChildren(nodes: FSNode[], parentId: string): FSNode[] {
  if (parentId === ROOT_IDS.TRASH) {
    return nodes.filter((node) => node.inTrash || node.parentId === ROOT_IDS.TRASH);
  }
  return nodes.filter((node) => node.parentId === parentId && !node.inTrash);
}

export function getNodeById(nodes: FSNode[], id: string): FSNode | undefined {
  return nodes.find((node) => node.id === id);
}

export function getBreadcrumb(nodes: FSNode[], folderId: string): FSNode[] {
  const trail: FSNode[] = [];
  let current = getNodeById(nodes, folderId);
  const visited = new Set<string>();

  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    trail.unshift(current);
    current = current.parentId ? getNodeById(nodes, current.parentId) : undefined;
  }
  return trail;
}

export function searchNodes(nodes: FSNode[], rawQuery: string): FSNode[] {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return [];
  return nodes.filter((node) => {
    if (node.parentId === null) return false;
    const nameMatch = node.name.toLowerCase().includes(query);
    const contentMatch =
      !node.locked && node.content ? node.content.toLowerCase().includes(query) : false;
    return nameMatch || contentMatch;
  });
}

export function createFile(
  nodes: FSNode[],
  parentId: string,
  name: string,
  content: string,
  nowLabel = '2026-11-21 15:10'
): { nodes: FSNode[]; created: FSNode } {
  const safeName = name.trim() || '新建笔记.txt';
  const finalName = safeName.endsWith('.txt') ? safeName : `${safeName}.txt`;
  const created: FSNode = {
    id: `file_user_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: finalName,
    type: 'text',
    parentId,
    content,
    sizeLabel: `${Math.max(0.2, (content.length * 2) / 1024).toFixed(1)} KB`,
    modifiedAt: nowLabel,
  };
  return {
    nodes: [...nodes, created],
    created,
  };
}

export function createFolder(
  nodes: FSNode[],
  parentId: string,
  name: string,
  nowLabel = '2026-11-21 15:10'
): { nodes: FSNode[]; created: FSNode } {
  const safeName = name.trim() || '新建文件夹';
  const created: FSNode = {
    id: `folder_user_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: safeName,
    type: 'folder',
    parentId,
    sizeLabel: '--',
    modifiedAt: nowLabel,
  };
  return {
    nodes: [...nodes, created],
    created,
  };
}

export function updateFileContent(
  nodes: FSNode[],
  fileId: string,
  content: string,
  nowLabel = '2026-11-21 15:12'
): FSNode[] {
  return nodes.map((node) =>
    node.id === fileId
      ? {
          ...node,
          content,
          sizeLabel: `${Math.max(0.2, (content.length * 2) / 1024).toFixed(1)} KB`,
          modifiedAt: nowLabel,
        }
      : node
  );
}

export function renameNode(nodes: FSNode[], nodeId: string, newName: string): FSNode[] {
  const trimmed = newName.trim();
  if (!trimmed) return nodes;
  return nodes.map((node) => (node.id === nodeId ? { ...node, name: trimmed } : node));
}

export function moveToTrash(nodes: FSNode[], nodeId: string): FSNode[] {
  const target = getNodeById(nodes, nodeId);
  if (!target || target.parentId === null || target.id === ROOT_IDS.TRASH) return nodes;
  // Prevent deleting top-level system folders
  const systemFolders: string[] = [
    ROOT_IDS.COMPUTER,
    ROOT_IDS.DESKTOP,
    ROOT_IDS.DOCUMENTS,
    ROOT_IDS.PICTURES,
    ROOT_IDS.DOWNLOADS,
    ROOT_IDS.TRASH,
  ];
  if (systemFolders.includes(target.id)) return nodes;

  return nodes.map((node) =>
    node.id === nodeId
      ? {
          ...node,
          originalParentId: node.inTrash ? node.originalParentId : node.parentId,
          parentId: ROOT_IDS.TRASH,
          inTrash: true,
        }
      : node
  );
}

export function restoreFromTrash(nodes: FSNode[], nodeId: string): FSNode[] {
  return nodes.map((node) => {
    if (node.id !== nodeId || !node.inTrash) return node;
    const targetParent = node.originalParentId || ROOT_IDS.DOCUMENTS;
    return {
      ...node,
      parentId: targetParent,
      inTrash: false,
    };
  });
}

export function permanentDelete(nodes: FSNode[], nodeId: string): FSNode[] {
  return nodes.filter((node) => node.id !== nodeId);
}

export function unlockNode(
  nodes: FSNode[],
  nodeId: string,
  passcode: string
): { success: boolean; nodes: FSNode[] } {
  const target = getNodeById(nodes, nodeId);
  if (!target) return { success: false, nodes };
  if (!target.locked) return { success: true, nodes };

  if (target.passcode === passcode.trim()) {
    return {
      success: true,
      nodes: nodes.map((node) => (node.id === nodeId ? { ...node, locked: false } : node)),
    };
  }
  return { success: false, nodes };
}

export function evaluateDeduction(
  answer: DeductionAnswer,
  discoveredCluesCount: number,
  totalCluesCount: number
): DeductionResult {
  if (!answer.suspect || !answer.timeWindow || !answer.evidence) {
    return {
      solved: false,
      score: 0,
      feedback: '请先选齐「嫌疑人」「作案时间」和「关键物证」三项再提交推理哦！',
    };
  }

  const suspectOk = answer.suspect === '黑猫咖啡馆老板 布莱克';
  const timeOk = answer.timeWindow === '14:00 ~ 14:30 (大库房遭潜入时段)';
  const evidenceOk = answer.evidence === '授权保证金转账单与黑糖鞋印';

  if (suspectOk && timeOk && evidenceOk) {
    const clueBonus = Math.round((discoveredCluesCount / Math.max(1, totalCluesCount)) * 40);
    return {
      solved: true,
      score: 60 + clueBonus,
      feedback:
        '推理完全正确！在 14:00~14:30 间黑猫咖啡馆老板布莱克进店走向柜台。被删除的 100000 甜心币转账单与黑糖泥鞋印彻底粉碎了他的不在场谎言！',
    };
  }

  const wrongParts: string[] = [];
  if (!suspectOk) wrongParts.push('嫌疑人');
  if (!timeOk) wrongParts.push('作案时间');
  if (!evidenceOk) wrongParts.push('关键物证');

  return {
    solved: false,
    score: 0,
    feedback: `推理还差一点！其中「${wrongParts.join('、')}」与电脑里的证据有矛盾，再去信箱、回收站和照片里核对一下吧。`,
  };
}
