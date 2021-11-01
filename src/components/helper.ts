import type { LayoutRectangle } from 'react-native';
import type { Column, Point } from './types';

export const isPointEntered = (point: Point, layout: LayoutRectangle) => {
  const xMin = layout.x;
  const xMax = layout.x + layout.width;

  const yMin = layout.y;
  const yMax = layout.y + layout.height;
  return (
    point.x >= xMin && point.x <= xMax && point.y >= yMin && point.y <= yMax
  );
};

export const colMaxItems = (matrix: any[][][], columns: Column[]) => {
  // Variable to store index of
  // column with maximum
  let idx = -1;

  // Variable to store max sum
  let maxSum = 0;

  // Traverse matrix column wise
  for (let i = 0; i < columns.length; i++) {
    let sum = matrix[0][i].length;

    // Update maxSum if it is
    // less than current sum
    if (sum > maxSum) {
      maxSum = sum;

      // store index
      idx = i;
    }
  }

  // return result
  return {
    columnIndex: idx,
    itemNumbers: maxSum,
  };
};

export const getRandom = (max: number) => Math.floor(Math.random() * max);

type NonNullable<T> = Exclude<T, undefined | null>;

type ArrayIterator<T, U> = (value: T, index: number, collection: T[]) => U;

const compactMap = <T, U>(
  collection: T[] | null | undefined,
  callbackfn: ArrayIterator<T, U>
): NonNullable<U>[] => {
  const initialResult: NonNullable<U>[] = [];
  return (collection || []).reduce((memo, value, index, coll) => {
    const result = callbackfn(value, index, coll);
    if (result) {
      return [...memo, result as NonNullable<U>];
    }
    return [...memo];
  }, initialResult);
};

export default compactMap;

export const mock1 = [
  {
    title: '123',
    data: [
      {
        items: [
          {
            column: 0,
            section: 0,
            data: {
              value: 'item 1',
            },
            id: '1',
          },
          null,
        ],
        sectionId: 0,
      },
      {
        items: [
          {
            column: 0,
            section: 0,
            data: {
              value: 'item 2',
            },
            id: '2',
          },
          null,
        ],
        sectionId: 0,
      },
      {
        items: [null, null],
        sectionId: 0,
      },
    ],
    index: 0,
    expanded: true,
  },
  {
    title: '321',
    data: [
      {
        items: [
          null,
          {
            column: 1,
            section: 1,
            data: {
              value: 'item 3',
            },
            id: '3',
          },
        ],
        sectionId: 1,
      },
      {
        items: [
          null,
          {
            column: 1,
            section: 1,
            data: {
              value: 'item 4',
            },
            id: '4',
          },
        ],
        sectionId: 1,
      },
      {
        items: [null, null],
        sectionId: 1,
      },
    ],
    index: 1,
    expanded: true,
  },
];

export const mock2 = [
  {
    title: '123',
    data: [
      {
        items: [
          {
            column: 0,
            section: 0,
            data: {
              value: 'item 1',
            },
            id: '1',
          },
          null,
        ],
        sectionId: 0,
      },
      {
        items: [
          {
            column: 0,
            section: 0,
            data: {
              value: 'item 2',
            },
            id: '2',
          },
          null,
        ],
        sectionId: 0,
      },
      {
        items: [null, null],
        sectionId: 0,
      },
    ],
    index: 0,
    expanded: true,
  },
  {
    title: '321',
    data: [
      {
        items: [
          {
            column: 0,
            section: 1,
            data: {
              value: 'item 3',
            },
            id: '3',
          },
          null,
        ],
        sectionId: 1,
      },
      {
        items: [
          null,
          {
            column: 1,
            section: 1,
            data: {
              value: 'item 4',
            },
            id: '4',
          },
        ],
        sectionId: 1,
      },
      {
        items: [null, null],
        sectionId: 1,
      },
    ],
    index: 1,
    expanded: true,
  },
];

export const insert = <T>(arr: T[], index: number, ...items: T[]) => [
  ...arr.slice(0, index),
  ...items,
  ...arr.slice(index),
];

export const positionIsInside = (position: Point, frame: LayoutRectangle) =>
  position.x > frame.x &&
  position.x <= frame.x + frame.width &&
  position.y > frame.y &&
  position.y <= frame.y + frame.height;
