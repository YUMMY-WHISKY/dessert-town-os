import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createFile,
  createFolder,
  evaluateDeduction,
  getBreadcrumb,
  getChildren,
  moveToTrash,
  renameNode,
  restoreFromTrash,
  searchNodes,
  unlockNode,
  updateFileContent,
} from './filesystem';
import { INITIAL_FS_NODES, ROOT_IDS } from './seedData';

test('getChildren returns documents and excludes trash items', () => {
  const docs = getChildren(INITIAL_FS_NODES, ROOT_IDS.DOCUMENTS);
  assert.ok(docs.some((n) => n.id === 'file_work_log'));
  assert.ok(!docs.some((n) => n.id === 'file_deleted_transfer'));

  const trash = getChildren(INITIAL_FS_NODES, ROOT_IDS.TRASH);
  assert.equal(trash.length, 2);
  assert.ok(trash.some((n) => n.id === 'file_deleted_transfer'));
});

test('getBreadcrumb resolves full folder path back to computer root', () => {
  const trail = getBreadcrumb(INITIAL_FS_NODES, ROOT_IDS.PICTURES);
  assert.deepEqual(
    trail.map((n) => n.id),
    [ROOT_IDS.COMPUTER, ROOT_IDS.PICTURES]
  );
});

test('moveToTrash and restoreFromTrash round-trip a file cleanly', () => {
  const afterDelete = moveToTrash(INITIAL_FS_NODES, 'file_work_log');
  assert.ok(!getChildren(afterDelete, ROOT_IDS.DOCUMENTS).some((n) => n.id === 'file_work_log'));
  assert.ok(getChildren(afterDelete, ROOT_IDS.TRASH).some((n) => n.id === 'file_work_log'));

  const afterRestore = restoreFromTrash(afterDelete, 'file_work_log');
  assert.ok(getChildren(afterRestore, ROOT_IDS.DOCUMENTS).some((n) => n.id === 'file_work_log'));
  assert.ok(!getChildren(afterRestore, ROOT_IDS.TRASH).some((n) => n.id === 'file_work_log'));

  // Restoring seeded deleted transfer moves it into documents
  const restoredTransfer = restoreFromTrash(INITIAL_FS_NODES, 'file_deleted_transfer');
  assert.ok(
    getChildren(restoredTransfer, ROOT_IDS.DOCUMENTS).some((n) => n.id === 'file_deleted_transfer')
  );
});

test('searchNodes finds unlocked content and ignores locked content', () => {
  const publicMatches = searchNodes(INITIAL_FS_NODES, '排班');
  assert.ok(publicMatches.some((n) => n.id === 'file_shift_table'));

  // "皮鞋泥印" only exists inside locked file_encrypted_ledger
  const secretMatches = searchNodes(INITIAL_FS_NODES, '皮鞋泥印');
  assert.equal(secretMatches.length, 0);
});

test('unlockNode validates passcode and reveals content to search', () => {
  const badAttempt = unlockNode(INITIAL_FS_NODES, 'file_encrypted_ledger', '9999');
  assert.equal(badAttempt.success, false);

  const goodAttempt = unlockNode(INITIAL_FS_NODES, 'file_encrypted_ledger', '0715');
  assert.equal(goodAttempt.success, true);

  const unlockedSearch = searchNodes(goodAttempt.nodes, '皮鞋泥印');
  assert.ok(unlockedSearch.some((n) => n.id === 'file_encrypted_ledger'));
});

test('createFile, updateFileContent, createFolder, and renameNode mutate state immutably', () => {
  const { nodes: withFolder, created: folder } = createFolder(
    INITIAL_FS_NODES,
    ROOT_IDS.DOCUMENTS,
    '侦探线索'
  );
  assert.equal(folder.name, '侦探线索');

  const { nodes: withFile, created: file } = createFile(withFolder, folder.id, '笔记', '初始内容');
  assert.equal(file.name, '笔记.txt');

  const updated = updateFileContent(withFile, file.id, '更新后的线索');
  assert.equal(updated.find((n) => n.id === file.id)?.content, '更新后的线索');

  const renamed = renameNode(updated, file.id, '关键笔记.txt');
  assert.equal(renamed.find((n) => n.id === file.id)?.name, '关键笔记.txt');
});

test('evaluateDeduction grades incomplete, wrong, and solved answers', () => {
  const incomplete = evaluateDeduction({ suspect: '', timeWindow: '', evidence: '' }, 2, 6);
  assert.equal(incomplete.solved, false);

  const wrong = evaluateDeduction(
    {
      suspect: '学徒米露',
      timeWindow: '14:00 ~ 14:30 (大库房遭潜入时段)',
      evidence: '授权保证金转账单与黑糖鞋印',
    },
    5,
    8
  );
  assert.equal(wrong.solved, false);
  assert.ok(wrong.feedback.includes('嫌疑人'));

  const correct = evaluateDeduction(
    {
      suspect: '黑猫咖啡馆老板 布莱克',
      timeWindow: '14:00 ~ 14:30 (大库房遭潜入时段)',
      evidence: '授权保证金转账单与黑糖鞋印',
    },
    8,
    8
  );
  assert.equal(correct.solved, true);
  assert.equal(correct.score, 100);
});
