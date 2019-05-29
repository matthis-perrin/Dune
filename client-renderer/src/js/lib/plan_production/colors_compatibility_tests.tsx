import {
  checkColorsAreCompatbile,
  ColorRetriction,
} from '@root/lib/plan_production/colors_compatibility';

const tests: {restrictions: ColorRetriction[]; maxColors: number; expected: boolean}[] = [
  {restrictions: [], maxColors: 3, expected: true},
  {restrictions: [], maxColors: 0, expected: true},
  {restrictions: [{couleurs: [], importanceOrdre: true}], maxColors: 3, expected: true},
  {restrictions: [{couleurs: [], importanceOrdre: true}], maxColors: 0, expected: true},
  {restrictions: [{couleurs: [], importanceOrdre: true}], maxColors: 3, expected: true},
  {restrictions: [{couleurs: ['c1'], importanceOrdre: true}], maxColors: 0, expected: false},
  {restrictions: [{couleurs: ['c1'], importanceOrdre: true}], maxColors: 3, expected: true},
  {restrictions: [{couleurs: [], importanceOrdre: false}], maxColors: 3, expected: true},
  {restrictions: [{couleurs: [], importanceOrdre: false}], maxColors: 0, expected: true},
  {restrictions: [{couleurs: [], importanceOrdre: false}], maxColors: 3, expected: true},
  {restrictions: [{couleurs: ['c1'], importanceOrdre: false}], maxColors: 0, expected: false},
  {restrictions: [{couleurs: ['c1'], importanceOrdre: false}], maxColors: 3, expected: true}, // 11
  {
    restrictions: [
      {couleurs: ['c1'], importanceOrdre: false},
      {couleurs: ['c1'], importanceOrdre: false},
      {couleurs: ['c1'], importanceOrdre: false},
      {couleurs: ['c1'], importanceOrdre: false},
    ],
    maxColors: 3,
    expected: true,
  },
  {
    restrictions: [
      {couleurs: ['c1'], importanceOrdre: false},
      {couleurs: ['c2'], importanceOrdre: false},
      {couleurs: ['c1'], importanceOrdre: false},
      {couleurs: ['c3'], importanceOrdre: false},
    ],
    maxColors: 3,
    expected: true,
  },
  {
    restrictions: [
      {couleurs: ['c1'], importanceOrdre: true},
      {couleurs: ['c2'], importanceOrdre: true},
      {couleurs: ['c1'], importanceOrdre: true},
      {couleurs: ['c3'], importanceOrdre: true},
    ],
    maxColors: 3,
    expected: true,
  },
  {
    restrictions: [
      {couleurs: ['c1', 'c2'], importanceOrdre: false},
      {couleurs: ['c2', 'c3'], importanceOrdre: true},
      {couleurs: ['c1'], importanceOrdre: true},
      {couleurs: ['c3'], importanceOrdre: true},
    ],
    maxColors: 3,
    expected: true,
  },
  {
    restrictions: [
      {couleurs: ['c1', 'c2'], importanceOrdre: true},
      {couleurs: ['c2', 'c3'], importanceOrdre: true},
      {couleurs: ['c2', 'c1'], importanceOrdre: true},
    ],
    maxColors: 3,
    expected: false,
  },
  {
    restrictions: [
      {couleurs: ['c1', 'c2'], importanceOrdre: true},
      {couleurs: ['c2', 'c3'], importanceOrdre: true},
      {couleurs: ['c2', 'c1'], importanceOrdre: true},
    ],
    maxColors: 4,
    expected: true,
  },
  {
    restrictions: [
      {couleurs: ['c1', 'c2'], importanceOrdre: true},
      {couleurs: ['c2', 'c3'], importanceOrdre: true},
      {couleurs: ['c2', 'c1'], importanceOrdre: true},
      {couleurs: ['c1'], importanceOrdre: false},
    ],
    maxColors: 4,
    expected: true,
  },
  {
    restrictions: [
      {couleurs: ['c1', 'c2', 'c3'], importanceOrdre: true},
      {couleurs: ['c1', 'c2'], importanceOrdre: true},
    ],
    maxColors: 3,
    expected: true,
  },
  {
    restrictions: [
      {couleurs: ['c1', 'c2', 'c3'], importanceOrdre: true},
      {couleurs: ['c4', 'c1', 'c2'], importanceOrdre: true},
    ],
    maxColors: 3,
    expected: false,
  },
  {
    restrictions: [
      {couleurs: ['c1', 'c2', 'c3'], importanceOrdre: true},
      {couleurs: ['c1', 'c2', 'c4'], importanceOrdre: true},
    ],
    maxColors: 5,
    expected: false,
  },
  {
    restrictions: [
      {couleurs: ['c1', 'c2', 'c3'], importanceOrdre: true},
      {couleurs: ['c4', 'c1', 'c2'], importanceOrdre: true},
    ],
    maxColors: 4,
    expected: true,
  },
  {
    restrictions: [
      {couleurs: ['c1', 'c2', 'c3'], importanceOrdre: true},
      {couleurs: ['c4', 'c1'], importanceOrdre: true},
      {couleurs: ['c2', 'c3', 'c4'], importanceOrdre: true},
      {couleurs: ['c5', 'c1', 'c2'], importanceOrdre: true},
    ],
    maxColors: 5,
    expected: false,
  },
  {
    restrictions: [
      {couleurs: ['c1', 'c2', 'c3'], importanceOrdre: true},
      {couleurs: ['c4', 'c1'], importanceOrdre: true},
      {couleurs: ['c2', 'c3', 'c4'], importanceOrdre: true},
      {couleurs: ['c5', 'c1', 'c2'], importanceOrdre: true},
    ],
    maxColors: 6,
    expected: true,
  },
  {
    restrictions: [
      {couleurs: ['c1', 'c2', 'c3'], importanceOrdre: true},
      {couleurs: ['c1', 'c2', 'c3'], importanceOrdre: true},
    ],
    maxColors: 3,
    expected: true,
  },
];

export function runTest(): void {
  tests.forEach((test, i) => {
    const {restrictions, maxColors, expected} = test;
    const res = checkColorsAreCompatbile(restrictions, maxColors);
    if (res !== expected) {
      console.log('Error for the following test:');
      console.log(JSON.stringify(test, undefined, 2));
    }
  });
}
