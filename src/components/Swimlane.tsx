/* eslint-disable @typescript-eslint/no-unused-vars */
import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  PropsWithChildren,
  ReactElement,
  useEffect,
} from 'react';
import {
  View,
  LayoutRectangle,
  SectionList,
  StyleProp,
  ViewStyle,
  TouchableOpacity,
  StyleSheet,
  Text,
} from 'react-native';

import noop from 'lodash/noop';
import find from 'lodash/find';
import uniqueId from 'lodash/uniqueId';
import filter from 'lodash/filter';
import omit from 'lodash/omit';
import mapValues from 'lodash/mapValues';

import { PortalProvider, PortalHost } from '@gorhom/portal';

import Animated, {
  useSharedValue,
  useDerivedValue,
  runOnJS,
  useAnimatedStyle,
  runOnUI,
  useAnimatedReaction,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import type {
  AlteredKanbanItem,
  Column,
  DraggableContextInfo,
  DraggableContextProps,
  KanbanItem,
  ListProps,
  SectionList as ListType,
} from './types';
import { SectionRow } from './SectionRow';
import compactMap, {
  colMaxItems,
  insert,
  mock1,
  mock2,
  positionIsInside,
} from './helper';
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
  const dragInfoRef = useRef<DraggableContextInfo | null>(null);
  const sectionsInfoRef = useRef<Record<string, any>>();
  const [_testVal, setVal] = useState<any[]>([]);
  const dropInViews = useRef<Record<string, any> | {}>({});

  // const sectionListRef = useRef<SectionList | null>(null);
  const matrix = _sections.map((_, sectionIndex) =>
    columns.map((_, columnIndex) =>
      _data.filter(
        (_rowItem) =>
          _rowItem.column === columnIndex && _rowItem.section === sectionIndex
      )
    )
  );

  // console.log('matrix', JSON.stringify(matrix, null, 2));

  const computedData = _sections.reduce((acc, curr, sectionIndex) => {
    const maxRows = colMaxItems([matrix[sectionIndex]], columns).itemNumbers;
    const expanded = curr.expanded ?? false;
    const maxRowsEdited = maxRows === 0 ? 1 : maxRows;
    const rows = expanded ? maxRowsEdited + emptyRows : 0;

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
  // console.log('computedData', JSON.stringify(computedData, null, 2));

  const list = compactMap(_sections, (section, sectionIndex) => {
    return computedData[sectionIndex];
  });
  // console.log('list', JSON.stringify(list, null, 2));

  const savePosition = () => {
    const dragInfo = dragInfoRef.current;
    const targetPos = targetPositionRef?.current;
    if (targetPos && dragInfo?.info) {
      const dataToUpdate = _data.find((o) => o.id === dragInfo.info.id);
      const dataBeforeIndex = _data.findIndex((o) => o.id === targetPos.id);
      const indexToInsert = dataBeforeIndex === -1 ? 0 : dataBeforeIndex;
      if (dataToUpdate) {
        const newData = _data.filter((o) => o.id !== dragInfo.info.id);
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
      // const newData = _data.map((o) => {
      //   if (o.id === dragInfo.info.id) {
      //     return {
      //       ...o,
      //       column: targetPositionRef.current.column,
      //       section: targetPositionRef.current.section,
      //     };
      //   }
      //   return o;
      // });
      // console.log(JSON.stringify(newData, null, 2));

      // setDragInfo(null);
      dragInfoRef.current = null;
    }
  };

  // const moveItem = (section: number, column: number, row: number) => {
  //   if (dragInfo?.info) {
  // dragInfo.
  // if (
  //   dragInfo.column === column &&
  //   dragInfo.section === section &&
  //   dragInfo.row === row
  // ) {
  //   return;
  // }

  // targetPositionRef.current = { section, column, row };

  // const data =
  //   matrix?.[dragInfo.section]?.[dragInfo.column]?.[dragInfo.row];
  // computedData?.[section].data?.[row].splice(column, 0, data);
  // console.log(computedData?.[section].data?.[row].items?.[column]);
  // computedData?.[section].data?.[row].items?.splice(column, 0, data);

  // setBoardList(
  //   _sections.map((section, sectionIndex) => {
  //     return computedData[sectionIndex];
  //   })
  // );

  // computedData?.[section].data?.[row]
  //     console.log('moveItem', dragInfoRef.current?.info);
  //   }
  // };

  // const list: ListType<T>[] = _sections.map((section, sectionIndex) => {
  //   return computedData[sectionIndex];
  // });

  const dragContext: DraggableContextProps = {
    startDrag: (props) => {
      // setDragInfo(props);
      dragInfoRef.current = props;
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
    onItemFrame: (section, column, row, id, frame) => {
      console.log(section, column, row, id, frame);
      dropInViews.current = {
        ...dropInViews.current,
        [`${section}-${row}-${column}`]: {
          section,
          column,
          row,
          id,
          frame,
        },
      };
    },
    dragCursorInfo: {
      currentX,
      currentY,
      horizontalOffset: horizontalOffset,
      verticalOffset: horizontalOffset,
      isDragging: dragInfoRef.current !== null,
      currentSection:
        dragInfoRef.current &&
        `${dragInfoRef.current.section}-${dragInfoRef.current.row}`,
      originalSection: currentSectionRow,
      info: dragInfoRef.current,
    },
  };

  const onSectionFrame = (
    sectionId: number,
    row: number,
    frame: LayoutRectangle
  ) => {
    // console.log('mount', `${sectionId}-${row}`);
    const dataExists = computedData?.[sectionId]?.data?.[row];
    if (!dataExists) {
      unmountSectionRow(sectionId, row);
      return;
    }
    sectionsInfoRef.current = {
      ...sectionsInfoRef.current,
      [`${sectionId}-${row}`]: { frame, row, sectionId },
    };
  };

  // TODO: Drag n Drop
  const calcSectionHover = (x: number, y: number) => {
    if (dragInfoRef.current) {
      const el = find(
        sectionsInfoRef.current,
        (item) => y > item.frame.y && y <= item.frame.y + item.frame.height
      );
      if (el) {
        if (currentSectionRow !== `${el.sectionId}-${el.row}`) {
          setCurrentSectionRow(`${el.sectionId}-${el.row}`);
        }
      }
      // const el = find(dropInViews.current, (item) =>
      //   positionIsInside({ x, y }, item.frame)
      // );
      // if (el) {
      //   console.log(el);
      //   if (currentSectionRow !== `${el.section}-${el.row}`) {
      //     setCurrentSectionRow(`${el.section}-${el.row}`);
      //   }
      // }
    }
    // console.log(y, listOffsetY.value);
    // const newY = y + listOffsetY.value;
    // if (panEnabled) {
    // const el = find(
    //   sectionsInfoRef.current,
    //   item => newY >= item.frame.y && newY <= (item.frame.y + item.frame.height),
    // );
    // if (el) {
    //   console.log('found current item', el);
    //   setCurrentRow(`${el.sectionId}-${el.row}`);
    // } else {
    //   setCurrentRow(null);
    // }
    // }
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
  }, [JSON.stringify(computedData)]);

  useEffect(() => {
    console.log('useeffect data');
    setSections(sections);

    const transformedData = data.map((val) => ({ ...val, id: uniqueId() }));
    setData(transformedData);
  }, [sections, data]);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    horizontalOffset.value = event.contentOffset.x;
  });

  const sectionScrollHandler = useAnimatedScrollHandler((event) => {
    verticalOffset.value = event.contentOffset.y;
  });

  const unmountSectionRow = (section: number, row: number) => {
    // const cleanItems = Object.keys(sectionsInfoRef.current || {})
    //   .filter((key) => key !== `${section}-${row}`)
    //   .reduce((acc, prev) => {
    //     return { ...acc, [prev]: sectionsInfoRef.current?.[prev] };
    //   }, {});
    // console.log('before update', sectionsInfoRef.current);
    // sectionsInfoRef.current = cleanItems;
    // console.log('after update', cleanItems);
    // sectionsInfoRef.current = {
    //   ...sectionsInfoRef.current,
    //   [`${section}-${row}`]: undefined,
    // };
    // sectionsInfoRef.current = omit(sectionsInfoRef.current, [
    //   `${section}-${row}`,
    // ]);
  };

  return (
    <PortalProvider>
      <DraggableContext.Provider value={dragContext}>
        <GestureHandlerRootView>
          <View ref={onRefChange}>
            <Animated.ScrollView
              style={styles.scrollView}
              horizontal={true}
              onScroll={scrollHandler}
            >
              <SectionList
                sections={_testVal}
                renderItem={({ item, index: rowIndex, section }) => {
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
                      onFrame={(frame) => {
                        // console.log('SectionRow render', item.sectionId, rowIndex, item.items);
                        onSectionFrame(item.sectionId, rowIndex, frame);
                      }}
                      onUnmount={unmountSectionRow}
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
                onScroll={sectionScrollHandler}
              />
            </Animated.ScrollView>
            {dragInfoRef.current && (
              <Animated.View
                style={[
                  {
                    position: 'absolute',
                    top: dragInfoRef.current.startFrame.y,
                    left: dragInfoRef.current.startFrame.x,
                    width: dragInfoRef.current.startFrame.width,
                    height: dragInfoRef.current.startFrame.height,
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
                    dragInfoRef.current.info,
                    dragInfoRef.current.column,
                    dragInfoRef.current.section,
                    dragInfoRef.current.row
                  )}
                </View>
              </Animated.View>
            )}
            {/* {Object.values(dropInViews.current || {}).map((dropInView) => (
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  borderWidth: 1,
                  borderColor: 'yellow',
                  left: dropInView.frame.x,
                  top: dropInView.frame.y,
                  width: dropInView.frame.width,
                  height: dropInView.frame.height
                }}
              />
            ))} */}
          </View>
        </GestureHandlerRootView>
      </DraggableContext.Provider>
    </PortalProvider>
  );
};

const styles = StyleSheet.create({
  sectionList: { overflow: 'visible' },
  scrollView: { height: '100%' },
});

export const useDrag = () => React.useContext(DraggableContext);
