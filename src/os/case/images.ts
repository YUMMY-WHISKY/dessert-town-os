/**
 * 案件图片素材。
 * 头像与壁纸为项目原有素材；现场、木盒、金库抽屉、旧报纸为卡通描边风格生成图。
 */
import wallpaperUrl from '../../assets/images/desktop_wallpaper_1795267249765.jpg';
import avatarUrl from '../../assets/images/avatar_detective_shiba_1795267249619.jpg';
import boxUrl from '../../assets/images/evidence_star_box_1795267249767.jpg';
import boxInsideUrl from '../../assets/images/evidence_box_inside.jpg';
import sceneUrl from '../../assets/images/evidence_bakery_counter_1795267250504.jpg';

const T2I = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image';

export const IMG = {
  wallpaper: wallpaperUrl,
  avatar: avatarUrl,
  box: boxUrl,
  // 木盒内部俯视：盒盖已打开，盒底空无一物，中心有纸张压痕
  boxInside: boxInsideUrl,
  // 案发现场柜台：牛奶打翻、盆栽被挪到地上、抽屉拉开、地垫歪斜
  scene: sceneUrl,
  // 被整只拆走的金库抽屉
  vaultDrawer: `${T2I}?prompt=${encodeURIComponent(
    'cute cartoon storybook illustration, opened empty iron vault drawer on a pastel bakery floor, brass keyhole with a few orange cat hairs, soft warm light, thick dark outlines, flat colors, children picture book style, no people'
  )}&image_size=landscape_4_3`,
  // 二十年前的旧报纸
  oldNewspaper: `${T2I}?prompt=${encodeURIComponent(
    'cute cartoon storybook illustration, old yellowed newspaper front page about a town fire twenty years ago, ink smudges, red archive stamp, lying on a wooden desk, thick dark outlines, sepia and pastel colors, children picture book style'
  )}&image_size=landscape_4_3`,
  // 路由器后台截图：三行设备连接记录
  wifi: `${T2I}?prompt=${encodeURIComponent(
    'cute cartoon storybook illustration, computer router admin dashboard screenshot on a pastel screen, three rows of device connection log, green signal bars, small clock icons, warm cream and blue UI colors, thick dark outlines, flat colors, children picture book style, fake UI text'
  )}&image_size=landscape_4_3`,
  // 1998 年开业老照片：阿栗与小波比
  arleyPhoto: `${T2I}?prompt=${encodeURIComponent(
    'cute cartoon storybook illustration, warm old photograph of a tiny bakery opening day in 1998, a kind middle-aged cat mother in apron holding a tray of egg tarts behind the counter, a seven-year-old kitten sitting on the counter eating a tart and holding a small wooden sign, sepia and cream tones, slightly faded photo corners, thick dark outlines, children picture book style'
  )}&image_size=landscape_4_3`,
  // 老街 7 号现状
  oldShopNow: `${T2I}?prompt=${encodeURIComponent(
    'cute cartoon storybook illustration, abandoned old bakery storefront on an old street in autumn, empty door frame with two nail holes where a sign used to be, new electrical box on the back wall, one patch of fresher cement on the wall, overgrown weeds, muted warm colors, thick dark outlines, children picture book style, no people'
  )}&image_size=landscape_4_3`,
} as const;

/** 兼容旧引用 */
export const WALLPAPER_URL = IMG.wallpaper;
export const AVATAR_SHIBA_URL = IMG.avatar;
export const EVIDENCE_COUNTER_URL = IMG.scene;
export const EVIDENCE_BOX_URL = IMG.box;
