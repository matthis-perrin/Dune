export type BridgeCommand = string & {_: 'bridgeCommand'};

export const ListUsers = 'list-users' as BridgeCommand;
export const ListBobinesFilles = 'list-bobines-filles' as BridgeCommand;
export const ListBobinesMeres = 'list-bobines-meres' as BridgeCommand;
export const ListCliches = 'list-cliches' as BridgeCommand;
export const ListStocks = 'list-stocks' as BridgeCommand;
export const ListPerfos = 'list-perfos' as BridgeCommand;
export const ListRefentes = 'list-refentes' as BridgeCommand;

export const GetAppInfo = 'get-app-info' as BridgeCommand;
export const OpenApp = 'open-app' as BridgeCommand;
export const CloseApp = 'close-app' as BridgeCommand;

export const ListOperations = 'list-operations' as BridgeCommand;
export const CreateOrUpdateOperation = 'create-or-update-operation' as BridgeCommand;

export const ListOperateurs = 'list-operateurs' as BridgeCommand;
export const CreateOrUpdateOperateur = 'create-or-update-operateur' as BridgeCommand;

export const ServerGetStatus = 'server-get-status' as BridgeCommand;
export const ServerRequestRefresh = 'server-request-refresh' as BridgeCommand;
export const ServerClearErrors = 'server-clear-errors' as BridgeCommand;

export type BridgeEvent = string & {_: 'bridgeEvent'};

export const PlanProductionChanged = 'plan-production-changed' as BridgeEvent;
