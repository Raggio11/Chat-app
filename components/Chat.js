import React, { Component } from 'react';
import { View, Text, Platform, KeyboardAvoidingView} from 'react-native';
import { GiftedChat, Bubble, InputToolbar } from 'react-native-gifted-chat';
import AsyncStorage from '@react-native-community/async-storage';
import NetInfo from '@react-native-community/netinfo';
import CustomActions from "./CustomActions";
import MapView from "react-native-maps";

const firebase = require('firebase');
require('firebase/firestore');


export default class Chat extends React.Component {
  constructor() {
    super();
    this.state = {
      messages: [],
      user: {
        _id: '',
        name: '',
        avatar: ''
      },
      isConnected: false,
      image: null,
      location: null,
    };

  const firebaseConfig = {
    apiKey: "AIzaSyB3HwSw37y677e01pLlMabkKHycSPb5W6s",
    authDomain: "chat-app-5d1a0.firebaseapp.com",
    projectId: "chat-app-5d1a0",
    storageBucket: "chat-app-5d1a0.appspot.com",
    messagingSenderId: "645304330120",
    appId: "1:645304330120:web:7093ec567e3f9c0174bc3d",
    measurementId: "G-X5THYG7J68"
  }

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  this.referenceChatUser = null;

  // Reference to the messages collection
  this.referenceChatMessages = firebase.firestore().collection('messages');
}

async getMessages() {
  let messages = "";
  try {
    messages = (await AsyncStorage.getItem("messages")) || [];
    this.setState({
      messages: JSON.parse(messages),
    });
  } catch (error) {
    console.log(error.message);
  }
}

//Saves messages in client-side storage
async saveMessages() {
  try {
    await AsyncStorage.setItem(
      "messages",
      JSON.stringify(this.state.messages)
    );
  } catch (error) {
    console.log(error.message);
  }
}

//Deletes messages from client-side storage
async deleteMessages() {
  try {
    await AsyncStorage.removeItem("messages");
    this.setState({
      messages: [],
    });
  } catch (error) {
    console.log(error.message);
  }
}

componentDidMount() {
  //Checks user connection
  NetInfo.fetch().then((connection) => {
    if (connection.isConnected) {
      console.log("online");

      //Authenticates user
      this.authUnsubscribe = firebase
        .auth()
        .onAuthStateChanged(async (user) => {
          if (!user) {
            await firebase.auth().signInAnonymously();
          }
          this.setState({
            isConnected: true,
            user: {
              _id: user.uid,
              name: this.props.route.params.name,
              avatar: "https://placeimg.com/140/140/any",
            },
            messages: [],
          });
          this.referenceChatMessages = firebase
            .firestore()
            .collection("messages");
          this.unsubscribeChatUser = this.referenceChatMessages
            .orderBy("createdAt", "desc")
            .onSnapshot(this.onCollectionUpdate);
        });
    } else {
      console.log("offline");
      this.setState({
        isConnected: false,
      });
      this.getMessages();
    }
  });
}

componentWillUnmount() {
  // this.unsubscribe();
  this.authUnsubscribe();
}

//Updates messages state
onCollectionUpdate = (querySnapshot) => {
  const messages = [];
  // go through each document
  querySnapshot.forEach((doc) => {
    // get the QueryDocumentSnapshot's data
    let data = doc.data();
    messages.push({
      _id: data._id,
      text: data.text,
      createdAt: data.createdAt.toDate(),
      user: data.user,
      image: data.image || null,
      location: data.location || null,
    });
  });

  this.setState({
    messages,
  });
};

//Adds messages to storage
addMessage() {
  const message = this.state.messages[0];
  this.referenceChatMessages.add({
    _id: message._id,
    text: message.text,
    createdAt: message.createdAt,
    user: message.user,
    image: message.image || null,
    location: message.location || null,
  });
}

//Event handler for sending messages
onSend(messages = []) {
  this.setState(
    (previousState) => ({
      messages: GiftedChat.append(previousState.messages, messages),
    }),
    () => {
      this.addMessage();
      this.saveMessages();
    }
  );
}

//Renders sender chat bubble
renderBubble(props) {
  return (
    <Bubble
      {...props}
      wrapperStyle={{
        right: {
          backgroundColor: "#576775",
        },
      }}
    />
  );
}

//Renders message input when online, removes when offline
renderInputToolbar(props) {
  if (this.state.isConnected == false) {
  } else {
    return <InputToolbar {...props} />;
  }
}

//Renders MapView that shows location
renderCustomView(props) {
  const { currentMessage } = props;
  if (currentMessage.location) {
    return (
      <MapView
        style={{ width: 200, height: 150, borderRadius: 13, margin: 3 }}
        region={{
          latitude: currentMessage.location.latitude,
          longitude: currentMessage.location.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      />
    );
  }
  return null;
}

renderCustomActions = (props) => {
  return <CustomActions {...props} />;
};

render() {
  let name = this.props.route.params.name;
  let color = this.props.route.params.color;
  this.props.navigation.setOptions({ title: name });

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: color,
      }}
    >
      <GiftedChat
        renderBubble={this.renderBubble.bind(this)}
        renderInputToolbar={this.renderInputToolbar.bind(this)}
        messages={this.state.messages}
        onSend={(messages) => this.onSend(messages)}
        user={this.state.user}
        renderActions={this.renderCustomActions}
        renderCustomView={this.renderCustomView}
        image={this.state.image}
      />
      {Platform.OS === "android" ? (
        <KeyboardAvoidingView behavior="height" />
      ) : null}
    </View>
  );
}
}