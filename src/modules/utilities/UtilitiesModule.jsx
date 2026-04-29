
import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Building2,
  Cpu,
  Download,
  Edit2,
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

const INITIAL_SECTION_META = {
  pestel: { date: '2026-04-29', reference: 'CH 4.1' },
  swot: { date: '2026-04-29', reference: 'CH 4.1' },
  enjeux: { date: '2026-04-29', reference: 'CH 4.1' },
  parties: { date: '2026-04-29', reference: 'CH 4.2' },
  perimetre: { date: '2026-04-29', reference: 'CH 4.3' },
  politique: { date: '2026-04-29', reference: 'CH 5.2' },
  documents: { date: '2026-04-29', reference: 'CH 7.5' },
};

const INITIAL_MODULE_STATE = {
  pestel: INITIAL_PESTEL,
  swot: INITIAL_SWOT,
  enjeux: INITIAL_ENJEUX,
  stakeholders: INITIAL_STAKEHOLDERS,
  perimetre: INITIAL_PERIMETRE,
  axes: INITIAL_AXES,
  documents: INITIAL_DOCUMENTS,
  sectionMeta: INITIAL_SECTION_META,
};

const TABS = [
  {
    id: 'pestel',
    title: 'Analyse Strategique',
    subtitle: 'PESTEL, SWOT et Enjeux',
    chapter: 'Ch 4.1',
    icon: Globe,
    color: 'blue',
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
    id: 'perimetre',
    title: 'Perimetre',
    subtitle: "Domaine d'application",
    chapter: 'Ch 4.3',
    icon: ScanLine,
    color: 'red',
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
      className={`relative flex h-24 min-w-[240px] flex-col justify-between rounded-2xl border p-4 text-left transition-all ${
        active
          ? 'border-transparent bg-[#233876] text-white shadow-md'
          : 'border-slate-200 bg-white text-slate-800 shadow-sm hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
            active ? 'border-white/10 bg-white/15 text-white' : inactiveByColor[tab.color]
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div>
        <div className="text-sm font-bold tracking-wide">{tab.title}</div>
        <div className={`mt-0.5 text-[11px] font-medium ${active ? 'text-white/75' : 'text-slate-400'}`}>
          {tab.subtitle}
        </div>
      </div>
    </button>
  );
}

function ItemDeleteButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-red-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-600"
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

export default function UtilitiesModule({ onBack, user }) {
  const [activeTab, setActiveTab] = useState('pestel');
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
  const perimetre = moduleData.perimetre || INITIAL_PERIMETRE;
  const axes = moduleData.axes || INITIAL_AXES;
  const documents = moduleData.documents || INITIAL_DOCUMENTS;
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
  const setAxes = createSliceSetter('axes');
  const setDocuments = createSliceSetter('documents');
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

      <nav className="overflow-x-auto px-4 pb-2 pt-6 lg:px-6">
        <div className="flex min-w-max items-center gap-4 pb-2">
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
              <SectionHeader
                icon={Globe}
                title="Analyse PESTEL"
                subtitle="Contexte strategique"
                meta={sectionMeta.pestel}
                isAdmin={isAdmin}
                onMetaChange={(field, value) => updateSectionMeta('pestel', field, value)}
              />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
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
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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
                        <h4 className="text-[11px] font-black uppercase tracking-widest">{key}</h4>
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
                  )})}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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
                        <h4 className="text-[11px] font-black uppercase tracking-widest">{key}</h4>
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
                  )})}
                </div>
              </div>
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
                title="Perimetre du Systeme de Management"
                subtitle="Domaine d'application"
                meta={sectionMeta.perimetre}
                isAdmin={isAdmin}
                onMetaChange={(field, value) => updateSectionMeta('perimetre', field, value)}
              />

              <div className="grid grid-cols-1 gap-8 text-slate-700 md:grid-cols-2">
                <div className="space-y-6">
                  <div>
                    <h4 className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      <Building2 className="h-3.5 w-3.5" />
                      1. Identite Juridique
                    </h4>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                      <ul className="space-y-3 text-sm">
                        <li>
                          <strong className="inline-block w-36 font-semibold text-slate-900">
                            Entreprise:
                          </strong>
                          ITALCAR
                        </li>
                        <li>
                          <strong className="inline-block w-36 font-semibold text-slate-900">
                            Forme Juridique:
                          </strong>
                          SA (3 000 000 DT)
                        </li>
                        <li>
                          <strong className="inline-block w-36 font-semibold text-slate-900">
                            Effectif:
                          </strong>
                          99 employes
                        </li>
                        <li className="mt-2 border-t border-slate-200 pt-2">
                          <strong className="mb-1 block font-semibold text-slate-900">
                            Domaine d'activite:
                          </strong>
                          Representation materiel de transport
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-yellow-500">
                        <Zap className="h-3.5 w-3.5" />
                        Usages Energetiques Significatifs
                      </h4>
                      <button
                        onClick={() => openGenericModal('ues')}
                        className="text-xs font-bold text-yellow-600 transition hover:text-yellow-800"
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
                          {item.text}
                          <ItemDeleteButton
                            onClick={() => deleteGenericItem('ues', null, item.id)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        2. Activites
                      </h4>
                      <button
                        onClick={() => openGenericModal('activites')}
                        className="text-slate-400 transition hover:text-[#233876]"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                      <ul className="space-y-3 text-sm">
                        {perimetre.activites.map((item) => (
                          <li key={item.id} className="group flex items-start justify-between gap-3">
                            <div className="flex gap-2">
                              <span className="mt-1 text-[#233876]">•</span>
                              <span>{item.text}</span>
                            </div>
                            <ItemDeleteButton
                              onClick={() => deleteGenericItem('activites', null, item.id)}
                            />
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        3. Sites Couverts
                      </h4>
                      <button
                        onClick={() => openGenericModal('sites')}
                        className="text-slate-400 transition hover:text-[#233876]"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                      <ul className="space-y-3 text-sm">
                        {perimetre.sites.map((item) => (
                          <li key={item.id} className="group flex items-start justify-between gap-3">
                            <div className="flex gap-2">
                              <span className="mt-1 text-[#233876]">•</span>
                              <span>{item.text}</span>
                            </div>
                            <ItemDeleteButton
                              onClick={() => deleteGenericItem('sites', null, item.id)}
                            />
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'politique' && (
          <section className="w-full">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <SectionHeader
                icon={FileText}
                title="Politique Qualite & Energie"
                subtitle="Engagement de la direction"
                meta={sectionMeta.politique}
                isAdmin={isAdmin}
                onMetaChange={(field, value) => updateSectionMeta('politique', field, value)}
              />

              <div className="mb-8 space-y-4 text-sm leading-7 text-slate-600">
                <p className="text-[15px] font-semibold text-slate-900">
                  ITALCAR s'engage a etablir et a maintenir un systeme de management de la
                  Qualite & Energie conforme aux exigences ISO 9001 et ISO 50001.
                </p>
                <p>
                  ITALCAR aspire a etre parmi les leaders du marche, et s'engage a ameliorer
                  son efficacite energetique pour favoriser le developpement durable. Afin de
                  developper en continu nos performances, notre politique qualite & energie
                  repose sur les axes strategiques suivants :
                </p>
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

              <div className="rounded-r-xl border-l-2 border-slate-300 bg-slate-50 p-4 pl-5 text-[13px] italic text-slate-500">
                La Direction s'engage a mettre a disposition toutes les ressources et
                l'environnement de travail necessaires pour l'atteinte de ces objectifs ainsi
                que les moyens pour l'evaluation periodique de l'efficacite du systeme.
                <br />
                <br />
                <strong className="not-italic text-slate-800">La Direction Generale</strong>
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
