import {BobineColors, EncrierColor} from '@shared/lib/encrier';

export interface BobineFille {
  ref: string;
  designation?: string;
  laize?: number;
  longueur?: number;
  couleurPapier?: string;
  grammage?: number;
  refCliche1?: string;
  refCliche2?: string;
  typeImpression?: string;
  sommeil: boolean;
  lastUpdate: number;
  localUpdate: number;
}

export const POSE_NEUTRE = 0;

export interface BobineFilleWithColor extends BobineFille {
  colors: BobineColors;
}

export interface BobineFilleWithPose extends BobineFilleWithColor {
  pose: number;
}

export interface BobineFilleWithMultiPose extends BobineFilleWithColor {
  availablePoses: number[];
  allPoses: number[];
}

export enum BobineState {
  Imperatif = 1,
  Rupture = 2,
  Alerte = 3,
  Neutre = 4,
  Surstock = 5,
}

export interface BobineQuantities {
  soldMin: number;
  soldMax: number;
  threshold: number;
  qtyToProduce: number;
}

export interface BobineMere {
  ref: string;
  designation?: string;
  laize?: number;
  longueur?: number;
  couleurPapier?: string;
  grammage?: number;
  sommeil: boolean;
  lastUpdate: number;
  localUpdate: number;
}

export interface Color {
  ref: string;
  name: string;
  backgroundHex: string;
  textHex: string;
  closeHex: string;
  hasBorder: boolean;
  description: string;
}

export interface ClicheBase {
  ref: string;
  designation?: string;
  nombrePosesA?: number;
  nombrePosesB?: number;
  nombrePosesC?: number;
  nombrePosesD?: number;
  couleur1?: string;
  couleur2?: string;
  couleur3?: string;
  couleur4?: string;
  couleur5?: string;
  couleur6?: string;
  importanceOrdreCouleurs: boolean;
  sommeil: boolean;
  lastUpdate: number;
  localUpdate: number;
}

export interface Cliche extends ClicheBase {
  nombrePosesA?: number;
  nombrePosesB?: number;
  nombrePosesC?: number;
  nombrePosesD?: number;
}

export interface ClicheWithPose extends ClicheBase {
  pose: number;
}

export interface Stock {
  id: string;
  ref: string;
  numDepot: number;
  reel: number;
  commande: number;
  reserve: number;
  lastUpdate: number;
  localUpdate: number;
}

export interface Vente {
  id: string;
  bobineRef: string;
  type: number;
  quantity: number;
  date: number;
  lastUpdate: number;
  localUpdate: number;
}

export interface Cadencier {
  localUpdate: number;
  bobineRef: string;
  ventes: {[key: number]: number};
}

export interface Perfo {
  ref: string;
  decalageInitial: number;
  cale1?: number;
  bague1?: number;
  cale2?: number;
  bague2?: number;
  cale3?: number;
  bague3?: number;
  cale4?: number;
  bague4?: number;
  cale5?: number;
  bague5?: number;
  cale6?: number;
  bague6?: number;
  cale7?: number;
  bague7?: number;
  sommeil: boolean;
  localUpdate: number;
}

export interface Refente {
  ref: string;
  refPerfo: string;
  decalage: number;
  laize1?: number;
  laize2?: number;
  laize3?: number;
  laize4?: number;
  laize5?: number;
  laize6?: number;
  laize7?: number;
  chute?: number;
  sommeil: boolean;
  localUpdate: number;
}

export interface PlanProductionState {
  selectedPolypro: BobineMere | undefined;
  selectedPapier: BobineMere | undefined;
  selectedPerfo: Perfo | undefined;
  selectedRefente: Refente | undefined;
  selectedBobines: BobineFilleWithPose[];

  selectablePolypros: BobineMere[];
  selectablePapiers: BobineMere[];
  selectablePerfos: Perfo[];
  selectableRefentes: Refente[];
  selectableBobines: BobineFilleWithMultiPose[];

  couleursEncrier: EncrierColor[][];
  tourCount?: number;
  calculationTime: number;
}

export interface PlanProductionInfo {
  index?: number;
  startTime?: number;
  endTime?: number;
  stopTime?: number;
  repriseTime?: number;
  operationAtStartOfDay: boolean;
  productionAtStartOfDay: boolean;
}

interface PlanProductionBase extends PlanProductionInfo {
  id: number;
  sommeil: boolean;
  localUpdate: number;
}

export interface PlanProductionRaw extends PlanProductionBase {
  data: string;
}

export enum PlanProductionStatus {
  DONE = 1,
  IN_PROGRESS = 2,
  PLANNED = 3,
}

export interface PlanProductionData {
  polypro: BobineMere;
  papier: BobineMere;
  perfo: Perfo;
  refente: Refente;
  bobines: BobineFilleWithPose[];
  bobinesMini: [string, number][];
  bobinesMax: [string, number][];
  encriers: EncrierColor[];

  tourCount: number;
  speed: number;
  comment: string;
  status: PlanProductionStatus;
}

export interface PlanProduction extends PlanProductionBase {
  data: PlanProductionData;
}

export interface NonProd {
  id: number;
  startTime: number;
  endTime: number;
}

export enum OperationGroup {
  Repartissable = 'repartissable',
  Aide = 'aide',
  Conducteur = 'conducteur',
  ChauffePerfo = 'chauffe-perfo',
  ChauffeRefente = 'chauffe-refente',
}

export interface Operation {
  ref: string;
  description: string;
  required: boolean;
  constraint: OperationConstraint;
  duration: number;
  group: string;
}

export enum OperationConstraint {
  None = 'none',
  ChangementPerforation = 'changement-perforation',
  ChangementRefente = 'changement-refente',
  ChangementBobinesMerePapier = 'changement-bobine-mere-papier',
  ChangementBobinesMerePolypro = 'changement-bobine-mere-polypro',
  RetraitCliche = 'retrait-cliche',
  AjoutCliche = 'ajout-cliche',
  VidageEncrier = 'vidage-encrier',
  RemplissageEncrier = 'remplissage-encrier',
  ClicheMultiCouleurs = 'cliche-multi-couleurs',
  AugmentationRefentes = 'augmentation-refentes',
}

export interface Operateur {
  id: number;
  name: string;
  sommeil: boolean;
  localUpdate: number;
  operationRefs: string[];
}

// export interface User {
//   username: string;
//   password: string;
//   permissions: number;
//   lastPing: number;
// }

export interface ServerErrorData {
  time: Date;
  msg: string;
  details: string;
}

export interface ServiceStatus {
  rowCount: number;
  rowCountSommeil?: number;
  lastUpdate: number;
}

export interface ServerStatus {
  automate: AutomateStatus;
  gescom: {[key: string]: ServiceStatus};
  errors: ServerErrorData[];
}

export interface AutomateStatus {
  firstMinute?: MinuteSpeed;
  lastMinute?: MinuteSpeed;
  rowCount: number;
}

export interface ClientAppInfo {
  type: ClientAppType;
  // tslint:disable-next-line:no-any
  data?: any;
}

export enum ClientAppType {
  MainApp = 'MainApp',
  ListBobinesFillesApp = 'ListBobinesFillesApp',
  ListPolyprosApp = 'ListPolyprosApp',
  ListPapiersApp = 'ListPapiersApp',
  ListClichesApp = 'ListClichesApp',
  ViewBobineApp = 'ViewBobineApp',
  PlanProductionEditorApp = 'PlanProductionEditorApp',
  BobinesPickerApp = 'BobinesPickerApp',
  RefentePickerApp = 'RefentePickerApp',
  PerfoPickerApp = 'PerfoPickerApp',
  PapierPickerApp = 'PapierPickerApp',
  PolyproPickerApp = 'PolyproPickerApp',
}

export interface MinuteSpeed {
  minute: number;
  speed?: number;
}

export interface ContextMenuForBridge {
  id: string;
  label: string;
  disabled?: boolean;
  submenus?: ContextMenuForBridge[];
}
