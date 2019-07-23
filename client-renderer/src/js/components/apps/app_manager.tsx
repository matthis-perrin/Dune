import * as React from 'react';
import styled from 'styled-components';

import {BobinesPickerApp} from '@root/components/apps/bobines_picker/app';
import {ListBobinesFillesApp} from '@root/components/apps/list_bobines_filles/app';
import {ListClichesApp} from '@root/components/apps/list_cliches/app';
import {ListPapiersApp} from '@root/components/apps/list_papiers/app';
import {ListPolyprosApp} from '@root/components/apps/list_polypros/app';
import {MainApp} from '@root/components/apps/main/app';
import {PapierPickerApp} from '@root/components/apps/papier_picker/app';
import {PerfoPickerApp} from '@root/components/apps/perfo_picker/app';
import {PlanProdEditorApp} from '@root/components/apps/plan_prod_editor/app';
import {PolyproPickerApp} from '@root/components/apps/polypro_picker/app';
import {ProductionApp} from '@root/components/apps/production/app';
import {RefentePickerApp} from '@root/components/apps/refente_picker/app';
import {StopApp} from '@root/components/apps/stop/app';
import {ViewBobineApp} from '@root/components/apps/view_bobine/app';
import {ViewDayApp} from '@root/components/apps/view_day_app/app';
import {LoadingScreen} from '@root/components/core/loading_screen';
import {GlobalStyle} from '@root/components/global_styles';
import {Modal} from '@root/components/modal';
import {bridge} from '@root/lib/bridge';
import {
  bobinesQuantitiesStore,
  colorsStore,
  operationsStore,
  unplannedStopsStore,
  cleaningsStore,
} from '@root/stores/data_store';
import {
  bobinesFillesStore,
  bobinesMeresStore,
  stocksStore,
  clichesStore,
  perfosStore,
  refentesStore,
  bobinesFillesWithMultiPoseStore,
  cadencierStore,
  plansProductionStore,
} from '@root/stores/list_store';
import {Refreshable, StoreManager} from '@root/stores/store_manager';

import {ClientAppInfo, ClientAppType} from '@shared/models';
import {asMap, asString, asNumber, asBoolean} from '@shared/type_utils';

interface Props {
  windowId: string;
}

interface State {
  appInfo?: ClientAppInfo;
  error?: string;
}

export class AppManager extends React.Component<Props, State> {
  public static displayName = 'AppManager';
  private storeManager: StoreManager | undefined;

  public constructor(props: Props) {
    super(props);
    this.state = {};
  }

  public componentDidMount(): void {
    bridge
      .getAppInfo(this.props.windowId)
      .then(appInfo => {
        this.storeManager = new StoreManager(this.getStoresForApp(appInfo));
        this.storeManager.start();
        this.setState({appInfo});
      })
      .catch(err => this.setState({error: err as string}));
  }

  private getStoresForApp(appInfo: ClientAppInfo): Refreshable[] {
    const {type} = appInfo;
    if (type === ClientAppType.MainApp) {
      return StoreManager.AllStores;
    }
    if (type === ClientAppType.ListBobinesFillesApp) {
      return [bobinesFillesStore, stocksStore, colorsStore, plansProductionStore];
    }
    if (type === ClientAppType.ListPapiersApp) {
      return [bobinesMeresStore, stocksStore, colorsStore, plansProductionStore];
    }
    if (type === ClientAppType.ListPolyprosApp) {
      return [bobinesMeresStore, stocksStore, colorsStore, plansProductionStore];
    }
    if (type === ClientAppType.ListClichesApp) {
      return [clichesStore, colorsStore];
    }

    if (type === ClientAppType.PlanProductionEditorApp) {
      return [
        stocksStore,
        cadencierStore,
        bobinesQuantitiesStore,
        colorsStore,
        plansProductionStore,
        operationsStore,
      ];
    }
    if (type === ClientAppType.BobinesPickerApp) {
      return [
        bobinesFillesStore,
        clichesStore,
        bobinesFillesWithMultiPoseStore,
        stocksStore,
        cadencierStore,
        bobinesQuantitiesStore,
        colorsStore,
        plansProductionStore,
      ];
    }
    if (type === ClientAppType.RefentePickerApp) {
      return [refentesStore];
    }
    if (type === ClientAppType.PerfoPickerApp) {
      return [perfosStore];
    }
    if (type === ClientAppType.PapierPickerApp) {
      return [bobinesMeresStore, stocksStore, colorsStore, plansProductionStore];
    }
    if (type === ClientAppType.PolyproPickerApp) {
      return [bobinesMeresStore, stocksStore, colorsStore, plansProductionStore];
    }

    if (type === ClientAppType.ViewBobineApp) {
      return [
        bobinesFillesStore,
        clichesStore,
        stocksStore,
        colorsStore,
        bobinesQuantitiesStore,
        cadencierStore,
      ];
    }

    if (type === ClientAppType.ViewDayApp) {
      return [
        colorsStore,
        stocksStore,
        cadencierStore,
        bobinesQuantitiesStore,
        plansProductionStore,
        operationsStore,
      ];
    }

    if (type === ClientAppType.ProductionApp) {
      return [
        colorsStore,
        stocksStore,
        cadencierStore,
        bobinesQuantitiesStore,
        plansProductionStore,
        operationsStore,
        unplannedStopsStore,
        cleaningsStore,
      ];
    }
    if (type === ClientAppType.StopApp) {
      return [unplannedStopsStore, cleaningsStore];
    }

    return [];
  }

  private renderForApp(appInfo: ClientAppInfo): JSX.Element {
    const {data, type} = appInfo;

    if (type === ClientAppType.MainApp) {
      return <MainApp />;
    }
    if (type === ClientAppType.ListBobinesFillesApp) {
      return <ListBobinesFillesApp />;
    }
    if (type === ClientAppType.ListPapiersApp) {
      return <ListPapiersApp />;
    }
    if (type === ClientAppType.ListPolyprosApp) {
      return <ListPolyprosApp />;
    }
    if (type === ClientAppType.ListClichesApp) {
      return <ListClichesApp />;
    }

    if (type === ClientAppType.PlanProductionEditorApp) {
      const {id, isCreating} = asMap(data);
      return <PlanProdEditorApp id={asNumber(id, 0)} isCreating={asBoolean(isCreating)} />;
    }
    if (type === ClientAppType.BobinesPickerApp) {
      const {id} = asMap(data);
      return <BobinesPickerApp id={asNumber(id, 0)} />;
    }
    if (type === ClientAppType.RefentePickerApp) {
      const {id} = asMap(data);
      return <RefentePickerApp id={asNumber(id, 0)} />;
    }
    if (type === ClientAppType.PerfoPickerApp) {
      const {id} = asMap(data);
      return <PerfoPickerApp id={asNumber(id, 0)} />;
    }
    if (type === ClientAppType.PapierPickerApp) {
      const {id} = asMap(data);
      return <PapierPickerApp id={asNumber(id, 0)} />;
    }
    if (type === ClientAppType.PolyproPickerApp) {
      const {id} = asMap(data);
      return <PolyproPickerApp id={asNumber(id, 0)} />;
    }

    if (type === ClientAppType.ViewBobineApp) {
      const {bobineRef} = asMap(data);
      return <ViewBobineApp bobineRef={asString(bobineRef, '')} />;
    }

    if (type === ClientAppType.ViewDayApp) {
      const {initialDay} = asMap(data);
      return <ViewDayApp initialDay={initialDay} />;
    }

    if (type === ClientAppType.ProductionApp) {
      const {initialDay} = asMap(data);
      return <ProductionApp initialDay={initialDay} />;
    }
    if (type === ClientAppType.StopApp) {
      const {day, stopStart} = asMap(data);
      return <StopApp day={day} stopStart={stopStart} />;
    }

    return (
      <TempWrapper>
        <div>Unknown App:</div>
        <pre>{JSON.stringify(appInfo, undefined, 2)}</pre>
      </TempWrapper>
    );
  }

  public renderContent(): JSX.Element {
    const {appInfo, error} = this.state;

    if (error) {
      return (
        <TempWrapper>
          <pre>{error}</pre>
        </TempWrapper>
      );
    }

    if (appInfo) {
      return this.renderForApp(appInfo);
    }

    return <LoadingScreen />;
  }

  public render(): JSX.Element {
    return (
      <React.Fragment>
        <GlobalStyle />
        {this.renderContent()}
        <Modal />
      </React.Fragment>
    );
  }
}

const TempWrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
`;
