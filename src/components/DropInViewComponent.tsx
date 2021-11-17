import noop from 'lodash/noop';
import React, { useEffect, useRef } from 'react';
import {
  LayoutRectangle,
  PanResponder,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import type { DropInViewProps } from './types';
import { useDrag } from './Swimlane';

export const DropInViewComponent: React.FC<DropInViewProps> = ({
  children,
  parentView,
  column,
  section,
  row,
  rowIndex,
  canDropIn = false,
  onLayout = noop,
}) => {
  const pressed = useSharedValue(false);
  const rootRef = useRef<View>(null);
  const originFrame = useSharedValue<LayoutRectangle | null>(null);
  const {
    startDrag,
    endDrag,
    onItemFrame,
    offsetX,
    offsetY,
    startX,
    startY,
    screenOffsetX,
    screenOffsetY,
    hoverStyle,
    children: _children,
  } = useDrag();
  const isMounted = useRef(false);
  const readyToPan = useSharedValue(false);
  const hasMovedFinger = useSharedValue(false);

  const localX = useSharedValue(0);
  const localY = useSharedValue(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: () => Boolean(row),
      onPanResponderMove: ({ nativeEvent }, { dx, dy }) => {
        if (!hasMovedFinger.value) {
          hasMovedFinger.value = true;
        }
        if (readyToPan.value) {
          offsetX.value = withTiming(dx, { duration: 10 });
          offsetY.value = withTiming(dy, { duration: 10 });

          localX.value = withTiming(dx, { duration: 10 });
          localY.value = withTiming(dy, { duration: 10 });

          screenOffsetX.value = nativeEvent.pageX;
          // screenOffsetY.value = nativeEvent.pageY;
        }
      },
      onPanResponderRelease: () => {
        hasMovedFinger.value = false;
        if (readyToPan.value) {
          readyToPan.value = false;
          pressed.value = false;

          offsetX.value = 0;
          offsetY.value = 0;

          localX.value = 0;
          localY.value = 0;

          screenOffsetX.value = 0;

          endDrag();
          calcSize();
        }
      },
      onPanResponderEnd: () => {
        hasMovedFinger.value = false;
        if (readyToPan.value) {
          readyToPan.value = false;
          pressed.value = false;

          offsetX.value = 0;
          offsetY.value = 0;

          localX.value = 0;
          localY.value = 0;

          screenOffsetX.value = 0;

          endDrag();
          calcSize();
        }
      },
      onShouldBlockNativeResponder: () => false,
    })
  ).current;

  const calcSize = () => {
    if (parentView && rootRef.current) {
      rootRef.current.measureLayout(
        parentView,
        (dropInX, dropInY, width, height) => {
          onItemFrame(section, column, rowIndex, row?.id || '-1', {
            x: dropInX,
            y: dropInY,
            width,
            height,
          });
          originFrame.value = { x: dropInX, y: dropInY, width, height };
          onLayout({ x: dropInX, y: dropInY, width, height }, row?.id || '-1');
        },
        noop
      );
    }
  };

  const prepareToDrag = () => {
    _children.current = children;
    pressed.value = true;
    rootRef.current?.measureLayout(
      parentView,
      (dropInX, dropInY, width, height) => {
        onItemFrame(section, column, rowIndex, row?.id || '-1', {
          x: dropInX,
          y: dropInY,
          width,
          height,
        });
        startDrag({
          column,
          section,
          info: row,
          row: rowIndex,
          startFrame: { x: dropInX, y: dropInY, width, height },
        });
      },
      noop
    );
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: pressed.value ? withTiming(0, { duration: 400 }) : 1,
      transform: [
        {
          translateX: withTiming(localX.value, { duration: 100 }),
        },
        {
          translateY: withTiming(localY.value, { duration: 100 }),
        },
      ],
    };
  });

  useEffect(() => {
    pressed.value = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [column, section, JSON.stringify(row), rowIndex]);

  useEffect(() => {
    calcSize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentView, rootRef.current, column, section, endDrag, rowIndex]);

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);

  return (
    <Animated.View {...panResponder.panHandlers}>
      {canDropIn && <View style={[styles.empty, hoverStyle]} />}
      <View ref={rootRef}>
        <TouchableOpacity
          disabled={!row}
          onLongPress={() => {
            pressed.value = true;
            readyToPan.value = true;
            prepareToDrag();
            startX.value = originFrame.value?.x || 0;
            startY.value = originFrame.value?.y || 0;
          }}
        >
          <Animated.View style={[animatedStyle]}>
            <View>{children}</View>
          </Animated.View>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  draggableView: { position: 'absolute' },
  empty: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
});
