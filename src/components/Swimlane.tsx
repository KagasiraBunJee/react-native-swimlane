import React, {
  useState,
  useRef,
  useCallback,
  PropsWithChildren,
  ReactElement,
  useEffect,
} from 'react';
import {
  View,
  LayoutRectangle,
  SectionList,
  StyleSheet,
  Text,
} from 'react-native';

import noop from 'lodash/noop';
import find from 'lodash/find';
import uniqueId from 'lodash/uniqueId';

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
  dragCursorInfo: {
    horizontalOffset: { value: 0 },
    verticalOffset: { value: 0 },
    isDragging: false,
    currentSection: null,
    originalSection: null,
    info: null,
  },
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
});

export const Swimlane = <T extends object>({
  columns = [],
  sections = [],
  data = [],
  columnContentStyle,
  columnWidth,
  columnHeaderContainerStyle,
  emptyRows = 1,
  renderItem,
  emptyItem,
  renderSectionHeader,
  renderColumnItem,
  onItemMoved,
}: PropsWithChildren<ListProps<T>>): ReactElement | null => {
  const [_sections, setSections] = useState(sections);
  const [_data, setData] = useState<AlteredKanbanItem<T>[]>([]);

  const isDragging = useSharedValue(false);

  const boardXStart = useSharedValue(0);
  const boardYStart = useSharedValue(0);

  const screenOffsetX = useSharedValue(0);
  const screenOffsetY = useSharedValue(0);

  const verticalOffset = useSharedValue(0);

  const horizontalScrollRef = useAnimatedRef<Animated.ScrollView>();
  const horizontalOffset = useSharedValue(0);
  const horizontalAnimating = useSharedValue(false);
  const horizontalContentMaxOffset = useSharedValue(0);
  const horizontalStartDragOffset = useSharedValue(0);

  const sectionListRef = useAnimatedRef<SectionList>();

  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);

  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const horizontalScrollSize = useSharedValue(0);

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
  // const dragInfoRef = useRef<DraggableContextInfo | null>(null);
  const [dragInfo, setDragInfo] = useState<DraggableContextInfo | null>(null);
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
    const expanded = curr.expanded ?? false;
    const rows = expanded ? maxRows + emptyRows : 0;

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
    const targetPos = targetPositionRef?.current;
    const isSelf =
      targetPos?.column === dragInfo?.column &&
      targetPos?.section === dragInfo?.section &&
      targetPos?.row === dragInfo?.row;
    if (targetPos && dragInfo?.info && !isSelf) {
      const dataToUpdate = _data.find((o) => o.id === dragInfo.info.id);
      const dataBeforeIndex = _data.findIndex((o) => o.id === targetPos.id);
      const newData = _data.filter((o) => o.id !== dragInfo.info.id);
      const indexToInsert =
        dataBeforeIndex === -1
          ? newData.length
          : dataBeforeIndex > 0
          ? dataBeforeIndex - 1
          : 0;
      if (dataToUpdate) {
        const updatedItem = {
          ...dataToUpdate,
          column: targetPos.column,
          section: targetPos.section,
        };
        const updatedData = insert(newData, indexToInsert, updatedItem);
        const itemBefore = updatedData?.[indexToInsert - 1];
        const itemAfter = updatedData?.[indexToInsert + 1];
        onItemMoved &&
          onItemMoved(
            { column: dragInfo.column, section: dragInfo.section },
            { column: targetPos.column, section: targetPos.section },
            itemBefore,
            itemAfter
          );
        setData(updatedData);
      }
      setDragInfo(null);
    }
  };

  const newCurrentX = useDerivedValue(() => {
    return (
      offsetX.value +
      startX.value +
      horizontalOffset.value -
      horizontalStartDragOffset.value
    );
  });

  const dragContext: DraggableContextProps = {
    startDrag: (props) => {
      setDragInfo(props);
      isDragging.value = true;
      horizontalStartDragOffset.value = horizontalOffset.value;
    },
    endDrag: () => {
      savePosition();
      offsetX.value = 0;
      offsetY.value = 0;

      setCurrentSectionRow(null);
      sectionsInfoRef.current = {};

      horizontalAnimating.value = false;
      setDragInfo(null);

      isDragging.value = false;
    },
    onItemHover: (column, section, row, id) => {
      // moveItem(section, column, row);
      console.log(column, section, row, id);
      targetPositionRef.current = { section, column, row, id };
    },
    onItemFrame: noop,
    dragCursorInfo: {
      horizontalOffset,
      verticalOffset: horizontalOffset,
      // isDragging: dragInfoRef.current !== null,
      isDragging: dragInfo !== null,
      // currentSection:
      //   dragInfoRef.current &&
      //   `${dragInfoRef.current.section}-${dragInfoRef.current.row}`,
      currentSection: dragInfo && `${dragInfo.section}-${dragInfo.row}`,
      originalSection: currentSectionRow,
      // info: dragInfoRef.current,
      info: dragInfo,
    },
    offsetX,
    offsetY,
    startX,
    startY,
    screenOffsetX,
    screenOffsetY,
    isDragging,
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

  // TODO: Drag n Drop
  const calcSectionHover = useCallback(
    (y: number) => {
      // if (dragInfoRef.current) {
      if (dragInfo) {
        const el = find(
          sectionsInfoRef.current,
          (item) => y > item.frame.y && y <= item.frame.y + item.frame.height
        );
        if (el) {
          if (currentSectionRow !== `${el.sectionId}-${el.row}`) {
            setCurrentSectionRow(`${el.sectionId}-${el.row}`);
          }
        }
      }
    },
    [dragInfo, currentSectionRow]
  );

  const animatedMove = useAnimatedStyle(() => ({
    transform: [{ translateX: offsetX.value }, { translateY: offsetY.value }],
  }));

  useAnimatedReaction(
    () => offsetY.value + boardYStart.value + startY.value,
    (result) => {
      runOnJS(calcSectionHover)(result);
    },
    [dragInfo]
  );

  useAnimatedReaction(
    () => {
      return {
        _isDragging: isDragging.value,
        visibleScrollWidth: horizontalScrollSize.value,
        isScrollingAnimating: horizontalAnimating.value,
        offsetScrollX: horizontalOffset.value,
        horizontalMaxContentOffset: horizontalContentMaxOffset.value,
        _screenOffsetX: screenOffsetX,
      };
    },
    ({
      _isDragging,
      isScrollingAnimating,
      offsetScrollX,
      visibleScrollWidth,
      horizontalMaxContentOffset,
      _screenOffsetX,
    }) => {
      if (_isDragging) {
        scrollTo(horizontalScrollRef, offsetScrollX, 0, false);

        if (!isScrollingAnimating && visibleScrollWidth > 0) {
          if (_screenOffsetX.value > visibleScrollWidth - 100) {
            horizontalAnimating.value = true;

            if (offsetScrollX <= horizontalMaxContentOffset) {
              horizontalOffset.value = withTiming(
                offsetScrollX + 100,
                { duration: 100 },
                () => {
                  horizontalAnimating.value = false;
                }
              );
            } else {
              console.log(1, 'setting to max');
              horizontalOffset.value = horizontalMaxContentOffset;
            }
          }
          // else if (screenOffsetX.value < 100 && horizontalOffset.value > 0) {
          //   console.log(1, 'setting to 0');
          //   if (horizontalOffset.value > 0) {
          //     horizontalOffset.value = withTiming(
          //       horizontalOffset.value - 100,
          //       { duration: 100 },
          //       () => {
          //         horizontalAnimating.value = false;
          //       }
          //     );
          //   } else {
          //     console.log(1, 'setting to 0');
          //     horizontalOffset.value = 0;
          //   }
          // }
        }
      }
    },
    [dragInfo]
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
          onLayout={({ nativeEvent }) =>
            (horizontalScrollSize.value = nativeEvent.layout.width)
          }
          ref={onRefChange}
        >
          <Animated.ScrollView
            style={styles.scrollView}
            horizontal={true}
            onScrollEndDrag={({ nativeEvent }) => {
              if (horizontalAnimating.value) {
                horizontalOffset.value = nativeEvent.contentOffset.x;
              }
            }}
            onScroll={scrollHandler}
            ref={horizontalScrollRef}
            scrollEventThrottle={16}
          >
            <SectionList
              ref={sectionListRef}
              sections={_testVal}
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
                    onFrame={(frame) =>
                      onSectionFrame(item.sectionId, rowIndex, frame)
                    }
                    cursorPositionX={newCurrentX}
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
              onScroll={({ nativeEvent }) =>
                (verticalOffset.value = nativeEvent.contentOffset.y)
              }
            />
          </Animated.ScrollView>
          {dragInfo && (
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  top: dragInfo.startFrame.y - verticalOffset.value,
                  left: dragInfo.startFrame.x - horizontalStartDragOffset.value,
                  width: dragInfo.startFrame.width,
                  height: dragInfo.startFrame.height,
                },
                animatedMove,
              ]}
            >
              <View>
                <Text>Drag</Text>
              </View>
              <View
                style={[
                  columnContentStyle,
                  {
                    width: columnWidth,
                    flexDirection: 'row',
                  },
                ]}
              >
                {renderItem(
                  dragInfo.info,
                  dragInfo.column,
                  dragInfo.section,
                  dragInfo.row
                )}
              </View>
            </Animated.View>
          )}
        </View>
      </GestureHandlerRootView>
    </DraggableContext.Provider>
  );
};

const styles = StyleSheet.create({
  sectionList: { overflow: 'visible' },
  scrollView: { height: '100%' },
});

export const useDrag = () => React.useContext(DraggableContext);
