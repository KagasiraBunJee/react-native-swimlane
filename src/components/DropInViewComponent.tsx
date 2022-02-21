import noop from 'lodash/noop';
import React, { useEffect, useRef } from 'react';
import { LayoutRectangle, StyleSheet, View } from 'react-native';
import Animated, {
  runOnJS,
  runOnUI,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import type { DropInViewProps } from './types';
import {
  Gesture,
  GestureDetector,
  GestureStateManager,
  GestureType,
  PanGestureHandler,
} from 'react-native-gesture-handler';
import { useDrag } from './Swimlane';
import { useState } from 'react';

export const DropInViewComponent: React.FC<DropInViewProps> = ({
  children,
  parentView,
  column,
  section,
  row,
  rowIndex,
  disabled = false,
  canDropIn = false,
  onLayout = noop,
  draggingAreaStyle,
}) => {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
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
  const [isDragging, setDragging] = useState(false);
  const draggingEnabled = useSharedValue(false);

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

  const eventHandler = useAnimatedGestureHandler({
    onStart: () => {
      pressed.value = true;
      runOnJS(prepareToDrag)();
      startX.value = originFrame.value?.x || 0;
      startY.value = originFrame.value?.y || 0;
    },
    onActive: (event) => {
      offsetX.value = event.translationX;
      offsetY.value = event.translationY;

      x.value = event.translationX;
      y.value = event.translationY;

      screenOffsetX.value = event.absoluteX;
      screenOffsetY.value = event.absoluteY;
    },
    onEnd: () => {
      pressed.value = false;
      x.value = 0;
      y.value = 0;

      offsetX.value = 0;
      offsetY.value = 0;

      runOnJS(endDrag)();
      runOnJS(calcSize)();
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: pressed.value ? withTiming(0, { duration: 400 }) : 1,
      transform: [
        {
          translateX: x.value,
        },
        {
          translateY: y.value,
        },
      ],
    };
  });

  useEffect(() => {
    pressed.value = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [column, section, JSON.stringify(row), rowIndex]);

  useEffect(() => {
    if (disabled) {
      return;
    }
    calcSize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentView, rootRef.current, column, section, endDrag, rowIndex]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const timerRef = useSharedValue<NodeJS.Timeout | null>(null);

  const startLongPress = () => {
    timerRef.value = setTimeout(() => {
      draggingEnabled.value = true;
      console.log('start move');
    }, 1000);
  };

  const stopLongPress = () => {
    draggingEnabled.value = false;
    if (timerRef.value) {
      console.log('clear timeout');
      clearTimeout(timerRef.value);
    }
  };

  console.log('rerender', column, section, rowIndex);

  const panGesture = Gesture.Pan()
    .onTouchesDown(() => {
      console.log('touch down');
      runOnJS(startLongPress)();
    })
    .onFinalize((e) => {
      runOnJS(stopLongPress)();
      console.log('finalize', e.state);
    })
    .onTouchesMove((e, manager) => {
      // console.log('onTouchesDown');
      // manager.fail();
      if (!draggingEnabled.value) {
        manager.fail();
      }
    })
    .onStart(() => {
      pressed.value = true;
      runOnJS(prepareToDrag)();
      startX.value = originFrame.value?.x || 0;
      startY.value = originFrame.value?.y || 0;
    })
    .onUpdate(({ translationX, absoluteY, translationY, absoluteX }) => {
      offsetX.value = translationX;
      offsetY.value = translationY;

      x.value = translationX;
      y.value = translationY;

      screenOffsetX.value = absoluteX;
      screenOffsetY.value = absoluteY;
    })
    .onEnd(() => {
      pressed.value = false;
      x.value = 0;
      y.value = 0;

      offsetX.value = 0;
      offsetY.value = 0;

      runOnJS(endDrag)();
      runOnJS(calcSize)();
    });

  return (
    <View ref={rootRef}>
      {row ? (
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[animatedStyle]}>{children}</Animated.View>
        </GestureDetector>
      ) : (
        children
      )}
    </View>
  );

  // return (
  //   <Animated.View>
  //     {canDropIn && <View style={[styles.empty, hoverStyle]} />}
  //     <View ref={rootRef}>
  //       <Animated.View style={[animatedStyle]}>
  //         <View>{children}</View>
  //         {row && (
  //           <PanGestureHandler onGestureEvent={eventHandler}>
  //             <Animated.View
  //               style={[
  //                 styles.draggableView,
  //                 draggingAreaStyle &&
  //                   draggingAreaStyle(column, section, rowIndex),
  //               ]}
  //             />
  //           </PanGestureHandler>
  //         )}
  //       </Animated.View>
  //     </View>
  //   </Animated.View>
  // );
};

const styles = StyleSheet.create({
  draggableView: { position: 'absolute' },
  empty: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
});
