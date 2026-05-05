export const SITE_DISPLAY_NAME_MAP = {
  MEGRINE: 'Siège Megrine',
  'MT 1 - MEGRINE': 'Siège Megrine',
  'MT 1 - MÉGRINE': 'Siège Megrine',
  'SIEGE MEGRINE': 'Siège Megrine',
  'SIEGE MÃ‰GRINE': 'Siège Megrine',
  'MEG001': 'Siège Megrine',
  'MEG-001': 'Siège Megrine',
  ELKHADHRA: 'SAV El Khadhra',
  'EL KHADHRA': 'SAV El Khadhra',
  'MT 2 - EL KHADHRA': 'SAV El Khadhra',
  'SAV EL KHADHRA': 'SAV El Khadhra',
  'ELK-002': 'SAV El Khadhra',
  NAASSEN: 'Parc Nassen',
  NAASSENN: 'Parc Nassen',
  NAASSEN001: 'Parc Nassen',
  NAASSEN003: 'Parc Nassen',
  NAASSENNAS003: 'Parc Nassen',
  NAASSENNAS: 'Parc Nassen',
  NASSEN: 'Parc Nassen',
  NAASSENNAS003MT3: 'Parc Nassen',
  'MT 3 - NAASSEN': 'Parc Nassen',
  'MT 3 - NASSEN': 'Parc Nassen',
  'PARC NAASSEN': 'Parc Nassen',
  'PARC NASSEN': 'Parc Nassen',
  'NAS-003': 'Parc Nassen',
  LAC: 'Showroom Lac',
  AZUR: 'Concept store Azur City',
  'AZUR CITY': 'Concept store Azur City',
  'BT 2 - AZUR CITY': 'Concept store Azur City',
  'CONCEPT STORE AZUR CITY': 'Concept store Azur City',
  'AZU-002': 'Concept store Azur City',
  CARTHAGE: 'Showroom Av. de Carthage',
  'AVENUE DE CARTHAGE': 'Showroom Av. de Carthage',
  'RUE DE CARTHAGE': 'Showroom Av. de Carthage',
  'AV. DE CARTHAGE': 'Showroom Av. de Carthage',
  'SHOWROOM AV. DE CARTHAGE': 'Showroom Av. de Carthage',
  'BT 3 - AVENUE DE CARTHAGE': 'Showroom Av. de Carthage',
  'CAR-003': 'Showroom Av. de Carthage',
  CHARGUEYAA: 'Showroom Charguia',
  CHARGUEYA: 'Showroom Charguia',
  CHAGUEYA: 'Showroom Charguia',
  CHARGUIA: 'Showroom Charguia',
  'BT 1 - SHOWROOM LAC': 'Showroom Lac',
  'BT 4 - CHARGUEYAA': 'Showroom Charguia',
  'BT 4 - CHARGUEYA': 'Showroom Charguia',
  'BT 4 - CHAGUEYA': 'Showroom Charguia',
  'BT 4 - SHOWROOM CHARGUIA': 'Showroom Charguia',
  'BT 4 - SHOWROOM CHARGUEIA': 'Showroom Charguia',
  'SHOWROOM LAC': 'Showroom Lac',
  'SHOWROOM CHARGUIA': 'Showroom Charguia',
  'SHOWROOM CHARGUEIA': 'Showroom Charguia',
  LAC001: 'Showroom Lac',
  CHG004: 'Showroom Charguia',
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
