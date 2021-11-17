import React, {
  useState,
  useRef,
  useCallback,
  PropsWithChildren,
  ReactElement,
  useEffect,
} from 'react';
import { View, LayoutRectangle, SectionList, StyleSheet } from 'react-native';

import noop from 'lodash/noop';
import find from 'lodash/find';
import uniqueId from 'lodash/uniqueId';
import throttle from 'lodash/throttle';

import Animated, {
  useSharedValue,
  useDerivedValue,
  runOnJS,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  useAnimatedRef,
  scrollTo,
  withTiming,
  useAnimatedReaction,
} from 'react-native-reanimated';
import type {
  AlteredKanbanItem,
  DraggableContextInfo,
  DraggableContextProps,
  ListProps,
} from './types';
import { SectionRow } from './SectionRow';
import { colMaxItems, insert } from './helper';
import { SectionHeader } from './SectionHeader';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const DraggableContext = React.createContext<DraggableContextProps>({
  startDrag: noop,
  endDrag: noop,
  onItemHover: noop,
  onItemFrame: noop,
  offsetX: { value: 0 },
  offsetY: { value: 0 },
  startX: { value: 0 },
  startY: { value: 0 },
  screenOffsetX: { value: 0 },
  screenOffsetY: { value: 0 },
  isDragging: { value: false },
  children: { current: null },
  scrollViewRef: { current: null },
  sectionListRef: { current: null },
});

export const Swimlane = <T extends object>({
  columns = [],
  sections = [],
  data = [],
  columnContentStyle,
  columnWidth,
  columnHeaderContainerStyle,
  emptyRows = 1,
  enterCursorOffset = { x: 0, y: 0 },
  hoverStyle,
  horizontalStartScrollLeftOffset = 100,
  horizontalStartScrollRightOffset = 100,
  verticalStartScrollBottomOffset = 100,
  verticalStartScrollTopOffset = 100,
  draggingAreaStyle,
  renderItem,
  emptyItem,
  renderSectionHeader,
  renderColumnItem,
  onItemMoved,
}: PropsWithChildren<ListProps<T>>): ReactElement | null => {
  const [_sections, setSections] = useState(sections);
  const [_data, setData] = useState<AlteredKanbanItem<T>[]>([]);
  const _tempVal = useRef<React.ReactNode | null>(null);
  const [scrollingEnabled, setScroll] = useState(true);
  const isDragging = useSharedValue(false);

  const boardXStart = useSharedValue(0);
  const boardYStart = useSharedValue(0);

  const screenOffsetX = useSharedValue(0);
  const screenOffsetY = useSharedValue(0);

  const scrollingAnimating = useSharedValue(false);

  const _horizontalScrollRef = useAnimatedRef<Animated.ScrollView>();
  const horizontalOffset = useSharedValue(0);
  const horizontalContentMaxOffset = useSharedValue(0);
  const horizontalStartDragOffset = useSharedValue(0);
  const horizontalScrollSize = useSharedValue(0);

  const _sectionListRef = useAnimatedRef<SectionList<any>>();
  const verticalOffset = useSharedValue(0);
  const verticalContentMaxOffset = useSharedValue(0);
  const verticalStartDragOffset = useSharedValue(0);
  const verticalScrollSize = useSharedValue(0);

  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);

  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const [containerView, setContainerView] = useState<View | null>(null);
  const [currentSectionRow, setCurrentSectionRow] = useState<string | null>(
    null
  );
  const targetPositionRef = useRef<{
    section: number;
    column: number;
    row: number;
    id: string;
  } | null>(null);
  const dragInfoRef = useSharedValue<DraggableContextInfo | null>(null);
  const sectionsInfoRef = useRef<Record<string, any>>();
  const [_testVal, setVal] = useState<any[]>([]);

  const matrix = _sections.map((_, sectionIndex) =>
    columns.map((_, columnIndex) =>
      _data.filter(
        (_rowItem) =>
          _rowItem.column === columnIndex && _rowItem.section === sectionIndex
      )
    )
  );

  const computedData = _sections.reduce((acc, curr, sectionIndex) => {
    const maxRows = colMaxItems([matrix[sectionIndex]], columns).itemNumbers;
    const maxRowsLimited = maxRows === 0 ? 1 : maxRows;
    const expanded = curr.expanded ?? false;
    const rows = expanded ? maxRowsLimited + emptyRows : 0;

    return {
      ...acc,
      [sectionIndex]: {
        title: curr.title,
        data: [...Array(rows).keys()].map((_, rowIndex) => ({
          items: columns.map(
            (_, columnIndex) =>
              matrix?.[sectionIndex]?.[columnIndex]?.[rowIndex]
          ),
          sectionId: sectionIndex,
        })),
        index: sectionIndex,
        expanded,
      },
    };
  }, {});

  const savePosition = () => {
    const targetPos = targetPositionRef.current;
    const dragInfo = dragInfoRef.value;
    const isSelf =
      targetPos?.column === dragInfo?.column &&
      targetPos?.section === dragInfo?.section &&
      targetPos?.row === dragInfo?.row;

    if (targetPos && dragInfo?.info && !isSelf) {
      let itemBefore =
        matrix?.[targetPos.section]?.[targetPos.column]?.[targetPos.row - 1];
      const itemAfter =
        matrix?.[targetPos.section]?.[targetPos.column]?.[targetPos.row];

      const lengthInColumn = (
        matrix?.[targetPos.section]?.[targetPos.column] || []
      ).length;

      const indexBefore = _data.findIndex((o) => o.id === itemBefore?.id);
      const indexAfter =
        indexBefore > -1
          ? indexBefore
          : _data.findIndex((o) => o.id === itemAfter?.id);

      const dataToUpdate = _data.find((o) => o.id === dragInfo.info.id);
      const newData = _data.filter((o) => o.id !== dragInfo.info.id);
      if (dataToUpdate) {
        const updatedItem = {
          ...dataToUpdate,
          column: targetPos.column,
          section: targetPos.section,
        };

        if (indexBefore > -1) {
          const updatedData = insert(
            newData,
            Math.max(indexBefore + 1, 0),
            updatedItem
          );
          setData(updatedData);
        } else if (indexAfter > -1) {
          const updatedData = insert(
            newData,
            Math.max(indexAfter - 1, 0),
            updatedItem
          );
          setData(updatedData);
        } else {
          if (lengthInColumn > 0) {
            itemBefore =
              matrix?.[targetPos.section]?.[targetPos.column]?.[
                lengthInColumn - 1
              ];
            const index = _data.findIndex((o) => o.id === itemBefore?.id);
            const updatedData = insert(newData, index + 1, updatedItem);
            setData(updatedData);
          } else {
            const columnIndex =
              targetPos.column === 0 ? 0 : targetPos.column - 1;
            const lengthInPrevious =
              matrix?.[targetPos.section]?.[columnIndex].length;
            const updatedData = insert(newData, lengthInPrevious, updatedItem);
            setData(updatedData);
          }
        }

        onItemMoved &&
          onItemMoved(
            updatedItem.data,
            {
              column: dragInfo.column,
              section: dragInfo.section,
              row: dragInfo.row,
            },
            {
              column: targetPos.column,
              section: targetPos.section,
              row: targetPos.row,
            },
            itemBefore,
            itemAfter
          );
      }
    }
    dragInfoRef.value = null;
    setCurrentSectionRow(null);
  };

  const shadowItemX = useDerivedValue(() =>
    dragInfoRef.value
      ? dragInfoRef.value.startFrame.x - horizontalStartDragOffset.value
      : horizontalStartDragOffset.value
  );

  const shadowItemY = useDerivedValue(() =>
    dragInfoRef.value
      ? dragInfoRef.value.startFrame.y - verticalStartDragOffset.value
      : verticalStartDragOffset.value
  );

  const cursorPositionX = useDerivedValue(
    () =>
      offsetX.value +
      startX.value +
      enterCursorOffset.x +
      horizontalOffset.value -
      horizontalStartDragOffset.value,
    [enterCursorOffset.x]
  );

  const dragContext: DraggableContextProps = {
    startDrag: (props) => {
      setScroll(false);
      dragInfoRef.value = props;
      isDragging.value = true;
      horizontalStartDragOffset.value = horizontalOffset.value;
      verticalStartDragOffset.value = verticalOffset.value;
    },
    endDrag: () => {
      setScroll(true);
      savePosition();
      offsetX.value = 0;
      offsetY.value = 0;

      sectionsInfoRef.current = {};

      isDragging.value = false;
      horizontalStartDragOffset.value = horizontalOffset.value;
      verticalStartDragOffset.value = verticalOffset.value;
      scrollingAnimating.value = false;
    },
    onItemHover: (column, section, row, id) => {
      targetPositionRef.current = { section, column, row, id };
    },
    onItemFrame: noop,
    offsetX,
    offsetY,
    startX,
    startY,
    screenOffsetX,
    screenOffsetY,
    isDragging,
    hoverStyle,
    children: _tempVal,
    scrollViewRef: _horizontalScrollRef,
    sectionListRef: _sectionListRef,
  };

  const onSectionFrame = (
    sectionId: number,
    row: number,
    frame: LayoutRectangle
  ) => {
    const dataExists = computedData?.[sectionId]?.data?.[row];
    if (!dataExists) {
      return;
    }

    if (sectionId === 0 && row === 0) {
      boardXStart.value = frame.x;
      boardYStart.value = frame.y;
    }

    sectionsInfoRef.current = {
      ...sectionsInfoRef.current,
      [`${sectionId}-${row}`]: { frame, row, sectionId },
    };
  };

  const calcSectionHover = useCallback(
    (y: number) => {
      if (dragInfoRef.value) {
        const newY = enterCursorOffset.y + y;
        const el = find(
          sectionsInfoRef.current,
          (item) => newY > item.frame.y && y <= item.frame.y + item.frame.height
        );
        if (el) {
          if (currentSectionRow !== `${el.sectionId}-${el.row}`) {
            setCurrentSectionRow(`${el.sectionId}-${el.row}`);
          }
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentSectionRow, enterCursorOffset.y]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedChangeHandler = useCallback(throttle(calcSectionHover, 200), [
    currentSectionRow,
    enterCursorOffset.y,
  ]);

  const animatedMove = useAnimatedStyle(() => ({
    transform: [{ translateX: offsetX.value }, { translateY: offsetY.value }],
    top: shadowItemY.value,
    left: shadowItemX.value,
    opacity: dragInfoRef.value ? 1 : 0,
  }));

  useAnimatedReaction(
    () =>
      offsetY.value +
      boardYStart.value +
      startY.value +
      verticalOffset.value -
      verticalStartDragOffset.value,
    (result) => {
      runOnJS(debouncedChangeHandler)(result);
    }
  );

  useAnimatedReaction(
    () => {
      return {
        _isDragging: isDragging.value,
        visibleScrollWidth: horizontalScrollSize.value,
        isScrollingAnimating: scrollingAnimating.value,
        offsetScrollX: horizontalOffset.value,
        maxOffset: horizontalContentMaxOffset.value,
        _screenOffsetX: screenOffsetX.value,
      };
    },
    ({
      _isDragging,
      isScrollingAnimating,
      offsetScrollX,
      visibleScrollWidth,
      maxOffset,
      _screenOffsetX,
    }) => {
      if (_isDragging) {
        scrollTo(_horizontalScrollRef, offsetScrollX, 0, false);

        if (!isScrollingAnimating && visibleScrollWidth > 0) {
          if (
            _screenOffsetX >
              visibleScrollWidth - horizontalStartScrollRightOffset &&
            offsetScrollX < maxOffset
          ) {
            scrollingAnimating.value = true;
            horizontalOffset.value = withTiming(
              offsetScrollX + 100,
              { duration: 100 },
              () => {
                scrollingAnimating.value = false;
              }
            );
          } else if (
            _screenOffsetX < horizontalStartScrollLeftOffset &&
            offsetScrollX > 0
          ) {
            scrollingAnimating.value = true;
            horizontalOffset.value = withTiming(
              offsetScrollX - 100,
              { duration: 100 },
              () => {
                scrollingAnimating.value = false;
              }
            );
          }

          if (offsetScrollX > maxOffset) {
            horizontalOffset.value = maxOffset;
          }
          if (offsetScrollX < 0) {
            horizontalOffset.value = 0;
          }
        }
      }
    },
    [horizontalStartScrollLeftOffset, horizontalStartScrollRightOffset]
  );

  useAnimatedReaction(
    () => ({
      _isDragging: isDragging.value,
      _verticalOffset: verticalOffset.value,
      maxOffset: verticalContentMaxOffset.value,
      oldOffset: verticalStartDragOffset.value,
      _screenOffsetY: screenOffsetY.value,
      visibleScrollHeight: verticalScrollSize.value,
      isScrolling: scrollingAnimating.value,
      _boardYStart: boardYStart.value,
    }),
    ({
      _screenOffsetY,
      _isDragging,
      visibleScrollHeight,
      _verticalOffset,
      maxOffset,
      isScrolling,
      _boardYStart,
    }) => {
      if (_isDragging) {
        if (!isScrolling) {
          scrollTo(_sectionListRef as any, 0, _verticalOffset, false);
        }

        if (
          _screenOffsetY >
            visibleScrollHeight +
              _boardYStart -
              verticalStartScrollBottomOffset &&
          _verticalOffset < maxOffset
        ) {
          scrollingAnimating.value = true;
          verticalOffset.value = withTiming(
            _verticalOffset + 100,
            { duration: 100 },
            () => {
              scrollingAnimating.value = false;
            }
          );
        } else if (
          _screenOffsetY < verticalStartScrollTopOffset &&
          _verticalOffset > 0
        ) {
          scrollingAnimating.value = true;
          verticalOffset.value = withTiming(
            _verticalOffset - 100,
            { duration: 100 },
            () => {
              scrollingAnimating.value = false;
            }
          );
        }
      }
    },
    [verticalStartScrollTopOffset, verticalStartScrollBottomOffset]
  );

  const onRefChange = useCallback((ref) => {
    setContainerView(ref);
  }, []);

  const onSectionHeaderPress = (sectionIndex: number) => {
    const updatedSections = _sections.map((section, index) =>
      index === sectionIndex
        ? { ...section, expanded: !section.expanded }
        : section
    );
    setSections(updatedSections);
  };

  useEffect(() => {
    setVal(
      _sections.map((section, sectionIndex) => {
        return computedData[sectionIndex];
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(computedData)]);

  useEffect(() => {
    setSections(sections);

    const transformedData = data.map((val) => ({ ...val, id: uniqueId() }));
    setData(transformedData);
  }, [sections, data]);

  const scrollHandler = useAnimatedScrollHandler(
    ({ contentOffset, contentSize, layoutMeasurement }) => {
      horizontalOffset.value = contentOffset.x;
      const maxOffsetX = contentSize.width - layoutMeasurement.width;
      horizontalContentMaxOffset.value = maxOffsetX;
      if (contentOffset.x >= maxOffsetX) {
        horizontalOffset.value = maxOffsetX;
      }
    }
  );

  return (
    <DraggableContext.Provider value={dragContext}>
      <GestureHandlerRootView>
        <View
          onLayout={({ nativeEvent }) => {
            horizontalScrollSize.value = nativeEvent.layout.width;
            verticalScrollSize.value = nativeEvent.layout.height;
          }}
          ref={onRefChange}
        >
          <Animated.ScrollView
            style={styles.scrollView}
            horizontal={true}
            onScrollEndDrag={({ nativeEvent }) => {
              if (scrollingAnimating.value) {
                horizontalOffset.value = nativeEvent.contentOffset.x;
              }
            }}
            onScroll={scrollHandler}
            ref={_horizontalScrollRef}
            scrollEventThrottle={16}
            onContentSizeChange={(_, height) => {
              horizontalContentMaxOffset.value = height;
            }}
            scrollEnabled={scrollingEnabled}
          >
            <SectionList
              ref={_sectionListRef}
              sections={_testVal}
              scrollEnabled={scrollingEnabled}
              renderItem={({ item, index: rowIndex }) => {
                return (
                  <SectionRow
                    cursorEntered={currentSectionRow?.includes(
                      `${item.sectionId}-${rowIndex}`
                    )}
                    parentView={containerView}
                    items={item.items}
                    sectionId={item.sectionId}
                    rowIndex={rowIndex}
                    renderItem={renderItem}
                    emptyItem={emptyItem}
                    draggingAreaStyle={draggingAreaStyle}
                    onFrame={(frame) =>
                      onSectionFrame(item.sectionId, rowIndex, frame)
                    }
                    cursorPositionX={cursorPositionX}
                    columnWidth={columnWidth}
                    columnContentStyle={columnContentStyle}
                  />
                );
              }}
              style={styles.sectionList}
              keyExtractor={(item, index) => `${index}`}
              renderSectionHeader={({ section }) => (
                <SectionHeader
                  columns={columns}
                  style={columnHeaderContainerStyle}
                  index={section.index}
                  renderColumnItem={renderColumnItem}
                  onSectionPress={onSectionHeaderPress}
                >
                  {renderSectionHeader(section)}
                </SectionHeader>
              )}
              stickySectionHeadersEnabled={false}
              onScroll={({ nativeEvent }) => {
                verticalOffset.value = nativeEvent.contentOffset.y;
                const maxOffsetY =
                  nativeEvent.contentSize.height -
                  nativeEvent.layoutMeasurement.height;
                verticalContentMaxOffset.value = maxOffsetY;

                if (nativeEvent.contentOffset.y >= maxOffsetY) {
                  verticalOffset.value = maxOffsetY;
                }
              }}
              onContentSizeChange={(_, height) => {
                verticalContentMaxOffset.value = height;
              }}
            />
          </Animated.ScrollView>
          <Animated.View
            pointerEvents="none"
            style={[styles.shadowItem, animatedMove]}
          >
            {_tempVal.current}
          </Animated.View>
        </View>
      </GestureHandlerRootView>
    </DraggableContext.Provider>
  );
};

const styles = StyleSheet.create({
  sectionList: { overflow: 'visible' },
  scrollView: { height: '100%' },
  shadowItem: { position: 'absolute' },
  shadowItemContent: { flexDirection: 'row' },
});

export const useDrag = () => React.useContext(DraggableContext);
