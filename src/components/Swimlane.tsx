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
} from 'react-native';

import noop from 'lodash/noop';

import { PortalProvider, PortalHost } from '@gorhom/portal';

import Animated, {
  useSharedValue,
  useDerivedValue,
  runOnJS,
} from 'react-native-reanimated';
import type {
  Column,
  DraggableContextProps,
  KanbanItem,
  ListProps,
  SectionList as ListType,
} from './types';
import { SectionRow } from './SectionRow';
import { colMaxItems } from './helper';
import { SectionHeader } from './SectionHeader';

const DraggableContext = React.createContext<DraggableContextProps>({
  position: { x: 0, y: 0 },
  setPosition: noop,
  setDraggableInfo: noop,
});

export const Swimlane = <T extends object>({
  columns = [],
  sections = [],
  data = [],
  columnContentStyle,
  columnWidth,
  columnHeaderContainerStyle,
  renderItem,
  emptyItem,
  renderSectionHeader,
  renderColumnItem,
}: PropsWithChildren<ListProps<T>>): ReactElement | null => {
  const [_sections, setSections] = useState(sections);

  const x = useSharedValue(0);
  const y = useSharedValue(0);

  const currentX = useSharedValue(0);
  const currentY = useSharedValue(0);

  const listOffsetX = useSharedValue(0);
  const listOffsetY = useSharedValue(0);

  const [panEnabled, setPanEnabled] = useState(false);
  const [containerView, setContainerView] = useState<View | null>(null);
  const [currentRow, setCurrentRow] = useState<string | null>(null);
  const draggedInfo = useRef<
    { content: React.ReactNode; style: any } | undefined
  >(undefined);

  const matrix = useMemo(
    () =>
      _sections.map((_, sectionIndex) =>
        columns.map((_, columnIndex) =>
          data.filter(
            (_rowItem) =>
              _rowItem.column === columnIndex &&
              _rowItem.section === sectionIndex
          )
        )
      ),
    [columns, data, _sections]
  );

  const list: ListType<T>[] = _sections.map((section, sectionIndex) => {
    const maxRows = colMaxItems([matrix[sectionIndex]], columns).itemNumbers;
    const expanded = section.expanded ?? false;
    return {
      title: section.title,
      data:
        maxRows === 0 || !expanded
          ? []
          : [...Array(maxRows + 1).keys()].map((_, rowIndex) => ({
              items: columns.map(
                (_, columnIndex) =>
                  matrix?.[sectionIndex]?.[columnIndex]?.[rowIndex]
              ),
              sectionId: sectionIndex,
            })),
      index: sectionIndex,
      expanded,
    };
  });

  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const sectionsInfoRef = useRef<Record<string, any>>();

  const dragContext: DraggableContextProps = useMemo(
    () => ({
      position: { x: 0, y: 0 },
      setPosition: (_x, _y) => {
        setDragPosition({ x: _x, y: _y });
      },
      setDraggableInfo: (col, sec, row) => {},
    }),
    []
  );

  const onSectionFrame = (
    sectionId: number,
    row: number,
    frame: LayoutRectangle
  ) => {
    sectionsInfoRef.current = {
      ...sectionsInfoRef.current,
      [`${sectionId}-${row}`]: { frame, row, sectionId },
    };
  };

  // TODO: Drag n Drop
  const onComponentTouchMove = (x: number, y: number) => {
    currentX.value = x;
    currentY.value = y;
  };

  // TODO: Drag n Drop
  const calcSectionHover = (x: number, y: number) => {
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

  useDerivedValue(() => {
    runOnJS(calcSectionHover)(currentX.value, currentY.value);
  });

  const onRefChange = useCallback((ref) => {
    setContainerView(ref);
  }, []);

  const onSectionHeaderPress = (sectionIndex: number) => {
    // console.log('123');
    const updatedSections = _sections.map((section, index) =>
      index === sectionIndex
        ? { ...section, expanded: !section.expanded }
        : section
    );
    setSections(updatedSections);
  };

  useEffect(() => {
    setSections(sections);
  }, [sections]);

  return (
    <PortalProvider>
      <DraggableContext.Provider value={dragContext}>
        <View
          ref={onRefChange}
          onTouchMove={({ nativeEvent }) => {
            onComponentTouchMove(nativeEvent.locationX, nativeEvent.locationY);
          }}
        >
          <Animated.ScrollView
            style={styles.scrollView}
            scrollEnabled={!panEnabled}
            horizontal={true}
          >
            {containerView && (
              <SectionList
                sections={list}
                scrollEnabled={!panEnabled}
                renderItem={({ item, index: rowIndex, section }) => {
                  return (
                    <SectionRow
                      cursorEntered={
                        currentRow === `${item.sectionId}-${rowIndex}`
                      }
                      parentView={containerView}
                      items={item.items}
                      sectionId={item.sectionId}
                      rowIndex={rowIndex}
                      renderItem={renderItem}
                      emptyItem={emptyItem}
                      onDragStart={() => {
                        setPanEnabled(true);
                      }}
                      onDragEnd={() => setPanEnabled(false)}
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
                  (listOffsetY.value = nativeEvent.contentOffset.y)
                }
              />
            )}
          </Animated.ScrollView>
          <Animated.View
            style={{
              position: 'absolute',
              top: dragPosition.y,
              left: dragPosition.x,
              backgroundColor: 'blue',
            }}
          >
            <PortalHost name="draggable" />
          </Animated.View>
        </View>
      </DraggableContext.Provider>
    </PortalProvider>
  );
};

const styles = StyleSheet.create({
  sectionList: { overflow: 'visible' },
  scrollView: { height: '100%' },
});

export const useDrag = () => React.useContext(DraggableContext);
