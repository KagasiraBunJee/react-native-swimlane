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
import Animated, { runOnJS, useDerivedValue } from 'react-native-reanimated';
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
  renderItem,
  emptyItem,
  onFrame = noop,
}: PropsWithChildren<SectionRowProps<T>>): ReactElement | null => {
  const [localItems, setItems] = useState(items);
  const ref = useRef<View>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const itemsRef = useRef<
    Record<string, { columnId: number; frame: LayoutRectangle }>
  >({});
  const { dragCursorInfo, onItemHover } = useDrag();
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
    if (cursorEntered) {
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

  useDerivedValue(() => {
    if (dragCursorInfo?.isDragging) {
      if (!isMounted.current) {
        return;
      }
      // console.log('SectionRow useAnimatedReaction', curr.value);
      runOnJS(searchItemHover)(dragCursorInfo?.currentX.value);
    }
  });

  useEffect(() => {
    // console.log('cursorEntered', sectionId, rowIndex, cursorEntered);
    if (!cursorEntered) {
      setHoveredItem(null);
    }
  }, [cursorEntered]);

  useEffect(() => {
    console.log('items updated', items, sectionId, rowIndex, itemsRef);
    itemsRef.current = {};
    setItems(items);
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
      <View
        ref={ref}
        style={[styles.dropInWrapper, { backgroundColor: 'blue' }]}
      >
        {localItems.map((row, index) => {
          return (
            <DropInViewComponent
              shouldAnimate={row ? true : false}
              key={index}
              column={index}
              row={row}
              section={sectionId}
              rowIndex={rowIndex}
              onLayout={(frame) => onFrameChange(frame, index, row?.id || '-1')}
              canBeDragged={row ? true : false}
              isDragging={false}
              canDropIn={hoveredItem === `${sectionId}-${index}`}
              parentView={parentView}
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
