import find from 'lodash/find';
import noop from 'lodash/noop';
import React, {
  useCallback,
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
import type { SectionRowProps } from './types';

export const SectionRow = <T extends object>({
  sectionId,
  rowIndex,
  items,
  cursorEntered = false,
  cursorPositionX,
  renderItem,
  emptyItem,
  onFrame = noop,
  onDragStart = noop,
  onDragEnd = noop,
  parentView,
  columnWidth,
  columnContentStyle,
}: PropsWithChildren<SectionRowProps<T>>): ReactElement | null => {
  const ref = useRef<View>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const itemsRef = useRef<
    Record<string, { columnId: number; frame: LayoutRectangle }>
  >({});
  const sectionMaxHeight = useRef<number | null>(null);
  const sectionOffsetY = useRef<number>(0);

  useEffect(() => {
    if (parentView) {
      ref?.current?.measureLayout(
        parentView,
        (x, y, width, height) => {
          const frame: LayoutRectangle = { x, y, width, height };
          if (!sectionMaxHeight.current) {
            sectionMaxHeight.current = height;
            sectionOffsetY.current = y;
          }
          onFrame(frame);
        },
        noop
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onFrameChange = useCallback((frame, index) => {
    itemsRef.current = {
      ...itemsRef.current,
      [index]: { columnId: index, frame },
    };
  }, []);

  const searchItemHover = (x: number) => {
    if (cursorEntered) {
      const item = find(
        itemsRef.current,
        (_item) => x >= _item.frame.x && x <= _item.frame.x + _item.frame.width
      );
      if (item) {
        setHoveredItem(`${sectionId}-${item.columnId}`);
      } else {
        setHoveredItem(null);
      }
    }
  };

  useAnimatedReaction(
    () => cursorPositionX?.value,
    (curr) => {
      if (curr) {
        runOnJS(searchItemHover)(curr);
      }
    }
  );

  const startDragging = (_row: number) => {
    onDragStart();
  };

  const finishDragging = () => {
    setHoveredItem(null);
    onDragEnd();
  };

  return (
    <View style={styles.dropInContainer}>
      <View ref={ref} style={styles.dropInWrapper}>
        {items.map((row, index) => {
          return (
            <DropInViewComponent
              shouldAnimate={row ? true : false}
              key={index}
              onLayout={(frame) => onFrameChange(frame, index)}
              columnId={`${index}`}
              height={sectionMaxHeight.current}
              offsetY={sectionOffsetY.current}
              sectionId={`${sectionId}`}
              onDragStart={() => {
                startDragging(index);
              }}
              canBeDragged={row ? true : false}
              isDragging={false}
              canDropIn={hoveredItem === `${sectionId}-${index}`}
              onDragEnd={() => {
                finishDragging();
              }}
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
