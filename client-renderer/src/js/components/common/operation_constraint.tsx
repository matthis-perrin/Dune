import React from 'react';
import {OperationConstraint as OperationConstraintModel} from '@shared/models';

interface OperationConstraintProps {
  constraint: OperationConstraintModel;
}

// TODO - Ajouter une contrainte "Pas debut de journee + Change de perfo" pour ajouter
// l'operation changement de perfo en milieu de journee

export const ConstraintDescriptions = new Map<OperationConstraintModel, string>([
  [OperationConstraintModel.None, 'Aucune'],
  [OperationConstraintModel.ChangementPerforation, 'Changement de perforation'],
  [OperationConstraintModel.ChangementRefente, 'Changement de refente'],
  [OperationConstraintModel.ChangementBobinesMerePapier, 'Changement de bobine mère papier'],
  [OperationConstraintModel.ChangementBobinesMerePolypro, 'Changement de bobine mère polypro'],
  // retirer un ou plusieurs cliche d'une meme couleur (n'inclus pas poser le nouveau cliche)
  [
    OperationConstraintModel.RetraitCliche,
    "Cliché du plan de production précédent n'est plus utilisé",
  ],
  [OperationConstraintModel.AjoutCliche, 'Nouveau cliché est utilisé'],
  [OperationConstraintModel.VidageEncrier, "Vidage d'un encrier"],
  [OperationConstraintModel.RemplissageEncrier, "Remplissage d'un encrier"],
  [OperationConstraintModel.AugmentationRefentes, 'Augmentation du nombre de refentes'],
  [OperationConstraintModel.ClicheMultiCouleurs, 'Nouveau cliché multi-couleurs utilisé'],
]);

export class OperationConstraint extends React.Component<OperationConstraintProps> {
  public static displayName = 'OperationConstraint';

  public render(): JSX.Element {
    const {constraint} = this.props;
    const description = ConstraintDescriptions.get(constraint) || '?';

    return <span>{description}</span>;
  }
}
