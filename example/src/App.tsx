import React, { useState } from 'react';
import { useEffect } from 'react';

import { StyleSheet, View, Text, SafeAreaView } from 'react-native';
import { Swimlane, Column, Section, KanbanItem } from 'react-native-swimlane';

export default function App() {
  const [data, setData] = useState<{
    items: KanbanItem<any>[];
    columns: Column[];
    sections: Section[];
  }>({
    columns: [],
    items: [],
    sections: [],
  });

  useEffect(() => {
    setTimeout(() => {
      console.log('update');
      const sections: Section[] = [
        { index: 0, title: '123' },
        { index: 1, title: '321' },
      ];
      const columns: Column[] = [
        { index: 0, title: 'COlumn 0' },
        { index: 1, title: 'COlumn 1' },
      ];
      const items: KanbanItem<any>[] = [
        { column: 0, section: 0, data: {} },
        { column: 0, section: 0, data: {} },
        { column: 1, section: 0, data: {} },
        { column: 1, section: 0, data: {} },
      ];
      setData({ columns, sections, items });
    }, 2000);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text>Result: 123</Text>
      <Swimlane
        columns={data.columns}
        sections={data.sections}
        data={data.items}
        emptyItem={() => <Text>Empty item</Text>}
        renderColumnItem={(column) => (
          <View>
            <Text>{column.title}</Text>
          </View>
        )}
        renderSectionHeader={(section) => {
          return (
            <View>
              <Text>{section.title}</Text>
            </View>
          );
        }}
        renderItem={() => {
          return (
            <View>
              <Text>123</Text>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {},
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
});
