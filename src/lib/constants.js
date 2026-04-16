import {
  ClipboardList,
  Database,
  Factory,
  GraduationCap,
  LayoutGrid,
  ListChecks,
  Users,
  Wind,
  Wrench,
  Zap,
} from 'lucide-react';

export const LOGO_URL =
  'https://italcar.tn/wp-content/uploads/2020/12/logo-italcar.png';

export const BRAND = {
  primary: 'bg-blue-900',
  primaryText: 'text-blue-900',
  accent: 'bg-red-600',
  accentText: 'text-red-600',
  lightBg: 'bg-slate-50',
};

export const DASHBOARD_MODULES = [
  {
    id: 'steg',
    title: 'Dépenses Énergétiques',
    description:
      'Suivi des facturations STEG (MT/BT) et de la production photovoltaïque (PV). Analyse financière, gestion des bonifications/pénalités (Cos φ) et optimisation des dépassements de puissance.',
    icon: Zap,
    allowedRoles: ['ADMIN', 'EQUIPE_ENERGIE'],
  },
  {
    id: 'air',
    title: "Performance des Systèmes d'Air Comprimé",
    description:
      'Surveillance et maintenance des compresseurs. Suivi croisé de la pression, du débit et de la consommation électrique pour l’analyse des ratios de performance.',
    icon: Wind,
    allowedRoles: ['ADMIN', 'EQUIPE_ENERGIE'],
  },
  {
    id: 'sites',
    title: 'Pilotage et Revues Énergétiques',
    description:
      'Tableaux de bord consolidés, analyse des Indicateurs de Performance Énergétique (IPE), suivi de la situation de référence et projections des consommations futures.',
    icon: LayoutGrid,
    allowedRoles: ['ADMIN', 'EQUIPE_ENERGIE', 'DIRECTION'],
  },
  {
    id: 'maintenance',
    title: 'Gestion des Actifs Énergétiques',
    description:
      'Planification de la maintenance préventive, pilotage des Usages Énergétiques Significatifs (UES) et gestion rigoureuse du parc métrologique.',
    icon: Wrench,
    allowedRoles: ['ADMIN', 'EQUIPE_ENERGIE'],
  },
  {
    id: 'audits',
    title: 'Audits et Conformité',
    description:
      'Planification des audits internes et de certification externe. Suivi des grilles d’évaluation et garantie de la conformité légale et réglementaire.',
    icon: ClipboardList,
    allowedRoles: ['ADMIN', 'EQUIPE_ENERGIE'],
  },
  {
    id: 'reunions',
    title: 'Réunions',
    description:
      'Organisation des revues de direction et comités énergie. Centralisation des comptes rendus et suivi de l’exécution des décisions stratégiques.',
    icon: Users,
    allowedRoles: ['ADMIN', 'EQUIPE_ENERGIE'],
  },
  {
    id: 'actions',
    title: 'Actions',
    description:
      'Pilotage des plans d’actions d’amélioration continue (PDCA). Traitement des risques, suivi de l’avancement et évaluation de l’efficacité pour l’atteinte des objectifs fixés.',
    icon: ListChecks,
    allowedRoles: ['ADMIN', 'EQUIPE_ENERGIE'],
  },
  {
    id: 'collecte',
    title: 'Plan de Comptage et Mesurage',
    description:
      'Cartographie de l’instrumentation, définition de l’architecture d’acquisition des données et contrôle périodique de la fiabilité des compteurs.',
    icon: Database,
    allowedRoles: ['ADMIN', 'EQUIPE_ENERGIE'],
  },
  {
    id: 'utilities',
    title: 'Gouvernance et Engagement',
    description:
      'Définition de la politique énergétique, analyse du contexte (enjeux, parties intéressées) et gestion documentaire centralisée.',
    icon: Factory,
    allowedRoles: ['ADMIN', 'EQUIPE_ENERGIE'],
  },
  {
    id: 'rh',
    title: 'Compétences et Sensibilisation',
    description:
      'Gestion des habilitations, cartographie des matrices de compétences et suivi du déploiement des programmes de formation du personnel.',
    icon: GraduationCap,
    allowedRoles: ['ADMIN', 'EQUIPE_ENERGIE'],
  },
];

export const canAccessModule = (role, moduleId) => {
  if (!role) return false;
  if (role === 'ADMIN') return true;

  const module = DASHBOARD_MODULES.find((item) => item.id === moduleId);
  return module ? module.allowedRoles.includes(role) : false;
};
