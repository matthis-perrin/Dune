import * as React from 'react';

import {Picker} from '@root/components/common/picker';
import {SizeMonitor} from '@root/components/core/size_monitor';
import {bridge} from '@root/lib/bridge';
import {CAPACITE_MACHINE} from '@root/lib/constants';
import {bobinesMeresStore} from '@root/stores/list_store';
import {theme} from '@root/theme/default';

import {BobineMere} from '@shared/models';

interface Props {}

export class PolyproPickerApp extends React.Component<Props> {
  public static displayName = 'PolyproPickerApp';

  constructor(props: Props) {
    super(props);
  }

  private readonly handlePolyproSelected = (bobineMere: BobineMere) => {
    bridge
      .setPlanPolypro(bobineMere.ref)
      .then(() => {
        bridge.closeApp().catch(console.error);
      })
      .catch(console.error);
  };

  public render(): JSX.Element {
    return (
      <Picker<BobineMere>
        getHash={r => r.ref}
        getSelectable={p => p.selectablePolypros}
        store={bobinesMeresStore}
        title="Choix du polypro"
      >
        {(elements, isSelectionnable) => (
          <SizeMonitor>
            {width => {
              const availableWidth = width - 2 * theme.page.padding;
              const pixelPerMM = availableWidth / CAPACITE_MACHINE;
              return (
                <div style={{width}}>
                  {elements.map(polypro => {
                    const enabled = isSelectionnable(polypro);
                    return (
                      <div
                        onClick={() => this.handlePolyproSelected(polypro)}
                      >{`${pixelPerMM} / ${enabled} / ${JSON.stringify(polypro)}`}</div>
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
