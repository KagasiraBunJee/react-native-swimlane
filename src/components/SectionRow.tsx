import find from 'lodash/find';
import noop from 'lodash/noop';
import React, {
  useEffect,
  useRef,
  useState,
  ReactElement,
  PropsWithChildren,
} from 'react';
import { LayoutRectangle, StyleSheet, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedReaction,
} from 'react-native-reanimated';
import { DropInViewComponent } from './DropInViewComponent';
import { useDrag } from './Swimlane';
import type { SectionRowProps } from './types';

export const SectionRow = <T extends object>({
  sectionId,
  rowIndex,
  items = [],
  cursorEntered = false,
  parentView,
  columnWidth,
  columnContentStyle,
  cursorPositionX = { value: 0 },
  renderItem,
  emptyItem,
  onFrame = noop,
  draggingAreaStyle,
}: PropsWithChildren<SectionRowProps<T>>): ReactElement | null => {
  const [localItems, setItems] = useState(items);
  const ref = useRef<View>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const itemsRef = useRef<
    Record<string, { columnId: number; frame: LayoutRectangle }>
  >({});
  const { onItemHover, isDragging, columns } = useDrag();
  const isMounted = useRef(false);

  const onFrameChange = (frame: LayoutRectangle, index: number, id: string) => {
    if (hoveredItem === `${sectionId}-${index}`) {
      return;
    }
    itemsRef.current = {
      ...itemsRef.current,
      [index]: { columnId: index, frame, id },
    };
  };

  const searchItemHover = (x: number) => {
    if (!isMounted.current) {
      return;
    }
    if (cursorEntered && isDragging.value) {
      const item = find(
        itemsRef.current,
        (_item) => x >= _item.frame.x && x <= _item.frame.x + _item.frame.width
      );
      if (item) {
        if (hoveredItem !== `${sectionId}-${item.columnId}`) {
          setHoveredItem(`${sectionId}-${item.columnId}`);
          onItemHover(item.columnId, sectionId, rowIndex, item.id);
        }
        return;
      }
    }
    setHoveredItem(null);
  };

  useAnimatedReaction(
    () => {
      return {
        _isDragging: isDragging.value,
        posX: cursorPositionX.value,
      };
    },
    ({ posX, _isDragging }) => {
      if (!isMounted.current) {
        return;
      }

      runOnJS(searchItemHover)(posX);

      if (!_isDragging) {
        runOnJS(setHoveredItem)(null);
      }
    }
  );

  useEffect(() => {
    if (!cursorEntered) {
      setHoveredItem(null);
    }
  }, [cursorEntered]);

  useEffect(() => {
    itemsRef.current = {};
    setItems(items);
    setHoveredItem(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(items)]);

  useEffect(() => {
    isMounted.current = true;
    if (parentView) {
      ref?.current?.measureLayout(
        parentView,
        (x, y, width, height) => {
          const frame: LayoutRectangle = { x, y, width, height };
          onFrame(frame);
        },
        noop
      );
    }
    return () => {
      isMounted.current = false;
    };
  });

  return (
    <View style={[styles.dropInContainer]}>
      <View ref={ref} style={[styles.dropInWrapper]}>
        {localItems.map((row, index) => {
          return (
            <DropInViewComponent
              key={index}
              column={index}
              row={row}
              section={sectionId}
              rowIndex={rowIndex}
              onLayout={(frame) => onFrameChange(frame, index, row?.id || '-1')}
              disabled={columns[index].disabled}
              canDropIn={hoveredItem === `${sectionId}-${index}`}
              parentView={parentView}
              draggingAreaStyle={draggingAreaStyle}
            >
              <Animated.View
                style={[
                  columnContentStyle,
                  {
                    width: columnWidth,
                  },
                  row ? {} : styles.dropInComponent,
                ]}
              >
                {renderItem(row, index, sectionId, rowIndex) ||
                  emptyItem(index, sectionId, rowIndex)}
              </Animated.View>
            </DropInViewComponent>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  dropInComponent: {
    flexDirection: 'row',
  },
  dropInContainer: {
    padding: 0,
  },
  dropInWrapper: {
    flexDirection: 'row',
  },
});
