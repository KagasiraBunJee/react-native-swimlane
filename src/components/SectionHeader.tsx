import React from 'react';
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import type { Column } from './types';

export const SectionHeader: React.FC<{
  index: number;
  columns: Column[];
  style?: StyleProp<ViewStyle>;
  renderColumnItem: (column: Column, index: number) => React.ReactNode;
  onSectionPress: (index: number) => void;
}> = ({
  index,
  renderColumnItem,
  children,
  style,
  columns,
  onSectionPress,
}) => (
  <View key={index}>
    {index === 0 && (
      <View style={[style, styles.sectionHeader]}>
        {columns.map(renderColumnItem)}
      </View>
    )}
    <TouchableOpacity onPress={() => onSectionPress(index)}>
      {children}
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
  },
});
