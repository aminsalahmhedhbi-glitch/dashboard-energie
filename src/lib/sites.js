export const SITE_DISPLAY_NAME_MAP = {
  LAC: 'Showroom Lac',
  CHARGUEYAA: 'Showroom Chargueia',
  CHARGUEYA: 'Showroom Chargueia',
  CHAGUEYA: 'Showroom Chargueia',
  CHARGUIA: 'Showroom Chargueia',
  'BT 1 - SHOWROOM LAC': 'Showroom Lac',
  'BT 4 - CHARGUEYAA': 'Showroom Chargueia',
  'BT 4 - CHARGUEYA': 'Showroom Chargueia',
  'BT 4 - CHAGUEYA': 'Showroom Chargueia',
  'BT 4 - SHOWROOM CHARGUIA': 'Showroom Chargueia',
  'BT 4 - SHOWROOM CHARGUEIA': 'Showroom Chargueia',
  'SHOWROOM LAC': 'Showroom Lac',
  'SHOWROOM CHARGUIA': 'Showroom Chargueia',
  'SHOWROOM CHARGUEIA': 'Showroom Chargueia',
  LAC001: 'Showroom Lac',
  CHG004: 'Showroom Chargueia',
};

export function getSiteDisplayName(siteKeyOrName) {
  const raw = String(siteKeyOrName || '').trim();
  if (!raw) return raw;

  const directMatch = SITE_DISPLAY_NAME_MAP[raw];
  if (directMatch) return directMatch;

  const upperMatch = SITE_DISPLAY_NAME_MAP[raw.toUpperCase()];
  if (upperMatch) return upperMatch;

  const normalizedKey = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase();

  return SITE_DISPLAY_NAME_MAP[normalizedKey] || raw;
}
