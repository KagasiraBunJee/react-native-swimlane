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
    currentX: { value: 0 },
    currentY: { value: 0 },
    horizontalOffset: { value: 0 },
    verticalOffset: { value: 0 },
    isDragging: false,
    currentSection: null,
    originalSection: null,
    info: null,
  },
  startDrag: noop,
  endDrag: noop,
  move: noop,
  onItemHover: noop,
  onItemFrame: noop,
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
}: PropsWithChildren<ListProps<T>>): ReactElement | null => {
  const [_sections, setSections] = useState(sections);
  const [_data, setData] = useState<AlteredKanbanItem<T>[]>([]);
  const horizontalOffset = useSharedValue(0);
  const verticalOffset = useSharedValue(0);

  const sectionListRef = useAnimatedRef<SectionList>();

  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);

  const currentX = useSharedValue(0);
  const currentY = useSharedValue(0);

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
    // const dragInfo = dragInfoRef.current;
    const targetPos = targetPositionRef?.current;
    if (targetPos && dragInfo?.info) {
      const dataToUpdate = _data.find((o) => o.id === dragInfo.info.id);
      const dataBeforeIndex = _data.findIndex((o) => o.id === targetPos.id);
      const newData = _data.filter((o) => o.id !== dragInfo.info.id);
      const indexToInsert =
        dataBeforeIndex === -1 ? newData.length : dataBeforeIndex;
      if (dataToUpdate) {
        const updatedData = insert(newData, indexToInsert, dataToUpdate);
        setData(
          updatedData.map((o) => {
            if (o.id === dragInfo.info.id) {
              return {
                ...o,
                column: targetPos.column,
                section: targetPos.section,
              };
            }
            return o;
          })
        );
      }
      // dragInfoRef.current = null;
      setDragInfo(null);
    }
  };

  const dragContext: DraggableContextProps = {
    startDrag: (props) => {
      setDragInfo(props);
      // dragInfoRef.current = props;
    },
    endDrag: () => {
      console.log('saving to new location', targetPositionRef.current);
      savePosition();
      offsetX.value = 0;
      offsetY.value = 0;

      setCurrentSectionRow(null);
      sectionsInfoRef.current = {};
      // setDragInfo(null);
    },
    move: (x, y, startX, startY) => {
      offsetX.value = x;
      offsetY.value = y;

      currentX.value = x + startX;
      currentY.value = y + startY;
    },
    onItemHover: (column, section, row, id) => {
      // moveItem(section, column, row);
      console.log(column, section, row, id);
      targetPositionRef.current = { section, column, row, id };
    },
    onItemFrame: noop,
    dragCursorInfo: {
      currentX,
      currentY,
      horizontalOffset: horizontalOffset,
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
    sectionsInfoRef.current = {
      ...sectionsInfoRef.current,
      [`${sectionId}-${row}`]: { frame, row, sectionId },
    };
  };

  // TODO: Drag n Drop
  const calcSectionHover = (x: number, y: number) => {
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
  };

  const animatedMove = useAnimatedStyle(() => ({
    transform: [{ translateX: offsetX.value }, { translateY: offsetY.value }],
  }));

  useDerivedValue(() => {
    runOnJS(calcSectionHover)(currentX.value, currentY.value);
  });

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
    console.log('useeffect data');
    setSections(sections);

    const transformedData = data.map((val) => ({ ...val, id: uniqueId() }));
    setData(transformedData);
  }, [sections, data]);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    console.log(event.contentOffset.x);
    horizontalOffset.value = event.contentOffset.x;
  });

  return (
    <DraggableContext.Provider value={dragContext}>
      <GestureHandlerRootView>
        <View ref={onRefChange}>
          <Animated.ScrollView
            style={styles.scrollView}
            horizontal={true}
            onScroll={scrollHandler}
            onScrollEndDrag={({ nativeEvent }) => {
              horizontalOffset.value = nativeEvent.contentOffset.x;
            }}
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
                    cursorPositionX={currentX}
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
                // {
                //   position: 'absolute',
                //   top: dragInfoRef.current.startFrame.y - verticalOffset.value,
                //   left:
                //     dragInfoRef.current.startFrame.x - horizontalOffset.value,
                //   width: dragInfoRef.current.startFrame.width,
                //   height: dragInfoRef.current.startFrame.height,
                // },
                {
                  position: 'absolute',
                  top: dragInfo.startFrame.y - verticalOffset.value,
                  left: dragInfo.startFrame.x - horizontalOffset.value,
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
