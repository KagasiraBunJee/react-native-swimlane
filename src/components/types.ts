import React from 'react';
import { LayoutRectangle, StyleProp, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

export type ColumnContentStyle = StyleProp<{
  padding?: ViewStyle['padding'];
  paddingTop?: ViewStyle['paddingTop'];
  paddingBottom?: ViewStyle['paddingBottom'];
  paddingLeft?: ViewStyle['paddingLeft'];
  paddingRight?: ViewStyle['paddingRight'];
  backgroundColor?: ViewStyle['backgroundColor'];
}>;

interface ItemRenderer<T> {
  renderItem: (
    info: KanbanItem<T>,
    columnIndex: number,
    sectionIndex: number,
    rowIndex: number
  ) => React.ReactNode | null;
  emptyItem: (
    columnIndex: number,
    sectionIndex: number,
    rowIndex: number
  ) => React.ReactNode;
}

export interface ListProps<T> extends ItemRenderer<T> {
  columns: Column[];
  sections: Section[];
  data: KanbanItem<T>[];
  renderSectionHeader: (section: any) => React.ReactNode;
  renderColumnItem: (index: number) => React.ReactNode;
  columnContentStyle?: ColumnContentStyle;
  columnWidth?: number;
  columnHeaderContainerStyle?: StyleProp<ViewStyle>;
}

export interface DraggableContextProps {
  position: { x: 0; y: 0 };
  setPosition: (x: number, y: number) => void;
  setDraggableInfo: (
    columnId: number,
    sectionId: number,
    sectionRow: number
  ) => void;
}

export interface Column {
  index: number;
  title: string;
  extraData?: Record<string, any>;
}

export interface Section {
  index: number;
  title: string;
  extraData?: Record<string, any>;
}

export interface KanbanItem<T> {
  column: number;
  section: number;
  data: T;
}

export interface Draggable {
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export interface DataItem {
  column: number;
  section: number;
  data?: {
    value: string;
  };
}

export interface SectionListData<T> {
  items: KanbanItem<T>[];
  sectionId: number;
}

export interface SectionList<T> {
  title: string;
  data: SectionListData<T>[];
  index: number;
}

export type DraggableSectionRow<T> = ItemRenderer<T> & Draggable;

export interface SectionRowProps<T> extends DraggableSectionRow<T> {
  items: SectionListData<T>['items'];
  sectionId: number;
  rowIndex: number;
  parentView?: any;
  cursorEntered?: boolean;
  cursorPositionX?: Animated.SharedValue<number>;
  columnWidth?: number;
  columnContentStyle?: ColumnContentStyle;
  onSectionEntered?: (sectionId: number) => void;
  onSectionExit?: (sectionId: number) => void;
  onItemEnter?: (sectionId: number, columnId: number) => void;
  onItemExit?: (sectionId: number, columnId: number) => void;
  onFrame?: (frame: LayoutRectangle) => void;
}

export interface Point {
  x: number;
  y: number;
}

export interface SectionRowCoord {
  sectionId: number;
  frame: LayoutRectangle;
  row: number;
}
