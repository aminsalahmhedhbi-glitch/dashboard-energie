
import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Briefcase,
  Building2,
  CheckCircle2,
  Cpu,
  Download,
  Edit2,
  Factory,
  FileText,
  FolderOpen,
  Globe,
  Landmark,
  Leaf,
  MapPin,
  Plus,
  Scale,
  ScanLine,
  Shield,
  ShieldCheck,
  Target,
  Trash2,
  TrendingUp,
  Upload,
  Users,
  X,
  Zap,
} from 'lucide-react';
import HeaderInfoDisplay from '../../components/layout/HeaderInfoDisplay';
import ModuleHeader from '../../components/layout/ModuleHeader';
import { resolveUpdater, useModuleState } from '../../hooks/useModuleState';
import politiqueSignature from '../../assets/politique-signature.png';

const INITIAL_PESTEL = {
  Politique: [{ id: 1, text: 'Reglementations etatiques importation', energy: false }],
  Economique: [
    { id: 2, text: 'Fluctuation taux de change', energy: false },
    { id: 3, text: "Augmentation du cout de l'energie", energy: true },
  ],
  Societal: [{ id: 4, text: 'Demande de vehicules propres', energy: true }],
  Technologique: [
    { id: 5, text: 'Diagnostic complexe (Hybride/Elec)', energy: false },
    { id: 6, text: 'Outils de telereleve energie', energy: true },
  ],
  Environnemental: [
    { id: 7, text: 'Gestion dechets dangereux', energy: false },
    { id: 8, text: 'Transition energetique nationale', energy: true },
  ],
  Legal: [
    { id: 9, text: 'Normes securite au travail', energy: false },
    { id: 10, text: "Loi maitrise de l'energie", energy: true },
  ],
};

const INITIAL_SWOT = {
  Forces: [
    { id: 1, text: 'Notoriete de la marque', energy: false },
    { id: 2, text: 'Equipe SAV formee', energy: false },
  ],
  Faiblesses: [{ id: 3, text: 'Forte conso. elec (ponts, air comprime)', energy: true }],
  Opportunites: [{ id: 4, text: 'Subventions FNME pour audits', energy: true }],
  Menaces: [{ id: 5, text: 'Hausses tarifaires STEG', energy: true }],
};

const INITIAL_ENJEUX = {
  Internes: [
    { id: 1, text: "Optimisation de l'air comprime", energy: true },
    { id: 2, text: 'Fidelisation collaborateurs', energy: false },
  ],
  Externes: [
    { id: 3, text: 'Conformite ISO 50001', energy: true },
    { id: 4, text: 'Satisfaction client cible', energy: false },
  ],
};

const INITIAL_STAKEHOLDERS = [
  {
    nom: 'Etat / ANME',
    impact: true,
    attentes: [
      {
        id: 1,
        num: 'A01',
        desc: "Respect des lois d'efficacite energetique",
        resp: 'Dir. QSE',
        pert: 'Haute',
        surv: 'Veille legale',
        freq: 'Trimestrielle',
      },
      {
        id: 2,
        num: 'A02',
        desc: 'Declaration des consommations',
        resp: 'RME',
        pert: 'Haute',
        surv: 'Portail ANME',
        freq: 'Annuelle',
      },
    ],
  },
  {
    nom: 'STEG',
    impact: true,
    attentes: [
      {
        id: 3,
        num: 'A03',
        desc: 'Paiement factures a temps',
        resp: 'Finances',
        pert: 'Moyenne',
        surv: 'Suivi compta',
        freq: 'Mensuelle',
      },
      {
        id: 4,
        num: 'A04',
        desc: 'Respect puissance souscrite & Cos Phi',
        resp: 'Maint.',
        pert: 'Haute',
        surv: 'Analyse factures',
        freq: 'Mensuelle',
      },
    ],
  },
  {
    nom: 'Employes',
    impact: true,
    attentes: [
      {
        id: 5,
        num: 'A05',
        desc: 'Formation continue et confort',
        resp: 'DRH',
        pert: 'Moyenne',
        surv: 'Plan formation',
        freq: 'Semestrielle',
      },
    ],
  },
];

const INITIAL_PERIMETRE = {
  identiteJuridique: {
    entreprise: 'ITALCAR',
    formeJuridique: 'SA (3 000 000 DT)',
    effectif: '99 employes',
  },
  domainePrincipal: 'Representation materiel de transport',
  domainesActivite: [
    { id: 101, text: 'Representation materiel de transport' },
    { id: 102, text: 'Commercialisation de vehicules neufs et pieces de rechange' },
    { id: 103, text: 'Reparation des vehicules de marques representees' },
  ],
  marques: [
    { id: 201, text: 'FIAT' },
    { id: 202, text: 'FIAT PRO' },
    { id: 203, text: 'IVECO' },
    { id: 204, text: 'ALFA ROMEO' },
    { id: 205, text: 'JEEP' },
    { id: 206, text: 'CHANGAN' },
    { id: 207, text: 'JMC' },
    { id: 208, text: 'DEEPAL' },
  ],
  reseau: {
    propre: [
      { id: 301, text: 'Siege / Showroom Megrine' },
      { id: 302, text: 'Showroom les Berges du Lac' },
      { id: 303, text: 'Concept Store Italcar Azur City' },
      { id: 304, text: 'Service apres-vente sites Megrine & Cite el Khadhra' },
      { id: 305, text: 'Parc Naassen' },
    ],
    sousConcessionnaires: [
      { id: 401, nom: 'Auto Service', ville: 'Sousse' },
      { id: 402, nom: 'Sud Auto', ville: 'Sfax' },
      { id: 403, nom: 'Cap Bon Motors', ville: 'Nabeul' },
    ],
  },
  activites: [
    { id: 1, text: 'Commercialisation des vehicules neufs et des pieces de rechange' },
    { id: 2, text: 'Reparation des vehicules de marques representees' },
  ],
  sites: [
    { id: 1, text: 'Showroom Megrine' },
    { id: 2, text: 'Showroom les Berges du Lac' },
    { id: 3, text: 'Service apres-vente sites Megrine & Cite el Khadhra' },
    { id: 4, text: 'Parc Naassen' },
  ],
  ues: [
    { id: 1, text: 'Eclairage', energy: true },
    { id: 2, text: 'Climatisation / Chauffage', energy: true },
    { id: 3, text: 'Air comprime', energy: true },
  ],
  abreviations: [
    { id: 501, court: 'QSE', long: 'Qualite, Securite, Environnement' },
    { id: 502, court: 'VN', long: 'Vehicules Neufs' },
    { id: 503, court: 'PDR', long: 'Pieces De Rechange' },
    { id: 504, court: 'SAV', long: 'Service Apres-Vente' },
    { id: 505, court: 'PI', long: 'Parties Interessees' },
  ],
  contexte: [
    { id: 601, text: 'Croissance du marche automobile en Tunisie.' },
    { id: 602, text: 'Transition vers des vehicules plus ecologiques.' },
    { id: 603, text: 'Renforcement des partenariats avec les marques internationales.' },
  ],
  environnement: [
    { id: 701, text: 'Reglementations douanieres et fiscales strictes.' },
    { id: 702, text: 'Concurrence accrue sur le segment des vehicules utilitaires.' },
    { id: 703, text: 'Opportunites de digitalisation du parcours client.' },
  ],
  qualiteScope: {
    activites: [
      'La vente & le Service Apres-Vente des vehicules particuliers et industriels.',
      'La Vente des PDR et des lubrifiants',
    ],
    exclusions:
      'La conception des amenagements ou de montage de superstructures (carrosserie) sur les vehicules vendus par ITALCAR est externalisee chez nos carrossiers.',
  },
  energieScope: {
    activites: ["Le systeme de gestion de l'energie couvre les utilites et equipements energetiques."],
  },
};

const INITIAL_CARTOGRAPHIE = {
  processus: [
    { id: 1, nom: 'PILOTAGE ENTREPRISE', type: 'pilotage', x: 560, y: 70, w: 640 },
    { id: 2, nom: 'MARKETING', type: 'pilotage', x: 560, y: 155, w: 280 },
    { id: 3, nom: 'COMMANDE VN', type: 'realisation', x: 300, y: 255, w: 180 },
    { id: 4, nom: 'VENTE VN', type: 'realisation', x: 560, y: 255, w: 180 },
    { id: 5, nom: 'LIVRAISON', type: 'realisation', x: 820, y: 255, w: 180 },
    { id: 6, nom: 'ANIMATION RESEAU', type: 'realisation', x: 560, y: 350, w: 320 },
    { id: 7, nom: 'ACHAT PDR', type: 'realisation', x: 350, y: 445, w: 180 },
    { id: 8, nom: 'VENTE PDR', type: 'realisation', x: 560, y: 445, w: 180 },
    { id: 9, nom: 'SERVICE APRES VENTE', type: 'realisation', x: 710, y: 540, w: 360 },
    { id: 10, nom: 'Gestion des competences', type: 'support', x: 220, y: 635, w: 180 },
    { id: 11, nom: 'Achats locaux', type: 'support', x: 430, y: 635, w: 170 },
    { id: 12, nom: 'Maintenance et nouveaux projets', type: 'support', x: 665, y: 635, w: 240 },
    { id: 13, nom: "Systeme d'information", type: 'support', x: 920, y: 635, w: 180 },
  ],
  connexions: [
    { id: 'c1', from: 'exigences', to: 3 },
    { id: 'c2', from: 'exigences', to: 9 },
    { id: 'c3', from: 2, to: 4 },
    { id: 'c4', from: 3, to: 4 },
    { id: 'c5', from: 4, to: 5 },
    { id: 'c6', from: 3, to: 7 },
    { id: 'c7', from: 6, to: 3 },
    { id: 'c8', from: 6, to: 4 },
    { id: 'c9', from: 6, to: 5 },
    { id: 'c10', from: 7, to: 8 },
    { id: 'c11', from: 8, to: 9 },
    { id: 'c12', from: 6, to: 8 },
    { id: 'c13', from: 9, to: 5 },
    { id: 'c14', from: 5, to: 'satisfaction' },
    { id: 'c15', from: 9, to: 'satisfaction' },
  ],
};

const INITIAL_AXES = [
  { id: 1, text: 'Developper nos parts de marche sur tous les segments', energy: false },
  {
    id: 2,
    text: 'Ameliorer en continu la qualite de nos prestations et la satisfaction',
    energy: false,
  },
  {
    id: 3,
    text: 'Developper et animer notre reseau des sous concessionnaires',
    energy: false,
  },
  { id: 4, text: 'Respecter nos engagements envers nos partenaires', energy: false },
  { id: 5, text: "Developper le systeme d'information de l'entreprise", energy: false },
  { id: 6, text: 'Veiller au deploiement du standard du constructeur', energy: false },
  { id: 7, text: 'Developper les competences des ressources humaines', energy: false },
  { id: 8, text: 'Assurer une gestion efficace des infrastructures', energy: false },
  {
    id: 9,
    text: "Viser une reduction de 5% du ratio energetique global d'ici 2025",
    energy: true,
  },
  {
    id: 10,
    text: "Garantir 50% d'energie renouvelable d'ici 2030 (Photovoltaique)",
    energy: true,
  },
  {
    id: 11,
    text: "Piloter l'organisation a travers le SMQEn (implication du personnel)",
    energy: true,
  },
];

const INITIAL_DOCUMENTS = [
  {
    id: 1,
    date: '14/04/2026',
    nom: 'Manuel de Management Integre',
    code: 'MAN-01',
    type: 'Manuel',
    indice: '02',
    site: 'Tous sites',
    fileType: 'pdf',
  },
  {
    id: 2,
    date: '10/04/2026',
    nom: 'Fiche Fonction : Responsable Energie',
    code: 'FF-RME',
    type: 'Fiche fonction',
    indice: '01',
    site: 'Siege Megrine',
    fileType: 'word',
  },
];

const INITIAL_POLITIQUE_INTRO = {
  lead: "ITALCAR s'engage a etablir et a maintenir un systeme de management de la Qualite & Energie conforme aux exigences ISO 9001 et ISO 50001.",
  body: "ITALCAR aspire a etre parmi les leaders du marche, et s'engage a ameliorer son efficacite energetique pour favoriser le developpement durable. Afin de developper en continu nos performances, notre politique qualite & energie repose sur les axes strategiques suivants :",
};

const INITIAL_SECTION_META = {
  pestel: { date: '2026-04-29', reference: 'CH 4.1' },
  swot: { date: '2026-04-29', reference: 'CH 4.1' },
  enjeux: { date: '2026-04-29', reference: 'CH 4.1' },
  parties: { date: '2026-04-29', reference: 'CH 4.2' },
  perimetre: { date: '2026-04-29', reference: 'CH 4.3' },
  cartographie: { date: '2026-04-29', reference: 'CH 4.4' },
  politique: { date: '2026-04-29', reference: 'CH 5.2' },
  documents: { date: '2026-04-29', reference: 'CH 7.5' },
};

const INITIAL_MODULE_STATE = {
  pestel: INITIAL_PESTEL,
  swot: INITIAL_SWOT,
  enjeux: INITIAL_ENJEUX,
  stakeholders: INITIAL_STAKEHOLDERS,
  perimetre: INITIAL_PERIMETRE,
  cartographie: INITIAL_CARTOGRAPHIE,
  axes: INITIAL_AXES,
  documents: INITIAL_DOCUMENTS,
  politiqueIntro: INITIAL_POLITIQUE_INTRO,
  sectionMeta: INITIAL_SECTION_META,
};

const TABS = [
  {
    id: 'perimetre',
    title: "Presentation d'ITALCAR",
    subtitle: 'Identite, reseau et domaine',
    chapter: 'Ch 4.3',
    icon: ScanLine,
    color: 'red',
  },
  {
    id: 'parties',
    title: 'Parties Interessees',
    subtitle: 'Attentes & Suivi',
    chapter: 'Ch 4.2',
    icon: Users,
    color: 'sky',
  },
  {
    id: 'pestel',
    title: 'Analyse Strategique',
    subtitle: 'PESTEL, SWOT et Enjeux',
    chapter: 'Ch 4.1',
    icon: Globe,
    color: 'blue',
  },
  {
    id: 'cartographie',
    title: 'Cartographie des processus',
    subtitle: "Matrice d'interactions",
    chapter: 'Ch 4.4',
    icon: Factory,
    color: 'green',
  },
  {
    id: 'politique',
    title: 'Politique QSE',
    subtitle: 'Engagement direction',
    chapter: 'Ch 5.2',
    icon: FileText,
    color: 'slate',
  },
  {
    id: 'documents',
    title: 'Documentation',
    subtitle: 'Informations documentees',
    chapter: 'Ch 7.5',
    icon: FolderOpen,
    color: 'green',
  },
];

const STRATEGIC_VIEWS = [
  { id: 'pestel', label: 'Analyse PESTEL', icon: Globe },
  { id: 'swot', label: 'Analyse SWOT', icon: ShieldCheck },
  { id: 'enjeux', label: 'Enjeux Identifies', icon: Target },
];

const PESTEL_META = {
  Politique: { icon: Cpu, label: 'Technologique' },
  Economique: { icon: Landmark, label: 'Politique' },
  Societal: { icon: Leaf, label: 'Ecologique' },
  Technologique: { icon: Scale, label: 'Legislatif' },
  Environnemental: { icon: TrendingUp, label: 'Economique' },
  Legal: { icon: Users, label: 'Social' },
};

const SWOT_CLASSES = {
  Forces: 'bg-emerald-50/60 border-emerald-200 text-emerald-900',
  Faiblesses: 'bg-red-50/60 border-red-200 text-red-900',
  Opportunites: 'bg-blue-50/60 border-blue-200 text-blue-900',
  Menaces: 'bg-orange-50/60 border-orange-200 text-orange-900',
};

const ENJEUX_CLASSES = {
  Internes: 'bg-slate-50 border-slate-200 text-slate-900',
  Externes: 'bg-slate-50 border-slate-200 text-slate-900',
};

const emptyGenericModal = {
  open: false,
  title: '',
  category: '',
  subCategory: null,
  itemId: null,
  mode: 'create',
  titleText: '',
  text: '',
  energy: false,
  climate: false,
  allowEnergy: true,
  allowClimate: false,
};

const emptyAttenteForm = {
  mode: 'create',
  itemId: null,
  piName: '',
  originalPiName: '',
  impact: 'true',
  impactEnergy: false,
  impactClimate: false,
  num: '',
  desc: '',
  resp: '',
  pert: 'Haute',
  surv: '',
  freq: 'Mensuelle',
};

const emptyDocForm = {
  fileName: '',
  code: '',
  nom: '',
  indice: '01',
  type: 'Fiche processus',
  site: 'Tous sites',
};

const createId = () => Date.now() + Math.floor(Math.random() * 1000);

const EnergyBadge = () => (
  <span className="inline-flex items-center gap-1 rounded border border-yellow-200 bg-yellow-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-yellow-700">
    <Zap className="h-2.5 w-2.5" />
    Energie
  </span>
);

const ClimateBadge = () => (
  <span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-emerald-700">
    <Leaf className="h-2.5 w-2.5" />
    Climat
  </span>
);

const normalizeGenericAnalysisItem = (item = {}, { withTitle = false } = {}) => ({
  ...item,
  title: withTitle ? String(item?.title || 'aucun titre') : String(item?.title || ''),
  text: String(item?.text || item?.description || ''),
  energy: Boolean(item?.energy),
  climate: Boolean(item?.climate),
});

function ExpandableDescription({ text, expanded, onToggle, lines = 2 }) {
  const normalizedText = String(text || '').trim();
  const canExpand = normalizedText.length > 120 || normalizedText.includes('\n');

  return (
    <div className="space-y-1">
      <div
        className="text-xs font-medium leading-snug text-slate-700"
        style={
          expanded
            ? undefined
            : {
                display: '-webkit-box',
                WebkitLineClamp: lines,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }
        }
      >
        {normalizedText}
      </div>
      {canExpand && (
        <button
          type="button"
          onClick={onToggle}
          className="text-[11px] font-bold text-[#233876] transition hover:text-[#1a2f64]"
        >
          {expanded ? 'Voir moins' : 'Voir plus'}
        </button>
      )}
    </div>
  );
}

function ItemActionButtons({ onEdit, onDelete }) {
  return (
    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
      <button
        type="button"
        onClick={onEdit}
        className="text-slate-400 transition hover:text-[#233876]"
        title="Modifier"
      >
        <Edit2 className="h-3.5 w-3.5" />
      </button>
      <ItemDeleteButton onClick={onDelete} />
    </div>
  );
}

function TabCard({ tab, active, onClick }) {
  const Icon = tab.icon;
  const inactiveByColor = {
    blue: 'bg-blue-50 border-blue-100 text-blue-600',
    sky: 'bg-sky-50 border-sky-100 text-sky-600',
    red: 'bg-red-50 border-red-100 text-red-500',
    slate: 'bg-slate-50 border-slate-200 text-slate-600',
    green: 'bg-emerald-50 border-emerald-100 text-emerald-600',
  };

  return (
    <button
      onClick={onClick}
      className={`relative flex h-[88px] w-full min-w-0 flex-col justify-between rounded-2xl border px-3 py-3 text-left transition-all ${
        active
          ? 'border-transparent bg-[#233876] text-white shadow-md'
          : 'border-slate-200 bg-white text-slate-800 shadow-sm hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between">
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-lg border ${
            active ? 'border-white/10 bg-white/15 text-white' : inactiveByColor[tab.color]
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <div>
        <div className="line-clamp-2 text-[13px] font-bold tracking-wide">{tab.title}</div>
        <div className={`mt-0.5 line-clamp-2 text-[10px] font-medium ${active ? 'text-white/75' : 'text-slate-400'}`}>
          {tab.subtitle}
        </div>
      </div>
    </button>
  );
}

function ItemDeleteButton({ onClick, alwaysVisible = false, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-red-400 transition-opacity hover:text-red-600 ${
        alwaysVisible ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      } ${className}`}
      title="Supprimer"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}

function ModalFrame({ title, children, onClose, maxWidth = 'max-w-lg' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div
        className={`flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl ${maxWidth}`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-lg font-black text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto bg-slate-50 px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function formatSectionDate(value) {
  if (!value) return 'Date non renseignee';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
  }
  return value;
}

function SectionHeader({ icon: Icon, title, subtitle, meta, isAdmin, onMetaChange, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 text-[#233876]" />
        <div>
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          {isAdmin ? (
            <input
              type="text"
              value={meta.reference}
              onChange={(event) => onMetaChange('reference', event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-slate-500 outline-none transition focus:border-[#233876] lg:w-64"
              placeholder="Reference"
            />
          ) : (
            <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">
              {meta.reference || subtitle}
            </p>
          )}
          {!meta.reference && subtitle && !isAdmin && (
            <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-3 lg:items-end">
        <div className="flex flex-col gap-1 text-right">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Date
          </span>
          {isAdmin ? (
            <input
              type="date"
              value={meta.date}
              onChange={(event) => onMetaChange('date', event.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#233876]"
            />
          ) : (
            <span className="text-sm font-semibold text-slate-700">{formatSectionDate(meta.date)}</span>
          )}
        </div>
        {actions}
      </div>
    </div>
  );
}

const PROCESS_CANVAS_WIDTH = 1160;
const PROCESS_CANVAS_HEIGHT = 720;

const PROCESS_TYPE_STYLES = {
  pilotage: 'border-[#233876] bg-white text-[#233876]',
  realisation: 'border-[#16a34a] bg-white text-[#166534]',
  support: 'border-[#c2410c] bg-amber-50 text-amber-900',
};

function getStaticProcessNode(processes, id) {
  if (id === 'exigences') {
    return { x: 90, y: 330, w: 96, h: 250, type: 'side', side: 'left' };
  }
  if (id === 'satisfaction') {
    return { x: PROCESS_CANVAS_WIDTH - 90, y: 330, w: 96, h: 250, type: 'side', side: 'right' };
  }
  const item = processes.find((process) => process.id === id);
  if (!item) return null;
  return {
    ...item,
    h: item.type === 'support' ? 78 : 58,
  };
}

function getProcessAnchor(node, directionHint) {
  if (!node) return { x: 0, y: 0 };
  if (node.side === 'left') return { x: node.x + node.w / 2, y: node.y };
  if (node.side === 'right') return { x: node.x - node.w / 2, y: node.y };

  const horizontal = directionHint === 'left' || directionHint === 'right';
  if (horizontal) {
    return directionHint === 'left'
      ? { x: node.x - node.w / 2, y: node.y }
      : { x: node.x + node.w / 2, y: node.y };
  }

  return directionHint === 'top'
    ? { x: node.x, y: node.y - node.h / 2 }
    : { x: node.x, y: node.y + node.h / 2 };
}

function buildConnectionPath(processes, connection) {
  const fromNode = getStaticProcessNode(processes, connection.from);
  const toNode = getStaticProcessNode(processes, connection.to);
  if (!fromNode || !toNode) return '';

  const dx = toNode.x - fromNode.x;
  const dy = toNode.y - fromNode.y;
  const horizontal = Math.abs(dx) >= Math.abs(dy);
  const fromAnchor = getProcessAnchor(
    fromNode,
    horizontal ? (dx >= 0 ? 'right' : 'left') : dy >= 0 ? 'bottom' : 'top'
  );
  const toAnchor = getProcessAnchor(
    toNode,
    horizontal ? (dx >= 0 ? 'left' : 'right') : dy >= 0 ? 'top' : 'bottom'
  );
  const curve = horizontal
    ? Math.max(60, Math.abs(dx) * 0.35)
    : Math.max(40, Math.abs(dy) * 0.35);

  const cp1 = horizontal
    ? { x: fromAnchor.x + (dx >= 0 ? curve : -curve), y: fromAnchor.y }
    : { x: fromAnchor.x, y: fromAnchor.y + (dy >= 0 ? curve : -curve) };
  const cp2 = horizontal
    ? { x: toAnchor.x - (dx >= 0 ? curve : -curve), y: toAnchor.y }
    : { x: toAnchor.x, y: toAnchor.y - (dy >= 0 ? curve : -curve) };

  return `M ${fromAnchor.x} ${fromAnchor.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${toAnchor.x} ${toAnchor.y}`;
}

function ProcessNode({ process }) {
  const baseClass = PROCESS_TYPE_STYLES[process.type] || PROCESS_TYPE_STYLES.realisation;
  return (
    <div
      className={`absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border-2 px-4 text-center text-xs font-black uppercase tracking-wide shadow-sm ${baseClass}`}
      style={{
        left: `${process.x}px`,
        top: `${process.y}px`,
        width: `${process.w}px`,
        minHeight: `${process.h}px`,
      }}
    >
      {process.nom}
    </div>
  );
}

function CartographieCanvas({ data, isEditing = false, onUpdateProcesses, onUpdateConnexions }) {
  const processes = data?.processus || [];
  const connections = data?.connexions || [];
  const containerRef = useRef(null);
  const [mode, setMode] = useState('move');
  const [draggingId, setDraggingId] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [newProcessName, setNewProcessName] = useState('');
  const [newProcessType, setNewProcessType] = useState('realisation');

  const handleMouseDown = (event, id) => {
    if (!isEditing) return;
    event.stopPropagation();

    if (mode === 'move' && id !== 'exigences' && id !== 'satisfaction') {
      setDraggingId(id);
      return;
    }

    if (mode === 'link') {
      if (!selectedNodeId) {
        setSelectedNodeId(id);
        return;
      }
      if (selectedNodeId !== id && onUpdateConnexions) {
        onUpdateConnexions([
          ...connections,
          { id: `c_${Date.now()}_${Math.floor(Math.random() * 1000)}`, from: selectedNodeId, to: id },
        ]);
      }
      setSelectedNodeId(null);
      return;
    }

    if (mode === 'delete' && id !== 'exigences' && id !== 'satisfaction' && onUpdateProcesses && onUpdateConnexions) {
      onUpdateProcesses(processes.filter((process) => process.id !== id));
      onUpdateConnexions(connections.filter((connection) => connection.from !== id && connection.to !== id));
      setSelectedNodeId(null);
    }
  };

  const handleMouseMove = (event) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    setMousePos({ x, y });

    if (draggingId && mode === 'move' && onUpdateProcesses) {
      onUpdateProcesses(
        processes.map((process) =>
          process.id === draggingId
            ? {
                ...process,
                x: Math.max(140, Math.min(PROCESS_CANVAS_WIDTH - 140, x)),
                y: Math.max(70, Math.min(PROCESS_CANVAS_HEIGHT - 60, y)),
              }
            : process
        )
      );
    }
  };

  const handleMouseUp = () => {
    if (draggingId) setDraggingId(null);
  };

  const addProcess = () => {
    if (!isEditing || !onUpdateProcesses || !newProcessName.trim()) return;
    onUpdateProcesses([
      ...processes,
      {
        id: Date.now(),
        nom: newProcessName.trim(),
        type: newProcessType,
        x: 560,
        y: 360,
        w: newProcessType === 'support' ? 220 : 180,
      },
    ]);
    setNewProcessName('');
  };

  const removeConnection = (connectionId) => {
    if (mode !== 'delete' || !isEditing || !onUpdateConnexions) return;
    onUpdateConnexions(connections.filter((connection) => connection.id !== connectionId));
  };

  return (
    <div className="space-y-4">
      {isEditing && (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-inner">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-2 text-xs font-bold uppercase tracking-wide text-slate-500">
              Outils matrice :
            </span>
            <button
              type="button"
              onClick={() => {
                setMode('move');
                setSelectedNodeId(null);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                mode === 'move'
                  ? 'bg-[#233876] text-white'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              Deplacer
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('link');
                setSelectedNodeId(null);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                mode === 'link'
                  ? 'bg-[#233876] text-white'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              Lier
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('delete');
                setSelectedNodeId(null);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                mode === 'delete'
                  ? 'bg-red-600 text-white'
                  : 'border border-red-200 bg-white text-red-600 hover:bg-red-50'
              }`}
            >
              Supprimer
            </button>
          </div>

          <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-3">
            <div className="min-w-[220px] flex-1">
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Nouveau processus
              </label>
              <input
                type="text"
                value={newProcessName}
                onChange={(event) => setNewProcessName(event.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[#233876]"
                placeholder="Nom du processus"
              />
            </div>
            <div className="min-w-[180px]">
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Categorie
              </label>
              <select
                value={newProcessType}
                onChange={(event) => setNewProcessType(event.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[#233876]"
              >
                <option value="pilotage">Pilotage</option>
                <option value="realisation">Realisation</option>
                <option value="support">Support</option>
              </select>
            </div>
            <button
              type="button"
              onClick={addProcess}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              Ajouter
            </button>
          </div>

          {mode === 'link' && (
            <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">
              Cliquez sur un premier bloc puis sur un second pour creer une liaison.
            </p>
          )}
          {mode === 'delete' && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              Cliquez sur un bloc ou une liaison pour la supprimer.
            </p>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-inner">
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white"
        style={{ width: `${PROCESS_CANVAS_WIDTH}px`, height: `${PROCESS_CANVAS_HEIGHT}px` }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)',
            backgroundSize: '34px 34px',
          }}
        />

        <svg className="absolute inset-0 h-full w-full">
          <polygon
            points="160,120 845,120 940,360 845,600 160,600"
            fill="#f8fafc"
            stroke="#cbd5e1"
            strokeWidth="2"
          />
          {connections.map((connection) => (
            <path
              key={connection.id}
              d={buildConnectionPath(processes, connection)}
              fill="none"
              stroke="#94a3b8"
              strokeWidth="3"
              strokeLinecap="round"
              className={isEditing && mode === 'delete' ? 'cursor-pointer hover:stroke-red-500 hover:stroke-[4]' : ''}
              onClick={() => removeConnection(connection.id)}
            />
          ))}
          {isEditing && selectedNodeId && mode === 'link' && (
            <path
              d={(() => {
                const fromNode = getStaticProcessNode(processes, selectedNodeId);
                if (!fromNode) return '';
                const from = getProcessAnchor(fromNode, 'right');
                const dx = mousePos.x - from.x;
                const curve = Math.max(60, Math.abs(dx) * 0.35);
                return `M ${from.x} ${from.y} C ${from.x + curve} ${from.y}, ${mousePos.x - curve} ${mousePos.y}, ${mousePos.x} ${mousePos.y}`;
              })()}
              fill="none"
              stroke="#233876"
              strokeDasharray="8 6"
              strokeWidth="3"
            />
          )}
        </svg>

        <div
          className={`absolute left-4 top-10 flex h-[500px] w-[96px] items-center justify-center rounded-2xl border-2 border-sky-200 bg-sky-50 px-3 text-center text-xs font-black uppercase tracking-wide text-sky-900 shadow-sm ${
            isEditing ? 'cursor-pointer transition hover:ring-2 hover:ring-sky-300' : ''
          } ${selectedNodeId === 'exigences' ? 'ring-4 ring-emerald-400' : ''}`}
          onMouseDown={(event) => handleMouseDown(event, 'exigences')}
        >
          Exigences des PI
        </div>
        <div
          className={`absolute right-4 top-10 flex h-[500px] w-[96px] items-center justify-center rounded-2xl border-2 border-emerald-200 bg-emerald-50 px-3 text-center text-xs font-black uppercase tracking-wide text-emerald-900 shadow-sm ${
            isEditing ? 'cursor-pointer transition hover:ring-2 hover:ring-emerald-300' : ''
          } ${selectedNodeId === 'satisfaction' ? 'ring-4 ring-emerald-400' : ''}`}
          onMouseDown={(event) => handleMouseDown(event, 'satisfaction')}
        >
          Satisfaction des PI
        </div>

        {processes.map((process) => (
          <div key={process.id} onMouseDown={(event) => handleMouseDown(event, process.id)}>
            <ProcessNode
              process={{
                ...process,
                h: process.type === 'support' ? 78 : 58,
              }}
            />
            {selectedNodeId === process.id && (
              <div
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl ring-4 ring-emerald-400"
                style={{
                  left: `${process.x}px`,
                  top: `${process.y}px`,
                  width: `${process.w}px`,
                  height: `${process.type === 'support' ? 78 : 58}px`,
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
    </div>
  );
}

export default function UtilitiesModule({ onBack, user }) {
  const [activeTab, setActiveTab] = useState('pestel');
  const [strategicView, setStrategicView] = useState('pestel');
  const [presentationEditing, setPresentationEditing] = useState(false);
  const [cartographieEditing, setCartographieEditing] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});
  const [selectedStakeholderName, setSelectedStakeholderName] = useState('');
  const { data: moduleData, setData: setModuleData } = useModuleState(
    'governance_engagement_module',
    INITIAL_MODULE_STATE
  );
  const pestel = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(moduleData.pestel || INITIAL_PESTEL).map(([key, items]) => [
          key,
          (items || []).map((item) => normalizeGenericAnalysisItem(item, { withTitle: true })),
        ])
      ),
    [moduleData.pestel]
  );
  const swot = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(moduleData.swot || INITIAL_SWOT).map(([key, items]) => [
          key,
          (items || []).map((item) => normalizeGenericAnalysisItem(item)),
        ])
      ),
    [moduleData.swot]
  );
  const enjeux = moduleData.enjeux || INITIAL_ENJEUX;
  const stakeholders = moduleData.stakeholders || INITIAL_STAKEHOLDERS;
  const perimetre = useMemo(
    () => ({
      ...INITIAL_PERIMETRE,
      ...(moduleData.perimetre || {}),
      identiteJuridique: {
        ...INITIAL_PERIMETRE.identiteJuridique,
        ...(moduleData.perimetre?.identiteJuridique || {}),
      },
      domainesActivite: moduleData.perimetre?.domainesActivite || INITIAL_PERIMETRE.domainesActivite,
      marques: moduleData.perimetre?.marques || INITIAL_PERIMETRE.marques,
      reseau: {
        ...INITIAL_PERIMETRE.reseau,
        ...(moduleData.perimetre?.reseau || {}),
        propre: moduleData.perimetre?.reseau?.propre || INITIAL_PERIMETRE.reseau.propre,
        sousConcessionnaires:
          moduleData.perimetre?.reseau?.sousConcessionnaires ||
          INITIAL_PERIMETRE.reseau.sousConcessionnaires,
      },
      activites: moduleData.perimetre?.activites || INITIAL_PERIMETRE.activites,
      sites: moduleData.perimetre?.sites || INITIAL_PERIMETRE.sites,
      ues: moduleData.perimetre?.ues || INITIAL_PERIMETRE.ues,
      abreviations: moduleData.perimetre?.abreviations || INITIAL_PERIMETRE.abreviations,
      contexte: moduleData.perimetre?.contexte || INITIAL_PERIMETRE.contexte,
      environnement: moduleData.perimetre?.environnement || INITIAL_PERIMETRE.environnement,
      qualiteScope: {
        ...INITIAL_PERIMETRE.qualiteScope,
        ...(moduleData.perimetre?.qualiteScope || {}),
      },
      energieScope: {
        ...INITIAL_PERIMETRE.energieScope,
        ...(moduleData.perimetre?.energieScope || {}),
      },
    }),
    [moduleData.perimetre]
  );
  const cartographie = useMemo(
    () => ({
      ...INITIAL_CARTOGRAPHIE,
      ...(moduleData.cartographie || {}),
      processus: moduleData.cartographie?.processus || INITIAL_CARTOGRAPHIE.processus,
      connexions: moduleData.cartographie?.connexions || INITIAL_CARTOGRAPHIE.connexions,
    }),
    [moduleData.cartographie]
  );
  const axes = moduleData.axes || INITIAL_AXES;
  const documents = moduleData.documents || INITIAL_DOCUMENTS;
  const politiqueIntro = useMemo(
    () => ({
      ...INITIAL_POLITIQUE_INTRO,
      ...(moduleData.politiqueIntro || {}),
    }),
    [moduleData.politiqueIntro]
  );
  const sectionMeta = useMemo(
    () => ({
      ...INITIAL_SECTION_META,
      ...(moduleData.sectionMeta || {}),
    }),
    [moduleData.sectionMeta]
  );
  const [documentSearch, setDocumentSearch] = useState('');
  const [genericModal, setGenericModal] = useState(emptyGenericModal);
  const [attenteModalOpen, setAttenteModalOpen] = useState(false);
  const [attenteForm, setAttenteForm] = useState(emptyAttenteForm);
  const [docForm, setDocForm] = useState(emptyDocForm);
  const isAdmin = user?.role === 'ADMIN';

  const createSliceSetter = (key) => (updater) =>
    setModuleData((prev) => ({
      ...prev,
      [key]: resolveUpdater(prev[key], updater),
    }));

  const setPestel = createSliceSetter('pestel');
  const setSwot = createSliceSetter('swot');
  const setEnjeux = createSliceSetter('enjeux');
  const setStakeholders = createSliceSetter('stakeholders');
  const setPerimetre = createSliceSetter('perimetre');
  const setCartographie = createSliceSetter('cartographie');
  const setAxes = createSliceSetter('axes');
  const setDocuments = createSliceSetter('documents');
  const setPolitiqueIntro = createSliceSetter('politiqueIntro');
  const setSectionMeta = createSliceSetter('sectionMeta');

  const updateSectionMeta = (sectionKey, field, value) => {
    if (!isAdmin) return;
    setSectionMeta((prev) => ({
      ...(prev || {}),
      [sectionKey]: {
        ...(INITIAL_SECTION_META[sectionKey] || {}),
        ...((prev || {})[sectionKey] || {}),
        [field]: value,
      },
    }));
  };

  const updatePerimetreValue = (field, value) => {
    setPerimetre((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updatePerimetreNestedObject = (parentKey, field, value) => {
    setPerimetre((prev) => ({
      ...prev,
      [parentKey]: {
        ...(prev?.[parentKey] || {}),
        [field]: value,
      },
    }));
  };

  const updatePerimetreArrayItem = (arrayKey, itemId, field, value) => {
    setPerimetre((prev) => ({
      ...prev,
      [arrayKey]: (prev?.[arrayKey] || []).map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addPerimetreArrayItem = (arrayKey, template) => {
    setPerimetre((prev) => ({
      ...prev,
      [arrayKey]: [...(prev?.[arrayKey] || []), { id: createId(), ...template }],
    }));
  };

  const removePerimetreArrayItem = (arrayKey, itemId) => {
    setPerimetre((prev) => ({
      ...prev,
      [arrayKey]: (prev?.[arrayKey] || []).filter((item) => item.id !== itemId),
    }));
  };

  const updatePerimetreNestedArrayItem = (parentKey, arrayKey, itemId, field, value) => {
    setPerimetre((prev) => ({
      ...prev,
      [parentKey]: {
        ...(prev?.[parentKey] || {}),
        [arrayKey]: (prev?.[parentKey]?.[arrayKey] || []).map((item) =>
          item.id === itemId ? { ...item, [field]: value } : item
        ),
      },
    }));
  };

  const addPerimetreNestedArrayItem = (parentKey, arrayKey, template) => {
    setPerimetre((prev) => ({
      ...prev,
      [parentKey]: {
        ...(prev?.[parentKey] || {}),
        [arrayKey]: [...(prev?.[parentKey]?.[arrayKey] || []), { id: createId(), ...template }],
      },
    }));
  };

  const removePerimetreNestedArrayItem = (parentKey, arrayKey, itemId) => {
    setPerimetre((prev) => ({
      ...prev,
      [parentKey]: {
        ...(prev?.[parentKey] || {}),
        [arrayKey]: (prev?.[parentKey]?.[arrayKey] || []).filter((item) => item.id !== itemId),
      },
    }));
  };

  const filteredDocuments = useMemo(() => {
    const query = documentSearch.trim().toLowerCase();
    if (!query) return documents;
    return documents.filter((doc) =>
      [doc.nom, doc.code, doc.type, doc.site].some((value) =>
        value.toLowerCase().includes(query)
      )
    );
  }, [documents, documentSearch]);

  const nextAttenteCode = useMemo(() => {
    const count = stakeholders.reduce((acc, stakeholder) => acc + stakeholder.attentes.length, 0) + 1;
    return `A${String(count).padStart(2, '0')}`;
  }, [stakeholders]);

  const openGenericModal = (category, subCategory = null) => {
    let title = 'Ajouter un element';
    let allowEnergy = true;
    let allowClimate = false;

    if (category === 'activites') {
      title = 'Ajouter une activite';
      allowEnergy = false;
    } else if (category === 'sites') {
      title = 'Ajouter un site couvert';
      allowEnergy = false;
    } else if (category === 'ues') {
      title = 'Ajouter un UES';
    } else if (category === 'axes') {
      title = 'Ajouter un axe strategique';
    } else if (category === 'pestel') {
      title = `Ajouter au PESTEL (${subCategory})`;
      allowClimate = true;
    } else if (category === 'swot') {
      title = `Ajouter au SWOT (${subCategory})`;
      allowClimate = true;
    } else if (category === 'enjeux') {
      title = `Ajouter un enjeu (${subCategory})`;
    }

    setGenericModal({
      open: true,
      title,
      category,
      subCategory,
      itemId: null,
      mode: 'create',
      titleText: category === 'pestel' ? 'aucun titre' : '',
      text: '',
      energy: false,
      climate: false,
      allowEnergy,
      allowClimate,
    });
  };

  const openGenericEditModal = (category, subCategory, item) => {
    let title = 'Modifier un element';
    let allowEnergy = true;
    let allowClimate = false;

    if (category === 'pestel') {
      title = `Modifier PESTEL (${subCategory})`;
      allowClimate = true;
    } else if (category === 'swot') {
      title = `Modifier SWOT (${subCategory})`;
      allowClimate = true;
    } else if (category === 'enjeux') {
      title = `Modifier enjeu (${subCategory})`;
    } else {
      allowEnergy = false;
    }

    const normalizedItem = normalizeGenericAnalysisItem(item, {
      withTitle: category === 'pestel',
    });

    setGenericModal({
      open: true,
      title,
      category,
      subCategory,
      itemId: item.id,
      mode: 'edit',
      titleText: category === 'pestel' ? normalizedItem.title : '',
      text: normalizedItem.text,
      energy: normalizedItem.energy,
      climate: normalizedItem.climate,
      allowEnergy,
      allowClimate,
    });
  };

  const closeGenericModal = () => setGenericModal(emptyGenericModal);

  const saveGenericItem = (event) => {
    event.preventDefault();

    const newItem = {
      id: genericModal.itemId ?? createId(),
      text: genericModal.text.trim(),
      ...(genericModal.allowEnergy ? { energy: genericModal.energy } : {}),
      ...(genericModal.allowClimate ? { climate: genericModal.climate } : {}),
      ...(genericModal.category === 'pestel'
        ? { title: genericModal.titleText.trim() || 'aucun titre' }
        : {}),
    };

    if (!newItem.text) return;

    const appendOrReplace = (items = []) => {
      if (genericModal.mode !== 'edit') {
        return [...items, newItem];
      }

      return items.map((item) =>
        item.id === genericModal.itemId ? { ...item, ...newItem } : item
      );
    };

    if (genericModal.category === 'pestel') {
      setPestel((prev) => ({
        ...prev,
        [genericModal.subCategory]: appendOrReplace(prev[genericModal.subCategory]),
      }));
    } else if (genericModal.category === 'swot') {
      setSwot((prev) => ({
        ...prev,
        [genericModal.subCategory]: appendOrReplace(prev[genericModal.subCategory]),
      }));
    } else if (genericModal.category === 'enjeux') {
      setEnjeux((prev) => ({
        ...prev,
        [genericModal.subCategory]: appendOrReplace(prev[genericModal.subCategory]),
      }));
    } else if (genericModal.category === 'axes') {
      setAxes((prev) => appendOrReplace(prev));
    } else {
      setPerimetre((prev) => ({
        ...prev,
        [genericModal.category]: appendOrReplace(prev[genericModal.category]),
      }));
    }

    closeGenericModal();
  };

  const deleteGenericItem = (category, subCategory, id) => {
    if (category === 'pestel') {
      setPestel((prev) => ({
        ...prev,
        [subCategory]: prev[subCategory].filter((item) => item.id !== id),
      }));
    } else if (category === 'swot') {
      setSwot((prev) => ({
        ...prev,
        [subCategory]: prev[subCategory].filter((item) => item.id !== id),
      }));
    } else if (category === 'enjeux') {
      setEnjeux((prev) => ({
        ...prev,
        [subCategory]: prev[subCategory].filter((item) => item.id !== id),
      }));
    } else if (category === 'axes') {
      setAxes((prev) => prev.filter((item) => item.id !== id));
    } else {
      setPerimetre((prev) => ({
        ...prev,
        [category]: prev[category].filter((item) => item.id !== id),
      }));
    }
  };

  const openAttenteModal = () => {
    setAttenteForm({
      ...emptyAttenteForm,
      mode: 'create',
      itemId: null,
      num: nextAttenteCode,
    });
    setAttenteModalOpen(true);
  };

  const openAttenteEditModal = (stakeholderName, attente, stakeholderImpact = true) => {
    setAttenteForm({
      ...emptyAttenteForm,
      mode: 'edit',
      itemId: attente.id,
      piName: stakeholderName,
      originalPiName: stakeholderName,
      impact: String(attente.impact ?? stakeholderImpact),
      impactEnergy: Boolean(attente.impactEnergy),
      impactClimate: Boolean(attente.impactClimate),
      num: attente.num || '',
      desc: attente.desc || '',
      resp: attente.resp || '',
      pert: attente.pert || 'Haute',
      surv: attente.surv || '',
      freq: attente.freq || 'Mensuelle',
    });
    setAttenteModalOpen(true);
  };

  const saveAttente = (event) => {
    event.preventDefault();
    const piName = attenteForm.piName.trim();
    if (!piName || !attenteForm.desc.trim() || !attenteForm.resp.trim() || !attenteForm.surv.trim()) {
      return;
    }

    const newAttente = {
      id: attenteForm.itemId ?? createId(),
      num: attenteForm.num.trim() || nextAttenteCode,
      impact: attenteForm.impact === 'true',
      desc: attenteForm.desc.trim(),
      resp: attenteForm.resp.trim(),
      pert: attenteForm.pert,
      surv: attenteForm.surv.trim(),
      freq: attenteForm.freq,
      impactEnergy: Boolean(attenteForm.impactEnergy),
      impactClimate: Boolean(attenteForm.impactClimate),
    };

    setStakeholders((prev) => {
      const existingIndex = prev.findIndex(
        (stakeholder) => stakeholder.nom.toLowerCase() === piName.toLowerCase()
      );
      const originalIndex = prev.findIndex(
        (stakeholder) =>
          stakeholder.nom.toLowerCase() === String(attenteForm.originalPiName || '').toLowerCase()
      );

      const appendOrReplaceAttente = (attentes = []) =>
        attenteForm.mode === 'edit'
          ? attentes.map((attente) =>
              attente.id === attenteForm.itemId ? { ...attente, ...newAttente } : attente
            )
          : [...attentes, newAttente];

      const removeExistingAttente = (attentes = []) =>
        attentes.filter((attente) => attente.id !== attenteForm.itemId);

      if (attenteForm.mode === 'edit' && originalIndex >= 0) {
        const originalName = prev[originalIndex].nom;
        const isSameStakeholder = originalName.toLowerCase() === piName.toLowerCase();

        if (isSameStakeholder) {
          return prev.map((stakeholder, index) =>
            index === originalIndex
              ? {
                  ...stakeholder,
                  attentes: appendOrReplaceAttente(stakeholder.attentes),
                }
              : stakeholder
          );
        }

        const withoutOriginal = prev
          .map((stakeholder, index) =>
            index === originalIndex
              ? {
                  ...stakeholder,
                  attentes: removeExistingAttente(stakeholder.attentes),
                }
              : stakeholder
          )
          .filter((stakeholder) => stakeholder.attentes.length > 0);

        const targetIndex = withoutOriginal.findIndex(
          (stakeholder) => stakeholder.nom.toLowerCase() === piName.toLowerCase()
        );

        if (targetIndex >= 0) {
          return withoutOriginal.map((stakeholder, index) =>
            index === targetIndex
              ? {
                  ...stakeholder,
                  attentes: [...stakeholder.attentes, newAttente],
                }
              : stakeholder
          );
        }

        return [
          ...withoutOriginal,
          {
            nom: piName,
            impact: attenteForm.impact === 'true',
            attentes: [newAttente],
          },
        ];
      }

      if (existingIndex >= 0) {
        return prev.map((stakeholder, index) =>
          index === existingIndex
            ? {
                ...stakeholder,
                attentes: appendOrReplaceAttente(stakeholder.attentes),
              }
            : stakeholder
        );
      }

      return [
        ...prev,
        {
          nom: piName,
          impact: attenteForm.impact === 'true',
          attentes: [newAttente],
        },
      ];
    });

    setAttenteModalOpen(false);
  };

  const deleteAttente = (stakeholderName, attenteId) => {
    setStakeholders((prev) =>
      prev
        .map((stakeholder) =>
          stakeholder.nom === stakeholderName
            ? {
                ...stakeholder,
                attentes: stakeholder.attentes.filter((attente) => attente.id !== attenteId),
              }
            : stakeholder
        )
        .filter((stakeholder) => stakeholder.attentes.length > 0)
    );
  };

  const saveDocument = (event) => {
    event.preventDefault();
    if (!docForm.fileName || !docForm.code.trim() || !docForm.nom.trim()) return;

    setDocuments((prev) => [
      {
        id: createId(),
        date: new Date().toLocaleDateString('fr-FR'),
        nom: docForm.nom.trim(),
        code: docForm.code.trim(),
        type: docForm.type,
        indice: String(docForm.indice).padStart(2, '0'),
        site: docForm.site,
        fileType: docForm.fileName.toLowerCase().endsWith('.pdf') ? 'pdf' : 'word',
      },
      ...prev,
    ]);

    setDocForm(emptyDocForm);
  };

  const deleteDocument = (id) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
  };

  const stakeholderNames = stakeholders.map((item) => item.nom);

  return (
    <div className="min-h-screen overflow-hidden bg-[#f4f7fb] text-slate-800">
      <div className="sticky top-0 z-40 px-3 py-3 sm:px-4 lg:px-5">
        <ModuleHeader
          title="Gouvernance et Engagement"
          subtitle="Contexte, leadership, parties intéressées et base documentaire"
          icon={Shield}
          user={user}
          onHomeClick={onBack}
          actions={
            <>
              <button className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-slate-50 lg:flex">
                <BookOpen className="h-4 w-4 text-slate-400" />
                Guide
              </button>
              <button className="hidden items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-600 shadow-sm transition hover:bg-blue-100 lg:flex">
                <Zap className="h-4 w-4" />
                Energie
              </button>
            </>
          }
        />
      </div>
      {false && (
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 px-4 py-3 lg:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onBack?.()}
              className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-[#233876]">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-[19px] font-black uppercase tracking-wide text-slate-900">
                  CONTEXTE & LEADERSHIP
                </h1>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="rounded bg-[#233876] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                    ISO 50001 / 9001
                  </span>
                  <span className="flex items-center gap-1 text-xs font-medium text-slate-400">
                    <MapPin className="h-3 w-3" />
                    ITALCAR
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              <HeaderInfoDisplay darkText={true} />
            </div>
            <button className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-slate-50 lg:flex">
              <BookOpen className="h-4 w-4 text-slate-400" />
              Guide
            </button>
            <button className="hidden items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-600 shadow-sm transition hover:bg-blue-100 lg:flex">
              <Zap className="h-4 w-4" />
              Energie
            </button>
          </div>
        </div>
      </header>
      )}

      <nav className="px-4 pb-2 pt-6 lg:px-6">
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {TABS.map((tab) => (
            <TabCard
              key={tab.id}
              tab={tab}
              active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </div>
      </nav>

      <main className="px-4 pb-10 pt-2 lg:px-6">
        {activeTab === 'pestel' && (
          <section className="w-full space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex flex-col gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Analyse Strategique : PESTEL, SWOT et Enjeux
                  </h3>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    Sous-modules dedies a l'analyse strategique
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {STRATEGIC_VIEWS.map((view) => {
                    const Icon = view.icon;
                    const active = strategicView === view.id;
                    return (
                      <button
                        key={view.id}
                        type="button"
                        onClick={() => setStrategicView(view.id)}
                        className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition ${
                          active
                            ? 'border-transparent bg-[#233876] text-white shadow-sm'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {view.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {strategicView === 'pestel' && (
                <>
                  <SectionHeader
                    icon={Globe}
                    title="Analyse PESTEL"
                    subtitle="Contexte strategique"
                    meta={sectionMeta.pestel}
                    isAdmin={isAdmin}
                    onMetaChange={(field, value) => updateSectionMeta('pestel', field, value)}
                  />
                  <div className="space-y-4">
                    {Object.entries(pestel).map(([key, items]) => {
                      const Icon = PESTEL_META[key].icon;
                      const displayLabel = PESTEL_META[key].label || key;
                      return (
                        <div key={key} className="flex flex-col rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2">
                            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                              <Icon className="h-3.5 w-3.5" />
                              {displayLabel}
                            </div>
                            <button
                              onClick={() => openGenericModal('pestel', key)}
                              className="text-slate-400 transition hover:text-[#233876]"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="space-y-2">
                            {items.map((item) => (
                              <div
                                key={item.id}
                                className="group flex items-start justify-between rounded-lg border border-slate-100 bg-white p-2.5 shadow-sm"
                              >
                                <div className="min-w-0 space-y-1">
                                  <div className="text-xs font-black leading-snug text-slate-900">
                                    {item.title || 'aucun titre'}
                                  </div>
                                  <ExpandableDescription
                                    text={item.text}
                                    expanded={Boolean(expandedItems[`pestel-${key}-${item.id}`])}
                                    onToggle={() =>
                                      setExpandedItems((prev) => ({
                                        ...prev,
                                        [`pestel-${key}-${item.id}`]: !prev[`pestel-${key}-${item.id}`],
                                      }))
                                    }
                                  />
                                  <div className="flex flex-wrap items-center gap-2">
                                    {item.energy && <EnergyBadge />}
                                    {item.climate && <ClimateBadge />}
                                  </div>
                                </div>
                                <ItemActionButtons
                                  onEdit={() => openGenericEditModal('pestel', key, item)}
                                  onDelete={() => deleteGenericItem('pestel', key, item.id)}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {strategicView === 'swot' && (
                <>
                  <SectionHeader
                    icon={ShieldCheck}
                    title="Analyse SWOT"
                    subtitle="Lecture interne et externe"
                    meta={sectionMeta.swot}
                    isAdmin={isAdmin}
                    onMetaChange={(field, value) => updateSectionMeta('swot', field, value)}
                  />
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {['Forces', 'Faiblesses', 'Opportunites', 'Menaces'].map((key) => {
                      const items = swot[key] || [];
                      return (
                        <div key={key} className={`rounded-xl border p-5 ${SWOT_CLASSES[key]}`}>
                          <div className="mb-4 flex items-center justify-between border-b border-black/5 pb-2">
                            <h4 className="text-base font-black uppercase tracking-wide">{key}</h4>
                            <button
                              onClick={() => openGenericModal('swot', key)}
                              className="rounded px-2 py-1 text-xs font-bold transition hover:bg-white/70"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="space-y-2">
                            {items.map((item) => (
                              <div
                                key={item.id}
                                className="group flex items-start justify-between rounded-lg border border-white/20 bg-white/80 p-2.5 shadow-sm"
                              >
                                <div className="space-y-1">
                                  <div className="text-sm font-semibold leading-snug">{item.text}</div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    {item.energy && <EnergyBadge />}
                                    {item.climate && <ClimateBadge />}
                                  </div>
                                </div>
                                <ItemActionButtons
                                  onEdit={() => openGenericEditModal('swot', key, item)}
                                  onDelete={() => deleteGenericItem('swot', key, item.id)}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {strategicView === 'enjeux' && (
                <>
                  <SectionHeader
                    icon={Target}
                    title="Enjeux Identifies"
                    subtitle="Priorites internes et externes"
                    meta={sectionMeta.enjeux}
                    isAdmin={isAdmin}
                    onMetaChange={(field, value) => updateSectionMeta('enjeux', field, value)}
                  />
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {['Internes', 'Externes'].map((key) => {
                      const items = enjeux[key] || [];
                      return (
                        <div key={key} className={`rounded-xl border p-4 ${ENJEUX_CLASSES[key]}`}>
                          <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-2">
                            <h4 className="text-base font-black uppercase tracking-wide">{key}</h4>
                            <button
                              onClick={() => openGenericModal('enjeux', key)}
                              className="text-slate-400 transition hover:text-[#233876]"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="space-y-2">
                            {items.map((item) => (
                              <div
                                key={item.id}
                                className="group flex items-start justify-between rounded-lg border border-slate-100 bg-white p-2.5 shadow-sm"
                              >
                                <div className="space-y-1">
                                  <div className="text-sm font-semibold leading-snug text-slate-700">
                                    {item.text}
                                  </div>
                                  {item.energy && <EnergyBadge />}
                                </div>
                                <ItemDeleteButton
                                  onClick={() => deleteGenericItem('enjeux', key, item.id)}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {activeTab === 'parties' && (
          <section className="w-full">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="px-6 py-5">
                <SectionHeader
                  icon={Users}
                  title="Attentes des Parties Interessees"
                  subtitle="Identification et surveillance"
                  meta={sectionMeta.parties}
                  isAdmin={isAdmin}
                  onMetaChange={(field, value) => updateSectionMeta('parties', field, value)}
                  actions={
                    <button
                      onClick={openAttenteModal}
                      className="flex items-center gap-2 rounded-xl bg-[#233876] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#1a2f64]"
                    >
                      <Plus className="h-4 w-4" />
                      Ajouter une attente
                    </button>
                  }
                />
              </div>
              <div className="overflow-x-auto p-2">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr>
                      {[
                        'Partie interessee',
                        'Impact',
                        'N°',
                        'Attente / Exigence',
                        'Responsable',
                        'Pertinence',
                        'Surveillance',
                        'Frequence',
                        'Action',
                      ].map((header) => (
                        <th
                          key={header}
                          className="border-b-2 border-slate-100 p-3 text-[10px] font-bold uppercase tracking-wider text-slate-400"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {stakeholders.flatMap((stakeholder) =>
                      stakeholder.attentes.map((attente, index) => (
                        <tr
                          key={attente.id}
                          className={`transition ${
                            selectedStakeholderName === stakeholder.nom
                              ? 'bg-blue-50/70'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          {index === 0 && (
                            <td
                              rowSpan={stakeholder.attentes.length}
                              className={`border-r border-slate-100 p-3 align-middle font-bold text-slate-900 ${
                                selectedStakeholderName === stakeholder.nom ? 'bg-blue-100/80' : ''
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedStakeholderName((prev) =>
                                    prev === stakeholder.nom ? '' : stakeholder.nom
                                  )
                                }
                                className="w-full text-left"
                              >
                                {stakeholder.nom}
                              </button>
                            </td>
                          )}
                          <td className="p-3 text-center align-middle">
                            <span
                              className={`rounded px-2 py-1 text-[10px] font-bold uppercase ${
                                (attente.impact ?? stakeholder.impact)
                                  ? 'border border-red-100 bg-red-50 text-red-500'
                                  : 'border border-slate-200 bg-slate-50 text-slate-500'
                              }`}
                            >
                              {(attente.impact ?? stakeholder.impact) ? 'OUI' : 'NON'}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-xs font-bold text-slate-500">
                            {attente.num}
                          </td>
                          <td className="p-3">
                            <div className="space-y-2">
                              <div className="text-sm font-semibold text-slate-800">{attente.desc}</div>
                              <div className="flex flex-wrap items-center gap-2">
                                {attente.impactEnergy && <EnergyBadge />}
                                {attente.impactClimate && <ClimateBadge />}
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-sm text-slate-600">{attente.resp}</td>
                          <td className="p-3 text-center">
                            <span
                              className={`rounded border px-2 py-1 text-[9px] font-bold uppercase ${
                                attente.pert === 'Haute'
                                  ? 'border-orange-100 bg-orange-50 text-orange-600'
                                  : attente.pert === 'Moyenne'
                                  ? 'border-yellow-100 bg-yellow-50 text-yellow-600'
                                  : 'border-green-100 bg-green-50 text-green-600'
                              }`}
                            >
                              {attente.pert}
                            </span>
                          </td>
                          <td className="p-3 text-xs text-slate-600">{attente.surv}</td>
                          <td className="p-3 text-xs text-slate-600">{attente.freq}</td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  openAttenteEditModal(
                                    stakeholder.nom,
                                    attente,
                                    stakeholder.impact
                                  )
                                }
                                className="rounded p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-[#233876]"
                                title="Modifier"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteAttente(stakeholder.nom, attente.id)}
                                className="rounded p-1.5 text-red-400 transition hover:bg-red-50 hover:text-red-600"
                                title="Supprimer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
        {activeTab === 'perimetre' && (
          <section className="w-full">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <SectionHeader
                icon={ScanLine}
                title="Presentation d'ITALCAR"
                subtitle="Identite, reseau et domaine d'application"
                meta={sectionMeta.perimetre}
                isAdmin={isAdmin}
                onMetaChange={(field, value) => updateSectionMeta('perimetre', field, value)}
                actions={
                  isAdmin ? (
                    <button
                      type="button"
                      onClick={() => setPresentationEditing((prev) => !prev)}
                      className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                        presentationEditing
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-[#233876] text-white hover:bg-[#1a2f64]'
                      }`}
                    >
                      {presentationEditing ? 'Terminer les modifications' : 'Modifier le contenu'}
                    </button>
                  ) : null
                }
              />

              <div className="space-y-8 text-slate-700">
                <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
                  <div className="space-y-6 xl:col-span-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <h4 className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        <Building2 className="h-3.5 w-3.5" />
                        Identite Juridique
                      </h4>
                      <ul className="space-y-3 text-sm">
                        <li>
                          <strong className="inline-block w-36 font-semibold text-slate-900">
                            Entreprise:
                          </strong>
                          {presentationEditing ? (
                            <input
                              type="text"
                              value={perimetre.identiteJuridique.entreprise}
                              onChange={(event) =>
                                updatePerimetreNestedObject(
                                  'identiteJuridique',
                                  'entreprise',
                                  event.target.value
                                )
                              }
                              className="w-[220px] rounded border border-slate-200 bg-white px-2 py-1 text-sm"
                            />
                          ) : (
                            perimetre.identiteJuridique.entreprise
                          )}
                        </li>
                        <li>
                          <strong className="inline-block w-36 font-semibold text-slate-900">
                            Forme Juridique:
                          </strong>
                          {presentationEditing ? (
                            <input
                              type="text"
                              value={perimetre.identiteJuridique.formeJuridique}
                              onChange={(event) =>
                                updatePerimetreNestedObject(
                                  'identiteJuridique',
                                  'formeJuridique',
                                  event.target.value
                                )
                              }
                              className="w-[220px] rounded border border-slate-200 bg-white px-2 py-1 text-sm"
                            />
                          ) : (
                            perimetre.identiteJuridique.formeJuridique
                          )}
                        </li>
                        <li>
                          <strong className="inline-block w-36 font-semibold text-slate-900">
                            Effectif:
                          </strong>
                          {presentationEditing ? (
                            <input
                              type="text"
                              value={perimetre.identiteJuridique.effectif}
                              onChange={(event) =>
                                updatePerimetreNestedObject(
                                  'identiteJuridique',
                                  'effectif',
                                  event.target.value
                                )
                              }
                              className="w-[220px] rounded border border-slate-200 bg-white px-2 py-1 text-sm"
                            />
                          ) : (
                            perimetre.identiteJuridique.effectif
                          )}
                        </li>
                        <li className="border-t border-slate-200 pt-3">
                          <strong className="mb-1 block font-semibold text-slate-900">
                            Domaine principal:
                          </strong>
                          {presentationEditing ? (
                            <input
                              type="text"
                              value={perimetre.domainePrincipal}
                              onChange={(event) => updatePerimetreValue('domainePrincipal', event.target.value)}
                              className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-sm"
                            />
                          ) : (
                            perimetre.domainePrincipal
                          )}
                        </li>
                      </ul>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <h4 className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        <Briefcase className="h-3.5 w-3.5" />
                        Marques representees
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {perimetre.marques.map((item) => (
                          <div
                            key={item.id}
                            className="group flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700"
                          >
                            {presentationEditing ? (
                              <>
                                <input
                                  type="text"
                                  value={item.text}
                                  onChange={(event) =>
                                    updatePerimetreArrayItem('marques', item.id, 'text', event.target.value)
                                  }
                                  className="w-24 bg-transparent outline-none"
                                />
                                <ItemDeleteButton onClick={() => removePerimetreArrayItem('marques', item.id)} />
                              </>
                            ) : (
                              item.text
                            )}
                          </div>
                        ))}
                        {presentationEditing && (
                          <button
                            type="button"
                            onClick={() => addPerimetreArrayItem('marques', { text: 'Nouvelle marque' })}
                            className="rounded-full border border-dashed border-slate-300 px-3 py-1 text-xs font-bold text-slate-500 hover:border-[#233876] hover:text-[#233876]"
                          >
                            + Ajouter
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-yellow-200 bg-yellow-50/70 p-5 shadow-sm">
                      <div className="mb-4 flex items-center justify-between">
                        <h4 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-yellow-700">
                          <Zap className="h-3.5 w-3.5" />
                          Usages Energetiques Significatifs
                        </h4>
                        <button
                          onClick={() => openGenericModal('ues')}
                          className="text-yellow-700 transition hover:text-yellow-900"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {perimetre.ues.map((item) => (
                          <div
                            key={item.id}
                            className="group flex items-center gap-2 rounded-lg border border-yellow-200 bg-white px-3 py-1.5 text-xs font-semibold text-yellow-900 shadow-sm"
                          >
                            <Zap className="h-3.5 w-3.5 text-yellow-500" />
                            {presentationEditing ? (
                              <input
                                type="text"
                                value={item.text}
                                onChange={(event) =>
                                  updatePerimetreArrayItem('ues', item.id, 'text', event.target.value)
                                }
                                className="w-48 bg-transparent outline-none"
                              />
                            ) : (
                              item.text
                            )}
                            {presentationEditing && (
                              <ItemDeleteButton
                                alwaysVisible
                                onClick={() => removePerimetreArrayItem('ues', item.id)}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <h4 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Abreviations
                      </h4>
                      <div className="space-y-3">
                        {perimetre.abreviations.map((item) => (
                          <div key={item.id} className="flex items-start gap-3 text-sm">
                            {presentationEditing ? (
                              <>
                                <input
                                  type="text"
                                  value={item.court}
                                  onChange={(event) =>
                                    updatePerimetreArrayItem('abreviations', item.id, 'court', event.target.value)
                                  }
                                  className="w-16 rounded border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-[#233876]"
                                />
                                <input
                                  type="text"
                                  value={item.long}
                                  onChange={(event) =>
                                    updatePerimetreArrayItem('abreviations', item.id, 'long', event.target.value)
                                  }
                                  className="flex-1 rounded border border-slate-200 bg-white px-2 py-1 text-sm"
                                />
                                <ItemDeleteButton
                                  alwaysVisible
                                  onClick={() => removePerimetreArrayItem('abreviations', item.id)}
                                />
                              </>
                            ) : (
                              <>
                                <span className="min-w-[48px] font-bold text-[#233876]">{item.court}</span>
                                <span className="text-slate-600">{item.long}</span>
                              </>
                            )}
                          </div>
                        ))}
                        {presentationEditing && (
                          <button
                            type="button"
                            onClick={() =>
                              addPerimetreArrayItem('abreviations', { court: 'NEW', long: 'Nouvelle abreviation' })
                            }
                            className="rounded-lg border border-dashed border-slate-300 px-3 py-1 text-xs font-bold text-slate-500 hover:border-[#233876] hover:text-[#233876]"
                          >
                            + Ajouter
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 xl:col-span-8">
                    <div className="overflow-hidden rounded-2xl border border-transparent bg-gradient-to-br from-[#233876] to-[#3653a6] p-7 text-white shadow-lg">
                      <h4 className="mb-5 flex items-center gap-2 text-sm font-black uppercase tracking-wider">
                        <Target className="h-4 w-4" />
                        Domaines d'activite
                      </h4>
                      <div className="space-y-3">
                        {perimetre.domainesActivite.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-start gap-3 rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm"
                          >
                            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-200" />
                            {presentationEditing ? (
                              <div className="flex flex-1 items-start gap-2">
                                <textarea
                                  rows="2"
                                  value={item.text}
                                  onChange={(event) =>
                                    updatePerimetreArrayItem('domainesActivite', item.id, 'text', event.target.value)
                                  }
                                  className="w-full rounded border border-white/20 bg-white/15 px-3 py-2 text-sm text-white outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => removePerimetreArrayItem('domainesActivite', item.id)}
                                  className="mt-1 text-red-200 hover:text-white"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-sm font-medium leading-relaxed">{item.text}</span>
                            )}
                          </div>
                        ))}
                        {presentationEditing && (
                          <button
                            type="button"
                            onClick={() =>
                              addPerimetreArrayItem('domainesActivite', {
                                text: "Nouveau domaine d'activite",
                              })
                            }
                            className="rounded-xl border border-dashed border-white/30 bg-white/5 px-4 py-2 text-xs font-bold text-blue-100 hover:bg-white/10"
                          >
                            + Ajouter un domaine
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h4 className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          <MapPin className="h-3.5 w-3.5" />
                          Reseau propre
                        </h4>
                        <div className="space-y-3">
                          {perimetre.reseau.propre.map((item) => (
                            <div key={item.id} className="flex items-start gap-3 text-sm">
                              <span className="mt-1 text-[#233876]">•</span>
                              {presentationEditing ? (
                                <div className="flex flex-1 items-center gap-2">
                                  <input
                                    type="text"
                                    value={item.text}
                                    onChange={(event) =>
                                      updatePerimetreNestedArrayItem(
                                        'reseau',
                                        'propre',
                                        item.id,
                                        'text',
                                        event.target.value
                                      )
                                    }
                                    className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-sm"
                                  />
                                <ItemDeleteButton
                                  alwaysVisible
                                  onClick={() =>
                                    removePerimetreNestedArrayItem('reseau', 'propre', item.id)
                                  }
                                />
                              </div>
                            ) : (
                                <span>{item.text}</span>
                              )}
                            </div>
                          ))}
                        </div>
                        {presentationEditing && (
                          <button
                            type="button"
                            onClick={() =>
                              addPerimetreNestedArrayItem('reseau', 'propre', { text: 'Nouveau site' })
                            }
                            className="mt-4 rounded-lg border border-dashed border-slate-300 px-3 py-1 text-xs font-bold text-slate-500 hover:border-[#233876] hover:text-[#233876]"
                          >
                            + Ajouter un site
                          </button>
                        )}
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h4 className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          <Users className="h-3.5 w-3.5" />
                          Sous-concessionnaires
                        </h4>
                        <div className="space-y-3">
                          {perimetre.reseau.sousConcessionnaires.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm"
                            >
                              {presentationEditing ? (
                                <div className="flex w-full items-center gap-2">
                                  <input
                                    type="text"
                                    value={item.nom}
                                    onChange={(event) =>
                                      updatePerimetreNestedArrayItem(
                                        'reseau',
                                        'sousConcessionnaires',
                                        item.id,
                                        'nom',
                                        event.target.value
                                      )
                                    }
                                    className="flex-1 rounded border border-slate-200 bg-white px-2 py-1 text-sm font-semibold"
                                  />
                                  <input
                                    type="text"
                                    value={item.ville}
                                    onChange={(event) =>
                                      updatePerimetreNestedArrayItem(
                                        'reseau',
                                        'sousConcessionnaires',
                                        item.id,
                                        'ville',
                                        event.target.value
                                      )
                                    }
                                    className="w-32 rounded border border-slate-200 bg-white px-2 py-1 text-sm"
                                  />
                                  <ItemDeleteButton
                                    alwaysVisible
                                    onClick={() =>
                                      removePerimetreNestedArrayItem(
                                        'reseau',
                                        'sousConcessionnaires',
                                        item.id
                                      )
                                    }
                                  />
                                </div>
                              ) : (
                                <>
                                  <span className="font-semibold text-slate-800">{item.nom}</span>
                                  <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">
                                    {item.ville}
                                  </span>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                        {presentationEditing && (
                          <button
                            type="button"
                            onClick={() =>
                              addPerimetreNestedArrayItem('reseau', 'sousConcessionnaires', {
                                nom: 'Nouveau concessionnaire',
                                ville: 'Ville',
                              })
                            }
                            className="mt-4 rounded-lg border border-dashed border-slate-300 px-3 py-1 text-xs font-bold text-slate-500 hover:border-[#233876] hover:text-[#233876]"
                          >
                            + Ajouter un concessionnaire
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h4 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          Contexte
                        </h4>
                        <div className="space-y-3 text-sm leading-6">
                          {perimetre.contexte.map((item) => (
                            <div key={item.id} className="flex gap-2">
                              <span className="mt-1 text-[#233876]">•</span>
                              {presentationEditing ? (
                                <div className="flex flex-1 items-start gap-2">
                                  <textarea
                                    rows="2"
                                    value={item.text}
                                    onChange={(event) =>
                                      updatePerimetreArrayItem('contexte', item.id, 'text', event.target.value)
                                    }
                                    className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-sm"
                                  />
                                  <ItemDeleteButton
                                    alwaysVisible
                                    onClick={() => removePerimetreArrayItem('contexte', item.id)}
                                  />
                                </div>
                              ) : (
                                <span>{item.text}</span>
                              )}
                            </div>
                          ))}
                        </div>
                        {presentationEditing && (
                          <button
                            type="button"
                            onClick={() => addPerimetreArrayItem('contexte', { text: 'Nouvel element de contexte' })}
                            className="mt-4 rounded-lg border border-dashed border-slate-300 px-3 py-1 text-xs font-bold text-slate-500 hover:border-[#233876] hover:text-[#233876]"
                          >
                            + Ajouter
                          </button>
                        )}
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h4 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          Environnement
                        </h4>
                        <div className="space-y-3 text-sm leading-6">
                          {perimetre.environnement.map((item) => (
                            <div key={item.id} className="flex gap-2">
                              <span className="mt-1 text-[#233876]">•</span>
                              {presentationEditing ? (
                                <div className="flex flex-1 items-start gap-2">
                                  <textarea
                                    rows="2"
                                    value={item.text}
                                    onChange={(event) =>
                                      updatePerimetreArrayItem(
                                        'environnement',
                                        item.id,
                                        'text',
                                        event.target.value
                                      )
                                    }
                                    className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-sm"
                                  />
                                  <ItemDeleteButton
                                    alwaysVisible
                                    onClick={() => removePerimetreArrayItem('environnement', item.id)}
                                  />
                                </div>
                              ) : (
                                <span>{item.text}</span>
                              )}
                            </div>
                          ))}
                        </div>
                        {presentationEditing && (
                          <button
                            type="button"
                            onClick={() =>
                              addPerimetreArrayItem('environnement', {
                                text: "Nouvel element d'environnement",
                              })
                            }
                            className="mt-4 rounded-lg border border-dashed border-slate-300 px-3 py-1 text-xs font-bold text-slate-500 hover:border-[#233876] hover:text-[#233876]"
                          >
                            + Ajouter
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
                    <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-slate-900">
                      <ScanLine className="h-4 w-4 text-[#233876]" />
                      Domaine d'application du Systeme de Management
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-[#233876]">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                        <h5 className="font-bold text-slate-900">Qualite</h5>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            Activites couvertes
                          </span>
                          <button
                            onClick={() => openGenericModal('activites')}
                            className="text-slate-400 transition hover:text-[#233876]"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="space-y-3 text-sm">
                          {perimetre.activites.map((item) => (
                            <div key={item.id} className="group flex items-start justify-between gap-3">
                              <div className="flex gap-2">
                                <span className="mt-1 text-[#233876]">•</span>
                                {presentationEditing ? (
                                  <input
                                    type="text"
                                    value={item.text}
                                    onChange={(event) =>
                                      updatePerimetreArrayItem('activites', item.id, 'text', event.target.value)
                                    }
                                    className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-sm"
                                  />
                                ) : (
                                  <span>{item.text}</span>
                                )}
                              </div>
                              {presentationEditing && (
                                <ItemDeleteButton
                                  alwaysVisible
                                  onClick={() => removePerimetreArrayItem('activites', item.id)}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 border-t border-slate-200 pt-4 text-sm text-slate-600">
                          <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            Exclusions
                          </div>
                          {presentationEditing ? (
                            <textarea
                              rows="4"
                              value={perimetre.qualiteScope.exclusions}
                              onChange={(event) =>
                                updatePerimetreNestedObject('qualiteScope', 'exclusions', event.target.value)
                              }
                              className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm"
                            />
                          ) : (
                            <p>{perimetre.qualiteScope.exclusions}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                          <Zap className="h-4 w-4" />
                        </div>
                        <h5 className="font-bold text-slate-900">Energie</h5>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            Sites couverts
                          </span>
                          <button
                            onClick={() => openGenericModal('sites')}
                            className="text-slate-400 transition hover:text-[#233876]"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="space-y-3 text-sm">
                          {perimetre.sites.map((item) => (
                            <div key={item.id} className="group flex items-start justify-between gap-3">
                              <div className="flex gap-2">
                                <span className="mt-1 text-[#233876]">•</span>
                                {presentationEditing ? (
                                  <input
                                    type="text"
                                    value={item.text}
                                    onChange={(event) =>
                                      updatePerimetreArrayItem('sites', item.id, 'text', event.target.value)
                                    }
                                    className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-sm"
                                  />
                                ) : (
                                  <span>{item.text}</span>
                                )}
                              </div>
                              {presentationEditing && (
                                <ItemDeleteButton
                                  alwaysVisible
                                  onClick={() => removePerimetreArrayItem('sites', item.id)}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 border-t border-slate-200 pt-4 text-sm text-slate-600">
                          <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            Portee energie
                          </div>
                          {presentationEditing ? (
                            <textarea
                              rows="3"
                              value={perimetre.energieScope.activites[0]}
                              onChange={(event) =>
                                updatePerimetreNestedObject('energieScope', 'activites', [event.target.value])
                              }
                              className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm"
                            />
                          ) : (
                            <p>{perimetre.energieScope.activites[0]}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'cartographie' && (
          <section className="w-full">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <SectionHeader
                icon={Factory}
                title="Cartographie des processus"
                subtitle="Matrice d'interactions"
                meta={sectionMeta.cartographie}
                isAdmin={isAdmin}
                onMetaChange={(field, value) => updateSectionMeta('cartographie', field, value)}
                actions={
                  isAdmin ? (
                    <button
                      type="button"
                      onClick={() => setCartographieEditing((prev) => !prev)}
                      className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                        cartographieEditing
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-[#233876] text-white hover:bg-[#1a2f64]'
                      }`}
                    >
                      {cartographieEditing ? "Quitter l'edition" : 'Modifier la cartographie'}
                    </button>
                  ) : null
                }
              />

              <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-slate-600">
                Cette matrice presente les interactions entre les processus de pilotage, de
                realisation et de support, ainsi que les liens avec les exigences et la
                satisfaction des parties interessees.
              </div>

              <div className="mb-5 flex flex-wrap gap-3 text-xs font-semibold text-slate-600">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#233876]/20 bg-[#233876]/5 px-3 py-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#233876]" />
                  Pilotage
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                  Realisation
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-600" />
                  Support
                </span>
              </div>

              <CartographieCanvas
                data={cartographie}
                isEditing={Boolean(isAdmin && cartographieEditing)}
                onUpdateProcesses={(newProcesses) =>
                  setCartographie((prev) => ({
                    ...(prev || {}),
                    processus: newProcesses,
                  }))
                }
                onUpdateConnexions={(newConnexions) =>
                  setCartographie((prev) => ({
                    ...(prev || {}),
                    connexions: newConnexions,
                  }))
                }
              />
            </div>
          </section>
        )}

        {activeTab === 'politique' && (
          <section className="w-full">
            <div
              className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
              style={{ fontFamily: '"Times New Roman", Times, serif' }}
            >
              <SectionHeader
                icon={FileText}
                title="Politique Qualite & Energie"
                subtitle="Engagement de la direction"
                meta={sectionMeta.politique}
                isAdmin={isAdmin}
                onMetaChange={(field, value) => updateSectionMeta('politique', field, value)}
              />

              <div className="mb-8 space-y-4 text-[15px] leading-7 text-slate-700">
                {isAdmin ? (
                  <>
                    <textarea
                      rows="3"
                      value={politiqueIntro.lead}
                      onChange={(event) =>
                        setPolitiqueIntro((prev) => ({ ...prev, lead: event.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[15px] leading-7 text-slate-700 outline-none transition focus:border-[#233876]"
                      style={{ fontFamily: '"Times New Roman", Times, serif' }}
                    />
                    <textarea
                      rows="4"
                      value={politiqueIntro.body}
                      onChange={(event) =>
                        setPolitiqueIntro((prev) => ({ ...prev, body: event.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[15px] leading-7 text-slate-700 outline-none transition focus:border-[#233876]"
                      style={{ fontFamily: '"Times New Roman", Times, serif' }}
                    />
                  </>
                ) : (
                  <>
                    <p>{politiqueIntro.lead}</p>
                    <p>{politiqueIntro.body}</p>
                  </>
                )}
              </div>

              <div className="mb-8">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Axes Strategiques
                  </h4>
                  <button
                    onClick={() => openGenericModal('axes')}
                    className="flex items-center gap-1 rounded px-2 py-1 text-xs font-bold text-[#233876] transition hover:bg-blue-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Ajouter
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {axes.map((item) => (
                    <div
                      key={item.id}
                      className="group relative rounded-xl border border-slate-200 bg-white p-4 pl-10 shadow-sm"
                    >
                      <div
                        className={`absolute left-4 top-5 h-2 w-2 rounded-full ${
                          item.energy ? 'bg-yellow-400' : 'bg-[#233876]'
                        }`}
                      />
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-2">
                          <div className="text-[13px] font-semibold leading-snug text-slate-800">
                            {item.text}
                          </div>
                          {item.energy && <EnergyBadge />}
                        </div>
                        <ItemDeleteButton onClick={() => deleteGenericItem('axes', null, item.id)} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-r-xl border-l-2 border-slate-300 bg-slate-50 p-5 pl-6 text-lg leading-8 text-black">
                <p>
                  La Direction s'engage a mettre a disposition toutes les ressources et
                  l'environnement de travail necessaires pour l'atteinte de ces objectifs ainsi
                  que les moyens pour l'evaluation periodique de l'efficacite du systeme.
                </p>
                <div className="mt-6 flex flex-col items-end text-right">
                  <span className="text-lg font-semibold text-black">Direction Generale</span>
                  <img
                    src={politiqueSignature}
                    alt="Signature Direction Generale"
                    className="mt-3 h-auto w-48 object-contain"
                  />
                </div>
              </div>
            </div>
          </section>
        )}
        {activeTab === 'documents' && (
          <section className="w-full space-y-6">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-white px-6 py-5">
                <SectionHeader
                  icon={FolderOpen}
                  title="Base Documentaire"
                  subtitle="Informations documentees"
                  meta={sectionMeta.documents}
                  isAdmin={isAdmin}
                  onMetaChange={(field, value) => updateSectionMeta('documents', field, value)}
                  actions={
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Rechercher..."
                        value={documentSearch}
                        onChange={(event) => setDocumentSearch(event.target.value)}
                        className="w-64 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none transition focus:border-[#233876]"
                      />
                    </div>
                  }
                />
              </div>
              <div className="overflow-x-auto p-2">
                <table className="w-full border-collapse whitespace-nowrap text-left">
                  <thead>
                    <tr>
                      {[
                        'Date Upload',
                        'Designation',
                        'Code',
                        'Type',
                        'Indice',
                        'Site',
                        'Action',
                      ].map((header) => (
                        <th
                          key={header}
                          className="border-b-2 border-slate-100 p-3 text-[10px] font-bold uppercase tracking-wider text-slate-400"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                    {filteredDocuments.map((doc) => (
                      <tr key={doc.id} className="group transition hover:bg-slate-50">
                        <td className="p-3 text-xs font-medium text-slate-500">{doc.date}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-3 font-bold text-slate-800">
                            <FileText
                              className={`h-4 w-4 ${
                                doc.fileType === 'pdf' ? 'text-red-500' : 'text-blue-600'
                              }`}
                            />
                            {doc.nom}
                          </div>
                        </td>
                        <td className="p-3 font-mono text-[11px] font-black text-slate-500">
                          {doc.code}
                        </td>
                        <td className="p-3 text-xs font-semibold text-slate-600">{doc.type}</td>
                        <td className="p-3 text-center">
                          <span className="rounded border border-slate-200 bg-slate-100 px-2 py-1 text-[10px] font-mono font-bold text-slate-600">
                            {String(doc.indice).padStart(2, '0')}
                          </span>
                        </td>
                        <td className="p-3 text-xs font-medium text-slate-500">{doc.site}</td>
                        <td className="p-3">
                          <div className="flex justify-center gap-2 opacity-70 transition group-hover:opacity-100">
                            <button className="rounded-lg bg-blue-50 p-2 text-[#233876] transition hover:bg-blue-100">
                              <Download className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteDocument(doc.id)}
                              className="rounded-lg bg-red-50 p-2 text-red-500 transition hover:bg-red-100 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h4 className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <Upload className="h-4 w-4 text-[#233876]" />
                Ajouter un document
              </h4>
              <form onSubmit={saveDocument} className="grid grid-cols-1 gap-5 md:grid-cols-6 md:items-end">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Fichier
                  </label>
                  <input
                    type="file"
                    required
                    onChange={(event) =>
                      setDocForm((prev) => ({
                        ...prev,
                        fileName: event.target.files?.[0]?.name || '',
                        nom: prev.nom || (event.target.files?.[0]?.name || '').replace(/\.[^/.]+$/, ''),
                      }))
                    }
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-xs file:font-bold file:text-[#233876] hover:file:bg-blue-100"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Code
                  </label>
                  <input
                    value={docForm.code}
                    onChange={(event) => setDocForm((prev) => ({ ...prev, code: event.target.value }))}
                    required
                    placeholder="Ex: FF-01"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-[#233876]"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Designation
                  </label>
                  <input
                    value={docForm.nom}
                    onChange={(event) => setDocForm((prev) => ({ ...prev, nom: event.target.value }))}
                    required
                    placeholder="Nom du document..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-[#233876]"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Indice
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={Number(docForm.indice)}
                    onChange={(event) => setDocForm((prev) => ({ ...prev, indice: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-[#233876]"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Type
                  </label>
                  <select
                    value={docForm.type}
                    onChange={(event) => setDocForm((prev) => ({ ...prev, type: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-[#233876]"
                  >
                    <option>Fiche processus</option>
                    <option>Procedure</option>
                    <option>Fiche fonction</option>
                    <option>Organigramme</option>
                    <option>Manuel</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Site
                  </label>
                  <select
                    value={docForm.site}
                    onChange={(event) => setDocForm((prev) => ({ ...prev, site: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-[#233876]"
                  >
                    <option>Tous sites</option>
                    <option>Siege Megrine</option>
                    <option>Showroom Berges du Lac</option>
                    <option>SAV Cite el Khadhra</option>
                    <option>Parc Naassen</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#233876] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#1a2f64]"
                  >
                    Valider & Sauvegarder
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}
      </main>

      {genericModal.open && (
        <ModalFrame title={genericModal.title} onClose={closeGenericModal}>
          <form onSubmit={saveGenericItem} className="space-y-4">
            {genericModal.category === 'pestel' && (
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Titre
                </label>
                <input
                  required
                  value={genericModal.titleText}
                  onChange={(event) =>
                    setGenericModal((prev) => ({ ...prev, titleText: event.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#233876]"
                  placeholder="aucun titre"
                />
              </div>
            )}
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Description
              </label>
              <textarea
                rows="2"
                required
                value={genericModal.text}
                onChange={(event) =>
                  setGenericModal((prev) => ({ ...prev, text: event.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none transition focus:border-[#233876]"
              />
            </div>

            {genericModal.allowEnergy && (
              <div className="space-y-3">
                <label className="mt-2 flex cursor-pointer items-center gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                  <input
                    type="checkbox"
                    checked={genericModal.energy}
                    onChange={(event) =>
                      setGenericModal((prev) => ({ ...prev, energy: event.target.checked }))
                    }
                    className="h-4 w-4 rounded border-slate-300 text-[#233876]"
                  />
                  <span className="flex items-center gap-2 text-sm font-bold text-yellow-900">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    Marquer comme aspect energetique
                  </span>
                </label>

                {genericModal.allowClimate && (
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <input
                      type="checkbox"
                      checked={genericModal.climate}
                      onChange={(event) =>
                        setGenericModal((prev) => ({ ...prev, climate: event.target.checked }))
                      }
                      className="h-4 w-4 rounded border-slate-300 text-[#233876]"
                    />
                    <span className="flex items-center gap-2 text-sm font-bold text-emerald-900">
                      <Leaf className="h-4 w-4 text-emerald-500" />
                      Marquer comme aspect climatique
                    </span>
                  </label>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={closeGenericModal}
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="rounded-xl bg-[#233876] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#1a2f64]"
              >
                Valider & Sauvegarder
              </button>
            </div>
          </form>
        </ModalFrame>
      )}
      {attenteModalOpen && (
        <ModalFrame
          title={attenteForm.mode === 'edit' ? 'Modifier une attente' : 'Ajouter une attente'}
          onClose={() => setAttenteModalOpen(false)}
          maxWidth="max-w-2xl"
        >
          <form onSubmit={saveAttente} className="grid grid-cols-2 gap-5">
            <div className="col-span-2">
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Partie interessee
              </label>
              <input
                list="pi-list"
                required
                value={attenteForm.piName}
                onChange={(event) =>
                  setAttenteForm((prev) => ({ ...prev, piName: event.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm uppercase outline-none transition focus:border-[#233876]"
                placeholder="Ex: FOURNISSEURS"
              />
              <datalist id="pi-list">
                {stakeholderNames.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Impact sur ITALCAR
              </label>
              <select
                value={attenteForm.impact}
                onChange={(event) =>
                  setAttenteForm((prev) => ({ ...prev, impact: event.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#233876]"
              >
                <option value="true">OUI</option>
                <option value="false">NON</option>
              </select>
            </div>

            <div className="col-span-2 grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                <input
                  type="checkbox"
                  checked={attenteForm.impactEnergy}
                  onChange={(event) =>
                    setAttenteForm((prev) => ({ ...prev, impactEnergy: event.target.checked }))
                  }
                  className="h-4 w-4 rounded border-slate-300 text-[#233876]"
                />
                <span className="flex items-center gap-2 text-sm font-bold text-yellow-900">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  Impact energetique
                </span>
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <input
                  type="checkbox"
                  checked={attenteForm.impactClimate}
                  onChange={(event) =>
                    setAttenteForm((prev) => ({ ...prev, impactClimate: event.target.checked }))
                  }
                  className="h-4 w-4 rounded border-slate-300 text-[#233876]"
                />
                <span className="flex items-center gap-2 text-sm font-bold text-emerald-900">
                  <Leaf className="h-4 w-4 text-emerald-500" />
                  Impact climatique
                </span>
              </label>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Numero attente
              </label>
              <input
                required
                value={attenteForm.num}
                onChange={(event) =>
                  setAttenteForm((prev) => ({ ...prev, num: event.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#233876]"
              />
            </div>

            <div className="col-span-2">
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Description de l'attente / exigence
              </label>
              <textarea
                rows="2"
                required
                value={attenteForm.desc}
                onChange={(event) =>
                  setAttenteForm((prev) => ({ ...prev, desc: event.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#233876]"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Responsable
              </label>
              <input
                required
                value={attenteForm.resp}
                onChange={(event) =>
                  setAttenteForm((prev) => ({ ...prev, resp: event.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#233876]"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Pertinence
              </label>
              <select
                value={attenteForm.pert}
                onChange={(event) =>
                  setAttenteForm((prev) => ({ ...prev, pert: event.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#233876]"
              >
                <option>Haute</option>
                <option>Moyenne</option>
                <option>Faible</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Moyen de surveillance
              </label>
              <input
                required
                value={attenteForm.surv}
                onChange={(event) =>
                  setAttenteForm((prev) => ({ ...prev, surv: event.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#233876]"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Frequence
              </label>
              <select
                value={attenteForm.freq}
                onChange={(event) =>
                  setAttenteForm((prev) => ({ ...prev, freq: event.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#233876]"
              >
                <option>Mensuelle</option>
                <option>Trimestrielle</option>
                <option>Semestrielle</option>
                <option>Annuelle</option>
              </select>
            </div>

            <div className="col-span-2 flex justify-end gap-3 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={() => setAttenteModalOpen(false)}
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="rounded-xl bg-[#233876] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#1a2f64]"
              >
                Valider & Sauvegarder
              </button>
            </div>
          </form>
        </ModalFrame>
      )}
    </div>
  );
}
