/**
 * StAuth10244: I Rodrigo Wong Mac, #000887648 certify that this material is my original work. 
 * No other person's work has been used without due acknowledgement. I have not made 
 * my work available to anyone else.
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  StyleSheet,
  View,
  TextInput,
  Text,
  Button,
  Alert,
  TouchableOpacity,
  Switch,
} from "react-native";
import MapView, { Marker, Callout, Circle } from "react-native-maps";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";

export default function App() {
  const [location, setLocation] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [radiusModalVisible, setRadiusModalVisible] = useState(false);
  const [currentCoordinate, setCurrentCoordinate] = useState(null);
  const [attractionName, setAttractionName] = useState("");
  const [attractionDescription, setAttractionDescription] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [searchRadius, setSearchRadius] = useState(0);
  const [userLocation, setUserLocation] = useState(null);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [displayMarkers, setDisplayMarkers] = useState([]);

  const mapRef = useRef(null);

  useEffect(() => {
    loadMarkers();
    getCurrentLocation();
    watchUserLocation();
  }, []);

  const getCurrentLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "Permission to access location was denied"
      );
      return;
    }
    let loc = await Location.getCurrentPositionAsync({});
    setLocation({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    });
    setCurrentLocation({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    });
    mapRef.current.animateToRegion({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    });
  };

  const watchUserLocation = async () => {
    Location.watchPositionAsync({ distanceInterval: 10 }, (location) => {
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    });
  };

  const loadMarkers = async () => {
    const storedMarkers = await AsyncStorage.getItem("markers");
    if (storedMarkers) {
      const loadedMarkers = JSON.parse(storedMarkers);
      setMarkers(loadedMarkers);
      setDisplayMarkers(loadedMarkers);
    }
  };

  const handleAddMarker = (e) => {
    setCurrentCoordinate(e.nativeEvent.coordinate);
    setModalVisible(true);
  };

  const handleSaveMarker = async () => {
    const newMarker = {
      coordinate: currentCoordinate,
      title: attractionName,
      description: attractionDescription,
      id: Date.now(),
      favorite: isFavorite,
    };
    const updatedMarkers = [...markers, newMarker];
    await AsyncStorage.setItem("markers", JSON.stringify(updatedMarkers));
    setMarkers(updatedMarkers);
    setDisplayMarkers(updatedMarkers);

    setModalVisible(false);
    setAttractionName("");
    setAttractionDescription("");
    setIsFavorite(false);
  };

  const toggleFavorite = async (markerId) => {
    const updatedMarkers = markers.map((marker) => {
      if (marker.id === markerId) {
        return { ...marker, favorite: !marker.favorite };
      }
      return marker;
    });
    await AsyncStorage.setItem("markers", JSON.stringify(updatedMarkers));
    setMarkers(updatedMarkers);
    filterMarkers();
  };

  const filterMarkers = () => {
    let filtered = markers;
    if (showOnlyFavorites) {
      filtered = filtered.filter((marker) => marker.favorite);
    }
    if (searchRadius > 0 && currentLocation) {
      filtered = filtered.filter((marker) => {
        return (
          getDistance(
            currentLocation.latitude,
            currentLocation.longitude,
            marker.coordinate.latitude,
            marker.coordinate.longitude
          ) <= searchRadius
        );
      });
    } else if (searchRadius === 0) {
      filtered = markers.filter((marker) =>
        showOnlyFavorites ? marker.favorite : true
      );
    }
    setDisplayMarkers(filtered);
  };
  const deleteMarker = async (markerId) => {
    const updatedMarkers = markers.filter((marker) => marker.id !== markerId);
    await AsyncStorage.setItem("markers", JSON.stringify(updatedMarkers));
    setMarkers(updatedMarkers);
    setDisplayMarkers(updatedMarkers);
  };

  const cancelMarker = () => {
    setAttractionName("");
    setAttractionDescription("");
    setModalVisible(false)
  }
  useEffect(() => {
    filterMarkers();
  }, [showOnlyFavorites, markers, searchRadius]);


  // This Function was generated in ChatGPT
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; 
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  return (
    <View style={styles.container}>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          Alert.alert("Modal has been closed.");
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <TextInput
              style={styles.modalText}
              placeholder="Enter attraction name"
              value={attractionName}
              onChangeText={setAttractionName}
            />
            <TextInput
              style={styles.modalText}
              placeholder="Enter attraction description"
              value={attractionDescription}
              onChangeText={setAttractionDescription}
            />
            <View style={styles.favoriteToggle}>
              <Text>Favorite: </Text>
              <Switch value={isFavorite} onValueChange={setIsFavorite} />
            </View>
            <Button title="Save" onPress={handleSaveMarker} />
            <Button
              title="Cancel"
              color="red"
              onPress={cancelMarker}
            />
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={radiusModalVisible}
        onRequestClose={() => {
          setRadiusModalVisible(!radiusModalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Picker
              selectedValue={searchRadius}
              onValueChange={(itemValue, itemIndex) =>
                setSearchRadius(itemValue)
              }
              style={{ width: 200, height: 200 }}
            >
              <Picker.Item label="None" value={0} />
              <Picker.Item label="2 km" value={2000} />
              <Picker.Item label="5 km" value={5000} />
              <Picker.Item label="10 km" value={10000} />
            </Picker>

            <Button
              title="Close"
              onPress={() => setRadiusModalVisible(false)}
            />
          </View>
        </View>
      </Modal>

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={location}
        onLongPress={handleAddMarker}
      >
        {displayMarkers.map((marker, index) => (
          <Marker
            key={index}
            coordinate={marker.coordinate}
            title={marker.title}
            description={marker.description}
            pinColor={marker.favorite ? "gold" : "red"}
          >
            <Callout>
              <Text>Title: {marker.title}</Text>
              <Text>Description: {marker.description}</Text>
              <Button
                title={marker.favorite ? "Unfavorite" : "Favorite"}
                onPress={() => toggleFavorite(marker.id)}
              />
              <Button
                title="Delete"
                color="red"
                onPress={() => deleteMarker(marker.id)}
              />
            </Callout>
          </Marker>
        ))}

        {currentLocation && (
          <Circle
            center={currentLocation}
            radius={searchRadius}
            fillColor="rgba(255, 0, 0, 0.1)"
            strokeColor="rgba(255, 0, 0, 0.5)"
          />
        )}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="You are here"
            description="Your current location"
            pinColor="blue"
          />
        )}
      </MapView>

      <View style={styles.searchSection}>
        <View style={styles.controlItem}>
          <Text>Show Only Favorites:</Text>
          <Switch
            value={showOnlyFavorites}
            onValueChange={(value) => setShowOnlyFavorites(value)}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={showOnlyFavorites ? "#f5dd4b" : "#f4f3f4"}
          />
        </View>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setRadiusModalVisible(true)}
        >
          <Text>Search by Radius: {searchRadius / 1000}km</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchSection}>
        <TouchableOpacity style={styles.button} onPress={getCurrentLocation}>
          <Text>Find Me</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  map: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
    width: 200,
    padding: 10,
    borderColor: "gray",
    borderWidth: 1,
  },
  button: {
    backgroundColor: "lightblue",
    padding: 10,
    margin: 10,
    borderRadius: 5,
  },
  controls: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  controlItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  searchSection: {
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  favoriteToggle: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
});
