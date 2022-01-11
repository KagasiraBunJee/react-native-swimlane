import type { LegacyRef } from 'react';
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
  marginHorizontal?: ViewStyle['marginHorizontal'];
}>;

interface ItemStyled {
  draggingAreaStyle?: (
    columnIndex: number,
    sectionIndex: number,
    rowIndex: number
  ) => ViewStyle;
}

interface ItemRenderer<T> extends ItemStyled {
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

export interface Target {
  section: Section['index'];
  column: Column['index'];
  row: number;
}

export interface ListProps<T> extends ItemRenderer<T> {
  columns: Column[];
  sections: Section[];
  data: KanbanItem<T>[];
  emptyRows?: number;
  columnContentStyle?: ColumnContentStyle;
  columnWidth?: number;
  columnHeaderContainerStyle?: StyleProp<ViewStyle>;
  horizontalScrollRef?: LegacyRef<Animated.ScrollView> | undefined;
  verticalScrollRef?: LegacyRef<SectionList<any>> | undefined;
  horizontalScrollEnabled?: boolean;
  verticalScrollEnabled?: boolean;
  enterCursorOffset?: { x: number; y: number };
  hoverStyle?: ViewStyle;
  verticalStartScrollTopOffset?: number;
  verticalStartScrollBottomOffset?: number;
  horizontalStartScrollLeftOffset?: number;
  horizontalStartScrollRightOffset?: number;
  floatingColumnHeaders?: boolean;
  renderSectionHeader: (section: any) => React.ReactNode;
  renderColumnItem: (column: Column, index: number) => React.ReactNode;
  onItemMoved: (
    data: T,
    from: Target,
    to: Target,
    itemBefore?: AlteredKanbanItem<T>,
    itemAfter?: AlteredKanbanItem<T>
  ) => void;
}

export interface DraggableContextInfo {
  section: number;
  column: number;
  row: number;
  info: any;
  startFrame: { x: number; y: number; width: number; height: number };
}

export interface DraggableContextProps {
  offsetX: Animated.SharedValue<number>;
  offsetY: Animated.SharedValue<number>;
  startX: Animated.SharedValue<number>;
  startY: Animated.SharedValue<number>;
  screenOffsetX: Animated.SharedValue<number>;
  screenOffsetY: Animated.SharedValue<number>;
  isDragging: Animated.SharedValue<boolean>;
  hoverStyle?: ViewStyle;
  children: React.MutableRefObject<React.ReactNode>;
  startDrag: (props: DraggableContextInfo) => void;
  endDrag: () => void;
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
  columns: Column[];
}

export interface Column {
  index: number;
  title: string;
  disabled?: boolean;
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

export type DraggableSectionRow<T> = ItemRenderer<T>;

export interface SectionRowProps<T> extends DraggableSectionRow<T> {
  items: SectionListData<T>['items'];
  sectionId: number;
  rowIndex: number;
  parentView?: any;
  cursorEntered?: boolean;
  cursorPositionX?: Animated.SharedValue<number>;
  columnWidth?: number;
  columnContentStyle?: ColumnContentStyle;
  disabledColumns?: number[];
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

export interface DropInViewProps extends ItemStyled {
  column: number;
  section: number;
  rowIndex: number;
  row: any;
  parentView?: any;
  disabled?: boolean;
  canDropIn?: boolean;
  onLayout?: (frame: LayoutRectangle, id: number) => void;
  draggingAreaStyle?: (
    columnIndex: number,
    sectionIndex: number,
    rowIndex: number
  ) => ViewStyle;
}
