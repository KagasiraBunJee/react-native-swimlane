import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  FlatList,
  Text,
  PanResponder,
  SectionList,
  TouchableOpacity,
} from 'react-native';
import {
  PanGestureHandler,
  LongPressGestureHandler,
  State,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useSharedValue,
  event,
  useAnimatedStyle,
} from 'react-native-reanimated';

const ItemView: React.FC<{
  index: number;
  item: string;
  separators: any;
  callback: (enableScroll: boolean) => void;
}> = ({ item, callback }) => {
  const panX = useSharedValue(0);
  const readyToPan = useSharedValue(false);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (readyToPan.value) {
          panX.value = gestureState.dx;
        }
      },
      onPanResponderRelease: () => {
        if (readyToPan.value) {
          callback(true);
          readyToPan.value = false;
          panX.value = 0;
        }
      },
    })
  ).current;

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: panX.value,
      },
    ],
  }));

  return (
    <View
      style={{
        width: 2000,
        height: 1000,
        justifyContent: 'center',
        alignItems: 'center',
      }}
      {...panResponder.panHandlers}
    >
      <Animated.View style={[animatedStyles]}>
        <TouchableOpacity
          onLongPress={() => {
            readyToPan.value = true;
            callback(false);
          }}
        >
          <Text style={{ width: 100, height: 100, backgroundColor: 'wheat' }}>
            {item}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

export const LongPressButton: React.FC = ({ children }) => {
  const [, updateRender] = useState(0);
  const [enable, setScroll] = useState(true);

  useEffect(() => {
    setTimeout(() => updateRender(1), 0);
  }, []);

  const items = [{ title: '123', data: ['item 1', 'item 2', 'item 3'] }];

  return (
    <View>
      <Animated.ScrollView scrollEnabled={enable} horizontal>
        <SectionList
          scrollEnabled={enable}
          sections={items}
          renderItem={(props) => (
            <ItemView {...props} callback={(status) => setScroll(status)} />
          )}
        />
      </Animated.ScrollView>
      {/* <LongPressGestureHandler
        minDurationMs={1000}
        simultaneousHandlers={panRef}
        ref={longPressRef}
        onHandlerStateChange={({ nativeEvent }) => {
          shouldDrag.value = nativeEvent.state === State.ACTIVE;
        }}
      >
        <View>
          <PanGestureHandler
            ref={panRef}
            simultaneousHandlers={longPressRef}
            onGestureEvent={eventHandler}
            waitFor={longPressRef}
          >
            <View>{children}</View>
          </PanGestureHandler>
        </View>
      </LongPressGestureHandler> */}
    </View>
  );
};
