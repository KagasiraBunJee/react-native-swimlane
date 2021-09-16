import noop from 'lodash/noop';
import React, { useCallback, useMemo, useRef } from 'react';
import { LayoutRectangle, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import type { Draggable } from './types';

interface DropInViewProps extends Draggable {
  columnId: string;
  sectionId: string;
  shouldAnimate: boolean;
  parentView?: any;
  height: number | null;
  offsetY?: number;
  canDropIn?: boolean;
  canBeDragged?: boolean;
  isDragging?: boolean;
  onLayout?: (frame: LayoutRectangle) => void;
}

export const DropInViewComponent: React.FC<DropInViewProps> = ({
  children,
  onLayout = noop,
}) => {
  const rootRef = useRef<View>(null);
  const panX = useSharedValue(0);
  const panY = useSharedValue(0);
  const originFrame = useRef<LayoutRectangle | null>(null);

  const dropInAnimation = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: panX.value,
        },
        {
          translateY: panY.value,
        },
      ],
    };
  });

  const onLayoutReceived = useCallback((frame: LayoutRectangle) => {
    if (!originFrame.current) {
      originFrame.current = frame;
    }
    onLayout(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const size = useMemo(
    () =>
      originFrame.current
        ? {
            width: originFrame.current.width,
            height: originFrame.current.height,
          }
        : {},
    []
  );

  return (
    <View style={[size]}>
      <Animated.View
        onLayout={({ nativeEvent }) => onLayoutReceived(nativeEvent.layout)}
        style={[dropInAnimation]}
      >
        <View ref={rootRef} style={{ flex: 1 }}>
          {children}
        </View>
      </Animated.View>
    </View>
  );
};
