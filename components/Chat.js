import React from 'react';
import { View, Text } from 'react-native';

export default class Chat extends React.Component {

  render() {
    let { name } = this.props.route.params;
    let {color} = this.props.route.params;
    this.props.navigation.setOptions({ title: name });

    return (
      <View style={{
        flex: 1, 
        backgroundColor: color}}
      >  
      </View>
    );
  };
}