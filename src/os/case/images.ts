/**
 * 案件图片素材。全部本地化，避免运行时远程请求。
 */
import wallpaperUrl from '../../assets/images/desktop_wallpaper_1795267249765.jpg';
import avatarUrl from '../../assets/images/avatar_detective_shiba_1795267249619.jpg';
import boxUrl from '../../assets/images/evidence_star_box_1795267249767.jpg';
import boxInsideUrl from '../../assets/images/evidence_box_inside.jpg';
import sceneUrl from '../../assets/images/evidence_bakery_counter_1795267250504.jpg';
import wifiUrl from '../../assets/images/evidence_router_wifi.jpg';
import arleyPhotoUrl from '../../assets/images/photo_arley_1998.jpg';
import oldShopNowUrl from '../../assets/images/photo_old_shop_now.jpg';

export const IMG = {
  wallpaper: wallpaperUrl,
  avatar: avatarUrl,
  box: boxUrl,
  boxInside: boxInsideUrl,
  scene: sceneUrl,
  wifi: wifiUrl,
  arleyPhoto: arleyPhotoUrl,
  oldShopNow: oldShopNowUrl,
} as const;

/** 兼容旧引用 */
export const WALLPAPER_URL = IMG.wallpaper;
export const AVATAR_SHIBA_URL = IMG.avatar;
export const EVIDENCE_COUNTER_URL = IMG.scene;
export const EVIDENCE_BOX_URL = IMG.box;
