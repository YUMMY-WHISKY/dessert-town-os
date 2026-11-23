export const ROOT_IDS = {
  COMPUTER: 'root_computer',
  DESKTOP: 'folder_desktop',
  DOCUMENTS: 'folder_documents',
  PICTURES: 'folder_pictures',
  DOWNLOADS: 'folder_downloads',
  TRASH: 'folder_trash',
  /** 邮件附件专用隐藏区，初始化时不显示，点击下载后 move 到 DOWNLOADS */
  HIDDEN: '__hidden__',
} as const;
