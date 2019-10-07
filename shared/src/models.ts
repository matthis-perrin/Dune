import {BobineColors, EncrierColor} from '@shared/lib/encrier';

export interface Config {
  hasGestionPlan: boolean;
  hasStopPopups: boolean;
  hasGestionPage: boolean;
  hasGescomPage: boolean;
  hasProductionPage: boolean;
  hasStatsPage: boolean;
  hasRapportPage: boolean;
}

export interface BobineFille {
  ref: string;
  designation?: string;
  designationOperateur?: string;
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

interface OperationDetail {
  description: string;
  constraint: OperationConstraint;
  quantity: number;
  duration: number;
}

export interface OperationSplit {
  total: number;
  operations: OperationDetail[];
}

export interface OperationSplits {
  conducteur: OperationSplit;
  aideConducteur: OperationSplit;
  chauffePerfo: OperationSplit;
  chauffeRefente: OperationSplit;
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
  index: number;
  operationAtStartOfDay: boolean;
  productionAtStartOfDay: boolean;
}

interface PlanProductionBase extends PlanProductionInfo {
  id: number;
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
}

export interface PlanProduction extends PlanProductionBase {
  data: PlanProductionData;
}

export interface PlanProdSchedule {
  status: PlanProductionStatus;
  planProd: PlanProduction;
  // Done
  prods: Prod[];
  stops: Stop[];
  doneOperationsMs: number;
  doneProdMs: number;
  doneProdMeters: number;
  // Planned
  plannedProds: Prod[];
  plannedStops: Stop[];
  plannedOperationsMs: number;
  plannedProdMs: number;
  plannedProdMeters: number;
}

export interface ScheduledPlanProd {
  planProd: PlanProduction;
  operations: OperationSplits;
  schedulePerDay: Map<number, PlanProdSchedule>;
}

export interface Schedule {
  lastSpeedTime?: SpeedTime;
  plans: ScheduledPlanProd[];
  unassignedStops: Stop[];
  unassignedProds: Prod[];
  maintenances: Maintenance[];
  nonProds: NonProd[];
  prodHours: Map<string, ProdRange>;
  stops: Stop[];
}

export interface Maintenance {
  id: number;
  title: string;
  start: number;
  end: number;
}

export interface NonProd {
  id: number;
  title: string;
  start: number;
  end: number;
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
  isDev: boolean;
}

export interface SpeedStatus {
  firstMinute?: SpeedTime;
  lastMinute?: SpeedTime;
  rowCount: number;
  lastReceived?: SpeedTime;
}

export interface StopStatus {
  lastStop?: Stop;
}

export interface AutomateStatus extends SpeedStatus, StopStatus {}

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
  ViewDayApp = 'ViewDayApp',
  ProductionApp = 'ProductionApp',
  StopApp = 'StopApp',
  StatisticsApp = 'StatisticsApp',
  ReportsApp = 'ReportsApp',
  ReportsPrinterApp = 'ReportsPrinterApp',
  PlanProdPrinterApp = 'PlanProdPrinterApp',
}

export interface SpeedTime {
  time: number;
  speed?: number;
}

export interface HourStats {
  hour: number;
  avgSpeed?: number;
  medianSpeed?: number;
  firstSpeed?: number;
  lastSpeed?: number;
  minSpeed?: number;
  maxSpeed?: number;
  speedCount: number;
  nullCount: number;
}

export interface AutomateEvent {
  start: number;
  end?: number;
  planProdId?: number;
}

export interface Prod extends AutomateEvent {
  avgSpeed?: number;
}

export interface Stop extends AutomateEvent {
  stopType?: StopType;
  stopInfo?: StopInfo;
  maintenanceId?: number;
  title?: string;
}

export interface StopInfo {
  unplannedStops: UnplannedStop[];
  cleanings: Cleaning[];
  comments: string[];
}

export enum StopType {
  ChangePlanProd = 'ChangePlanProd',
  ReglagesAdditionel = 'ReglagesAdditionel',
  ReprisePlanProd = 'ReprisePlanProd',
  ChangeBobinePapier = 'ChangeBobinePapier',
  ChangeBobinePolypro = 'ChangeBobinePolypro',
  ChangeBobinePapierAndPolypro = 'ChangeBobinePapierAndPolypro',
  EndOfDayEndProd = 'EndOfDayEndProd',
  EndOfDayPauseProd = 'EndOfDayPauseProd',
  Maintenance = 'Maintenance',
  Unplanned = 'Unplanned',
  NotProdHours = 'NotProdHours',
}

export interface ContextMenuForBridge {
  id: string;
  label: string;
  disabled?: boolean;
  submenus?: ContextMenuForBridge[];
}

export interface ScheduleInfo {
  stops: Stop[];
  prods: Prod[];
  notStartedPlans: PlanProductionRaw[];
  startedPlans: PlanProductionRaw[];
  maintenances: Maintenance[];
  nonProds: NonProd[];
  prodHours: ProdHours[];
  lastSpeedTime?: SpeedTime;
}

export interface ProdInfo {
  speedTimes: SpeedTime[];
}

export interface UnplannedStop {
  name: string;
  label: string;
  group: string;
  order: number;
}

export interface Cleaning {
  name: string;
  label: string;
  order: number;
}

export interface ProdHours extends ProdRange {
  day: string;
}

export interface ProdHourInfo {
  prodHours: ProdHours[];
  nonProds: NonProd[];
}

export interface ProdRange {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

// Statistics Models

export interface StatsData {
  days: Map<number, PlanDayStats[]>;
}

export interface PlanDayStats {
  morningProds: ProdStat[];
  afternoonProds: ProdStat[];
  morningStops: StopStat[];
  afternoonStops: StopStat[];
  planTotalOperationDone: number;
  planTotalOperationPlanned: number;
  repriseProdDone: number;
}

export interface ProdStat {
  metrage: number;
  duration: number;
}

export interface StopStat {
  type: StopType;
  duration: number;
  ratio: number;
}

export interface Constants {
  nombreEncriers: number; // 3
  maxSpeed: number; // 180
  maxSpeedRatio: number; // 0.82
  reglageRepriseProdMs: number; // 20 * 60 * 1000
}
