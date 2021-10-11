import type React from 'react';
import type { LayoutRectangle, StyleProp, ViewStyle } from 'react-native';
import type Animated from 'react-native-reanimated';

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
  emptyRows?: number;
  renderSectionHeader: (section: any) => React.ReactNode;
  renderColumnItem: (column: Column, index: number) => React.ReactNode;
  columnContentStyle?: ColumnContentStyle;
  columnWidth?: number;
  columnHeaderContainerStyle?: StyleProp<ViewStyle>;
}

export interface DraggableContextInfo {
  section: number;
  column: number;
  row: number;
  info: any;
  startFrame: { x: number; y: number; width: number; height: number };
}

export interface DragCursorInfo {
  currentX: Animated.SharedValue<number>;
  currentY: Animated.SharedValue<number>;
  horizontalOffset: Animated.SharedValue<number>;
  verticalOffset: Animated.SharedValue<number>;
  isDragging: boolean;
  originalSection: string | null;
  currentSection: string | null;
  info: DraggableContextInfo | null;
}

export interface DraggableContextProps {
  dragCursorInfo: DragCursorInfo;
  startDrag: (props: DraggableContextInfo) => void;
  endDrag: () => void;
  move: (
    offsetX: number,
    offsetY: number,
    startX: number,
    startY: number
  ) => void;
  onItemHover: (
    column: number,
    section: number,
    row: number,
    id: string
  ) => void;
  onItemFrame: (
    section: number,
    column: number,
    row: number,
    id: string,
    frame: LayoutRectangle
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
  expanded?: boolean;
}

export interface KanbanItem<T> {
  column: number;
  section: number;
  data: T;
}

export interface AlteredKanbanItem<T> extends KanbanItem<T> {
  id: string;
}

export interface Draggable {
  onDragStart?: (section: number, column: number) => void;
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
  items: AlteredKanbanItem<T>[];
  sectionId: number;
}

export interface SectionList<T> extends Section {
  data: SectionListData<T>[];
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
  onUnmount?: (section: number, row: number) => void;
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
