# react-native-swimlane

Prototype for kanban style table style with sections

## Installation

```sh
npm install react-native-swimlane
```

## Usage

```js
import { Swimlane, Column, Section, KanbanItem } from 'react-native-swimlane';

// ...

<Swimlane<{ value: string }>
   columns={data.columns}
   sections={data.sections}
   data={data.items}
   emptyItem={() => {
     return (
       <View>
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
   onItemMoved={(from, to, itemBefore, itemAfter) => {
     console.log(from, to, itemBefore, itemAfter);
   }}
   renderItem={(info, column, section, row) => {
     return info ? (
       <View>
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
   enterCursorOffset={{ x: 40, y: 20 }}
 />
```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT
