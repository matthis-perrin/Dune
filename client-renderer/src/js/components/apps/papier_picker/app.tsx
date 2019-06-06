import * as React from 'react';

import {Picker} from '@root/components/common/picker';
import {SizeMonitor} from '@root/components/core/size_monitor';
import {bridge} from '@root/lib/bridge';
import {CAPACITE_MACHINE} from '@root/lib/constants';
import {bobinesMeresStore} from '@root/stores/list_store';
import {theme} from '@root/theme/default';

import {BobineMere} from '@shared/models';

interface Props {}

export class PapierPickerApp extends React.Component<Props> {
  public static displayName = 'PapierPickerApp';

  constructor(props: Props) {
    super(props);
  }

  private readonly handlePapierSelected = (bobineMere: BobineMere) => {
    bridge
      .setPlanPapier(bobineMere.ref)
      .then(() => {
        bridge.closeApp().catch(console.error);
      })
      .catch(console.error);
  };

  public render(): JSX.Element {
    return (
      <Picker<BobineMere>
        getHash={p => p.ref}
        getSelectable={p => p.selectablePapiers}
        store={bobinesMeresStore}
        title="Choix du papier"
        dataFilter={p => p.couleurPapier !== 'POLYPRO'}
      >
        {(elements, isSelectionnable) => (
          <SizeMonitor>
            {width => {
              const availableWidth = width - 2 * theme.page.padding;
              const pixelPerMM = availableWidth / CAPACITE_MACHINE;
              return (
                <div style={{width}}>
                  {elements.map(papier => {
                    const enabled = isSelectionnable(papier);
                    return (
                      <div
                        onClick={() => this.handlePapierSelected(papier)}
                      >{`${pixelPerMM} / ${enabled} / ${JSON.stringify(papier)}`}</div>
                    );
                  })}
                </div>
              );
            }}
          </SizeMonitor>
        )}
      </Picker>
    );
  }
}
