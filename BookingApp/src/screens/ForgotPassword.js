import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';

const ForgotPasswordScreen = ({ navigation }) => {
    return (
        <View style={styles.container}>
            <Image source={require('../assets/lock.png')} style={styles.logo} />

            <View style={styles.itemContainer1}>
                <TouchableOpacity
                    style={styles.itemContainer}
                    onPress={() => navigation.navigate('EmailForgotPassWordScreen')}
                >
                    <View style={styles.logoBackground}>
                        <Image source={require('../assets/sms.png')} style={styles.logo1} />
                    </View>
                    <View style={styles.textWrapper}>
                        <Text style={styles.text1}>Tới Email</Text>
                        <Text style={styles.text}>kha*****@gmail.com</Text>
                    </View>
                </TouchableOpacity>
            </View>

            <View style={styles.buttonContainer}>
                <TouchableOpacity 
                    style={styles.button} 
                    onPress={() => navigation.navigate('EmailForgotPassWordScreen')}
                >
                    <Text style={styles.buttonText}>Tiếp tục</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    itemContainer1: {
        alignItems: 'center',
        padding: 30,
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    logo: {
        width: 200,
        height: 200,
        alignSelf: 'center',
        marginBottom: 30,
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        paddingBottom: 0,
        width: 316,
        height: 122,
        backgroundColor: 'white',
        borderRadius: 20,
        paddingHorizontal: 20,
        borderColor: 'gray',
        borderWidth: 2,
    },
    logoBackground: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#e0e0e0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    logo1: {
        width: 40,
        height: 40,
    },
    textWrapper: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        flex: 1,
    },
    text1: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    text: {
        fontWeight: 'bold',
        fontSize: 15,
        color: 'black',
    },
    buttonContainer: {
        alignItems: 'center',
        marginTop: 20,
    },
    button: {
        width: 353,
        height: 60,
        backgroundColor: '#4A7DFF',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
    },
});

export default ForgotPasswordScreen;