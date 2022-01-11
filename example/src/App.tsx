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
    const sections: Section[] = [
      { index: 0, title: '123', expanded: true },
      { index: 1, title: '321', expanded: true },
    ];
    const columns: Column[] = [
      { index: 0, title: 'COlumn 0' },
      { index: 1, title: 'COlumn 1' },
      { index: 2, title: 'COlumn 2' },
      { index: 3, title: 'COlumn 3' },
      { index: 4, title: 'COlumn 4' },
      { index: 5, title: 'COlumn 5' },
    ];
    const items: KanbanItem<any>[] = [
      { column: 0, section: 0, data: { value: 'item 1' } },
      { column: 0, section: 0, data: { value: 'item 2' } },
      { column: 0, section: 1, data: { value: 'item 3' } },
      { column: 1, section: 1, data: { value: 'item 5' } },
      { column: 1, section: 1, data: { value: 'item 6' } },
      { column: 1, section: 1, data: { value: 'item 7' } },
      { column: 1, section: 0, data: { value: 'item 8' } },
      { column: 1, section: 1, data: { value: 'item 9' } },
      { column: 1, section: 1, data: { value: 'item 10' } },
      { column: 0, section: 0, data: { value: 'item 11' } },
      { column: 1, section: 1, data: { value: 'item 12' } },
      { column: 0, section: 0, data: { value: 'item 13' } },
      { column: 1, section: 1, data: { value: 'item 14' } },
      { column: 1, section: 0, data: { value: 'item 15' } },
      { column: 0, section: 1, data: { value: 'item 16' } },
      { column: 1, section: 0, data: { value: 'item 17' } },
      { column: 1, section: 1, data: { value: 'item 18' } },
      { column: 0, section: 0, data: { value: 'item 19' } },
    ];
    setData({ columns, sections, items });
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text>Result: 123</Text>
      <Swimlane<{ value: string }>
        columns={data.columns}
        sections={data.sections}
        data={data.items}
        floatingColumnHeaders
        emptyItem={() => {
          return (
            <View style={{ marginVertical: 10, height: 70, width: 70 }}>
              <Text>Empty item</Text>
            </View>
          );
        }}
        renderColumnItem={(column, index) => (
          <View key={index}>
            <Text>{column.title}</Text>
          </View>
        )}
        renderSectionHeader={(section) => {
          return (
            <View key={section.index}>
              <Text>{section.title}</Text>
            </View>
          );
        }}
        onItemMoved={(_data, from, to, itemBefore, itemAfter) => {
          console.log(_data, from, to, itemBefore, itemAfter);
        }}
        renderItem={(info, column, section, row) => {
          // const item = data.items.filter(
          //   (item) => item.column === column && item.section === section
          // )?.[row];
          return info ? (
            <View
              style={{
                backgroundColor: 'red',
                marginVertical: 10,
                height: 300,
                width: 290,
              }}
            >
              <Text>
                {column}-{section}-{row}
              </Text>
              <Text>{info.data.value}</Text>
            </View>
          ) : null;
        }}
        columnContentStyle={{ marginHorizontal: 13 }}
        draggingAreaStyle={() => ({
          width: 100,
          height: 100,
          backgroundColor: 'green',
          bottom: 10,
          right: 10,
        })}
        columnWidth={290}
        enterCursorOffset={{ x: 40, y: 20 }}
        hoverStyle={{ backgroundColor: 'green' }}
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
