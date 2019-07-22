export type BridgeCommand = string & {_: 'bridgeCommand'};

export const ListUsers = 'list-users' as BridgeCommand;
export const ListBobinesFilles = 'list-bobines-filles' as BridgeCommand;
export const ListBobinesMeres = 'list-bobines-meres' as BridgeCommand;
export const ListCliches = 'list-cliches' as BridgeCommand;
export const ListStocks = 'list-stocks' as BridgeCommand;
export const ListPerfos = 'list-perfos' as BridgeCommand;
export const ListRefentes = 'list-refentes' as BridgeCommand;
export const ListCadencier = 'list-cadencier' as BridgeCommand;
export const ListCadencierForBobine = 'list-cadencier-for-bobine' as BridgeCommand;
export const ListBobinesQuantities = 'list-bobines-quantities' as BridgeCommand;
export const ListColors = 'list-colors' as BridgeCommand;
export const ListPlansProduction = 'list-plans-production' as BridgeCommand;

export const GetAppInfo = 'get-app-info' as BridgeCommand;
export const OpenApp = 'open-app' as BridgeCommand;
export const CloseApp = 'close-app' as BridgeCommand;
export const CloseAppOfType = 'close-app-of-type' as BridgeCommand;
export const SaveToPDF = 'save-to-pdf' as BridgeCommand;
export const Print = 'print' as BridgeCommand;

export const CreateNewPlanProduction = 'create-new-plan-production' as BridgeCommand;
export const DeletePlanProduction = 'delete-plan-production' as BridgeCommand;
export const MovePlanProduction = 'move-plan-production' as BridgeCommand;
export const SaveNewPlanProduction = 'save-new-plan-production' as BridgeCommand;
export const UpdatePlanProduction = 'update-plan-production' as BridgeCommand;
export const UpdatePlanProductionInfo = 'update-plan-production-info' as BridgeCommand;

export const GetPlanProductionEngineInfo = 'get-plan-prod-engine-info' as BridgeCommand;
export const GetPlanProduction = 'get-plan-prod' as BridgeCommand;
export const SetPlanTourCount = 'set-plan-tour-count' as BridgeCommand;
export const SetPlanPerfo = 'set-plan-perfo' as BridgeCommand;
export const SetPlanRefente = 'set-plan-refente' as BridgeCommand;
export const SetPlanPapier = 'set-plan-papier' as BridgeCommand;
export const SetPlanPolypro = 'set-plan-polypro' as BridgeCommand;
export const AddPlanBobine = 'add-plan-bobine' as BridgeCommand;
export const RemovePlanBobine = 'remove-plan-bobine' as BridgeCommand;
export const ClearPlan = 'clear-plan' as BridgeCommand;

export const GetProdInfo = 'get-prod-info' as BridgeCommand;

export const ListOperations = 'list-operations' as BridgeCommand;
export const ListUnplannedStops = 'list-unplanned-stops' as BridgeCommand;
export const CreateOrUpdateOperation = 'create-or-update-operation' as BridgeCommand;

export const ListOperateurs = 'list-operateurs' as BridgeCommand;
export const CreateOrUpdateOperateur = 'create-or-update-operateur' as BridgeCommand;

export const ServerGetStatus = 'server-get-status' as BridgeCommand;
export const ServerRequestRefresh = 'server-request-refresh' as BridgeCommand;
export const ServerClearErrors = 'server-clear-errors' as BridgeCommand;
export const ServerSimulateAutomate = 'server-simulate-automate' as BridgeCommand;

export const OpenContextMenu = 'open-context-menu' as BridgeCommand;

export type BridgeEvent = string & {_: 'bridgeEvent'};

export const PlanProductionChanged = 'plan-production-changed' as BridgeEvent;
export const ContextMenuClicked = 'context-menu-clicked' as BridgeEvent;
export const ContextMenuClosed = 'context-menu-closed' as BridgeEvent;
