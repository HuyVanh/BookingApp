import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import React, { useState, useRef } from 'react';
import AppIntroSlider from 'react-native-app-intro-slider';

const slides = [
    {
        id: 1,
        title: 'Du lịch an toàn,\nthoải mái và dễ dàng',
        description: 'Trải nghiệm những chuyến đi an toàn và tiện lợi với chúng tôi. Đảm bảo rằng bạn luôn cảm thấy thoải\nmái trong suốt hành trình.',
        image: require('../assets/onboard1.png'),
    },
    {
        id: 2,
        title: 'Tìm khách sạn tốt nhất\n cho kỳ nghỉ của bạn',
        description: 'Khám phá các khách sạn tốt nhất cho kỳ nghỉ của bạn với giá cả hợp lý và dịch vụ chất lượng.',
        image: require('../assets/onboard2.png'),
    },
    {
        id: 3,
        title: 'Khám phá thế giới\ncùng chúng tôi',
        description: 'Cùng chúng tôi bước vào những cuộc phiêu lưu mới mẻ và thú vị, khám phá thế giới đầy sắc màu và đa\ndạng.',
        image: require('../assets/onboard3.png'),
    },
];


const OnboardScreen = ({navigation}) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const sliderRef = useRef(null);

    const renderItem = ({ item }) => {
        return (
            <View style={styles.slide}>
                <View style={styles.imageContainer}>
                    <Image source={item.image} style={styles.image} />
                </View>
                <View style={styles.textContainer}>
                    <View style={styles.cachRong}>
                        <Text style={styles.title}>{item.title}</Text>
                        <Text style={styles.text}>{item.description}</Text>
                    </View>

                    <View style={styles.khoangTrong}>
                        <View style={styles.paginationContainer}>
                            {slides.map((_, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.paginationDot,
                                        activeIndex === index ? styles.activeDot : styles.inactiveDot,
                                    ]}
                                />
                            ))}
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.button, styles.nextButton]}
                        onPress={() => {
                            if (activeIndex < slides.length - 1) {
                                sliderRef.current.goToSlide(activeIndex + 1, true);
                            } else {
                                navigation.navigate('Login'); // Chỉnh sửa thành 'Login'
                            }
                        }}
                    >
                        <Text style={styles.buttonText}>Tiếp theo</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.skipButton]}
                        onPress={() => navigation.navigate('Login')} // Chỉnh sửa thành 'Login'
                    >
                        <Text style={styles.nextButtonText}>Bỏ qua</Text>
                    </TouchableOpacity>

                </View>
            </View>
        );
    };

    return (
        <AppIntroSlider
            renderItem={renderItem}
            data={slides}
            onSlideChange={(index) => setActiveIndex(index)}
            renderPagination={() => null} // Giữ pagination ẩn
            ref={sliderRef}
        />
    );
};

export default OnboardScreen;

const styles = StyleSheet.create({
    cachRong: {
        width: '100%',
        height: '37%',
    },
    khoangTrong: {
        marginTop: 30,
    },
    slide: {
        flex: 1,
        flexDirection: 'column',
        backgroundColor: '#ffffff',
    },
    imageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        marginBottom: 20,
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    title: {
        color: '#000000',
        fontSize: 30,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    text: {
        color: '#000000',
        fontSize: 14,
        textAlign: 'center',
        margin: 10,
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginVertical: 10,
    },
    paginationDot: {
        width: 15,
        height: 15,
        marginHorizontal: 5,
        backgroundColor: 'white',
        borderRadius: 2,
        borderWidth: 1,
    },
    activeDot: {
        backgroundColor: '#4A7DFF',
        borderColor: 'transparent',
    },
    inactiveDot: {
        backgroundColor: 'white',
        borderColor: '#727272',
    },
    button: {
        width: '90%',
        height: 60,
        marginVertical: 10,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    nextButton: {
        backgroundColor: '#4A7DFF',
    },
    skipButton: {
        backgroundColor: '#E2E2E2',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    nextButtonText: {
        color: '#4A7DFF',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});