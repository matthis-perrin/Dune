import {isEqual, difference} from 'lodash-es';

import {
  compatibilityExists,
  applyBobinesOnRefente,
  RefenteStatus,
  uniqByLaizePoseAndColor,
  getSelectedBobinesCombinaison,
} from '@root/lib/plan_production/bobines_refentes_compatibility';
import {getBobineHash} from '@root/lib/plan_production/data_extraction/bobine_fille';
import {BobineFilleClichePose, Refente} from '@root/lib/plan_production/model';

// tslint:disable:no-magic-numbers variable-name

export function debugBobines(selectedBobines: BobineFilleClichePose[]): string {
  return selectedBobines.map(b => `${b.laize}-${b.pose}`).join(' ');
}

const dummyBobineTemplate = {
  ref: 'dummy-ref',
  couleurPapier: 'dummy-couleur-papier',
  grammage: 13,
  refCliche: 'dummy-ref-cliche',
  couleursImpression: [] as string[],
  importanceOrdreCouleurs: false,
};

const dummyRefenteTemplate = {
  ref: 'dummy-ref',
  refPerfo: 'dummy-ref-perfo',
  laize: 0,
};

function dummyB(laize: number, pose: number): BobineFilleClichePose {
  const {couleursImpression, importanceOrdreCouleurs} = dummyBobineTemplate;
  const hash = getBobineHash(laize, pose, importanceOrdreCouleurs, couleursImpression);
  return {...dummyBobineTemplate, laize, pose, hash};
}

function dummyBC(
  laize: number,
  pose: number,
  couleursImpression: string[],
  importanceOrdreCouleurs: boolean
): BobineFilleClichePose {
  const hash = getBobineHash(laize, pose, importanceOrdreCouleurs, couleursImpression);
  return {...dummyBobineTemplate, laize, pose, couleursImpression, importanceOrdreCouleurs, hash};
}

function dummyR(laizes: number[]): Refente {
  return {...dummyRefenteTemplate, laizes};
}

export function runTest(): void {
  testGetSelectedBobinesCombinaison();
  testApplyBobinesOnRefente();
  testCompatibilityExists();
  testUniqByLaizePoseAndColor();
}

function testCompatibilityExists(): void {
  const b140_1_A = dummyB(140, 1);
  const b140_1_B = dummyB(140, 1);
  const b140_1_C = dummyB(140, 1);
  const b140_2_A = dummyB(140, 2);
  const b140_3_A = dummyB(140, 3);
  const b140_4_A = dummyB(140, 4);
  const b150_1_A = dummyB(150, 1);

  const tests: {
    selected: BobineFilleClichePose[];
    selectable: BobineFilleClichePose[];
    refente: Refente;
    expected: BobineFilleClichePose[] | undefined;
  }[] = [
    {
      selected: [b140_1_A, b140_1_B, b140_1_C],
      selectable: [b140_2_A, b140_3_A, b140_4_A],
      refente: dummyR([140, 140, 140, 140]),
      expected: undefined,
    },
    {
      selected: [b140_1_A, b150_1_A, b140_1_B],
      selectable: [b140_2_A, b140_3_A, b140_4_A],
      refente: dummyR([140, 140, 140, 150, 140]),
      expected: [b140_2_A, b140_1_A, b150_1_A, b140_1_B],
    },
  ];

  tests.forEach(test => {
    const res = compatibilityExists(test.selected, test.selectable, test.refente);
    if (!isEqual(res, test.expected)) {
      console.log('Error with test testCompatibilityExists for ', test, res);
    }
  });
}

function testGetSelectedBobinesCombinaison(): void {
  const tests: {selected: BobineFilleClichePose[]; expected: string}[] = [
    {selected: [dummyB(140, 1), dummyB(140, 1), dummyB(140, 1)], expected: '140-1/140-1/140-1'},
    {
      selected: [dummyB(140, 2), dummyB(140, 2), dummyB(140, 1)],
      expected: '140-2/140-2/140-1 + 140-2/140-1/140-2 + 140-1/140-2/140-2',
    },
    {
      selected: [dummyB(150, 1), dummyB(140, 2), dummyB(140, 1)],
      expected:
        '150-1/140-2/140-1 + 150-1/140-1/140-2 + 140-2/150-1/140-1 + 140-2/140-1/150-1 + 140-1/150-1/140-2 + 140-1/140-2/150-1',
    },
    {selected: [dummyB(150, 1)], expected: '150-1'},
    {selected: [dummyB(150, 1), dummyB(140, 1)], expected: '150-1/140-1 + 140-1/150-1'},
    {selected: [dummyB(150, 1), dummyB(150, 1)], expected: '150-1/150-1'},
  ];
  const resultToString = (res: BobineFilleClichePose[][]): string =>
    res.map(b => b.map(bb => `${bb.laize}-${bb.pose}`).join('/')).join(' + ');

  tests.forEach(test => {
    const res = resultToString(getSelectedBobinesCombinaison(test.selected));
    if (res !== test.expected) {
      console.log('Error with test for testGetSelectedBobinesCombinaison', test, res);
    }
  });
}

function testApplyBobinesOnRefente(): void {
  const tests: {bobines: BobineFilleClichePose[]; refente: Refente; expected: RefenteStatus}[] = [
    {
      bobines: [],
      refente: dummyR([140, 140, 140, 140]),
      expected: RefenteStatus.COMPATIBLE_WITH_SPACE_LEFT_AND_ON_NEXT_POSITION,
    },
    {
      bobines: [dummyB(150, 1)],
      refente: dummyR([140, 140, 140, 140]),
      expected: RefenteStatus.INCOMPATIBLE,
    },
    {
      bobines: [dummyB(140, 3), dummyB(150, 1)],
      refente: dummyR([140, 140, 140, 140]),
      expected: RefenteStatus.INCOMPATIBLE,
    },
    {
      bobines: [dummyB(140, 4), dummyB(150, 1)],
      refente: dummyR([140, 140, 140, 140]),
      expected: RefenteStatus.INCOMPATIBLE,
    },
    {
      bobines: [dummyB(140, 1), dummyB(140, 1), dummyB(140, 1), dummyB(140, 1), dummyB(150, 1)],
      refente: dummyR([140, 140, 140, 140]),
      expected: RefenteStatus.INCOMPATIBLE,
    },
    {
      bobines: [dummyB(140, 3), dummyB(140, 1)],
      refente: dummyR([140, 140, 140, 140]),
      expected: RefenteStatus.COMPATIBLE,
    },
    {
      bobines: [dummyB(140, 4), dummyB(140, 1)],
      refente: dummyR([140, 140, 140, 140]),
      expected: RefenteStatus.INCOMPATIBLE,
    },
    {
      bobines: [dummyB(140, 1), dummyB(140, 1), dummyB(140, 1), dummyB(140, 1), dummyB(140, 1)],
      refente: dummyR([140, 140, 140, 140]),
      expected: RefenteStatus.INCOMPATIBLE,
    },
    {
      bobines: [dummyB(140, 1), dummyB(140, 1), dummyB(140, 1), dummyB(140, 1)],
      refente: dummyR([140, 140, 140, 140]),
      expected: RefenteStatus.COMPATIBLE,
    },
    {
      bobines: [dummyB(140, 1), dummyB(150, 1), dummyB(140, 1), dummyB(130, 2)],
      refente: dummyR([140, 150, 140, 130, 130]),
      expected: RefenteStatus.COMPATIBLE,
    },
    {
      bobines: [dummyB(140, 1), dummyB(150, 1), dummyB(140, 1), dummyB(130, 3)],
      refente: dummyR([140, 150, 140, 130, 130]),
      expected: RefenteStatus.INCOMPATIBLE,
    },
    {
      bobines: [dummyB(140, 1), dummyB(150, 1), dummyB(140, 1), dummyB(130, 1)],
      refente: dummyR([140, 150, 140, 130, 130]),
      expected: RefenteStatus.COMPATIBLE_WITH_SPACE_LEFT,
    },
  ];

  tests.forEach(test => {
    const res = applyBobinesOnRefente(test.bobines, test.refente);
    if (res !== test.expected) {
      console.log('Error with test for testApplyBobinesOnRefente', test, res);
    }
  });
}

function testUniqByLaizePoseAndColor(): void {
  const a1 = dummyBC(140, 2, [], false);
  const b1 = dummyBC(140, 2, [], true);
  const c1 = dummyBC(140, 2, ['ROUGE'], true);
  const d1 = dummyBC(140, 2, ['BLANC'], true);
  const e1 = dummyBC(140, 2, ['BLANC', 'VERT'], true);
  const f1 = dummyBC(140, 2, ['VERT', 'BLANC'], true);
  const g1 = dummyBC(140, 2, ['BLANC', 'VERT'], false);
  const h1 = dummyBC(140, 2, ['VERT', 'BLANC'], false);
  const a2 = dummyBC(140, 2, [], false);
  const b2 = dummyBC(140, 2, [], true);
  const c2 = dummyBC(140, 2, ['ROUGE'], true);
  const d2 = dummyBC(140, 2, ['BLANC'], true);
  const e2 = dummyBC(140, 2, ['BLANC', 'VERT'], true);
  const f2 = dummyBC(140, 2, ['VERT', 'BLANC'], true);
  const g2 = dummyBC(140, 2, ['BLANC', 'VERT'], false);
  const h2 = dummyBC(140, 2, ['VERT', 'BLANC'], false);
  const a3 = dummyBC(150, 2, [], false);
  const b3 = dummyBC(150, 2, [], true);
  const c3 = dummyBC(150, 2, ['ROUGE'], true);
  const d3 = dummyBC(150, 2, ['BLANC'], true);
  const e3 = dummyBC(150, 2, ['BLANC', 'VERT'], true);
  const f3 = dummyBC(150, 2, ['VERT', 'BLANC'], true);
  const g3 = dummyBC(150, 2, ['BLANC', 'VERT'], false);
  const h3 = dummyBC(150, 2, ['VERT', 'BLANC'], false);
  const a4 = dummyBC(140, 3, [], false);
  const b4 = dummyBC(140, 3, [], true);
  const c4 = dummyBC(140, 3, ['ROUGE'], true);
  const d4 = dummyBC(140, 3, ['BLANC'], true);
  const e4 = dummyBC(140, 3, ['BLANC', 'VERT'], true);
  const f4 = dummyBC(140, 3, ['VERT', 'BLANC'], true);
  const g4 = dummyBC(140, 3, ['BLANC', 'VERT'], false);
  const h4 = dummyBC(140, 3, ['VERT', 'BLANC'], false);

  const bobines1 = [a1, b1, c1, d1, e1, f1, g1, h1];
  const bobines2 = [a2, b2, c2, d2, e2, f2, g2, h2];
  const bobines3 = [a3, b3, c3, d3, e3, f3, g3, h3];
  const bobines4 = [a4, b4, c4, d4, e4, f4, g4, h4];
  const bobines = bobines1
    .concat(bobines2)
    .concat(bobines3)
    .concat(bobines4);
  const res = uniqByLaizePoseAndColor(bobines);

  const expected1 = [a1, c1, d1, e1, f1, g1];
  const expected3 = [a3, c3, d3, e3, f3, g3];
  const expected4 = [a4, c4, d4, e4, f4, g4];
  const expected = expected1.concat(expected3).concat(expected4);

  if (!isEqual(res, expected)) {
    console.log(
      'Error with test testUniqByLaizePoseAndColor, diff:',
      difference(res, expected),
      difference(expected, res)
    );
  }
}

// tslint:enable:no-magic-numbers variable-name
