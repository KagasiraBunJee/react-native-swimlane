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
    // setTimeout(() => {
    //   // console.log('update');
    //   const sections: Section[] = [
    //     { index: 0, title: '123', expanded: true },
    //     { index: 1, title: '321', expanded: true },
    //   ];
    //   const columns: Column[] = [
    //     { index: 0, title: 'COlumn 0' },
    //     { index: 1, title: 'COlumn 1' },
    //   ];
    //   const items: KanbanItem<any>[] = [
    //     { column: 0, section: 0, data: { value: 'item 1' } },
    //     { column: 0, section: 0, data: { value: 'item 2' } },
    //     { column: 1, section: 1, data: { value: 'item 3' } },
    //     { column: 1, section: 1, data: { value: 'item 4' } },
    //   ];
    //   setData({ columns, sections, items });
    // }, 3000);

    const sections: Section[] = [
      { index: 0, title: '123', expanded: true },
      { index: 1, title: '321', expanded: true },
    ];
    const columns: Column[] = [
      { index: 0, title: 'COlumn 0' },
      { index: 1, title: 'COlumn 1' },
    ];
    const items: KanbanItem<any>[] = [
      { column: 0, section: 0, data: { value: 'item 1' } },
      { column: 0, section: 0, data: { value: 'item 2' } },
      { column: 0, section: 1, data: { value: 'item 3' } },
      { column: 1, section: 1, data: { value: 'item 4' } },
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
        renderItem={(info, column, section, row) => {
          // const item = data.items.filter(
          //   (item) => item.column === column && item.section === section
          // )?.[row];
          return info ? (
            <View
              style={{
                backgroundColor: 'red',
                marginVertical: 10,
                height: 70,
                width: 70,
              }}
            >
              <Text>
                {column}-{section}-{row}
              </Text>
              <Text>{info.data.value}</Text>
            </View>
          ) : null;
        }}
        showLastAsEmpty
        columnContentStyle={{ marginHorizontal: 13 }}
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
