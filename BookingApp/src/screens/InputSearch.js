import React, {useState, useEffect} from 'react';
import {
 View,
 Text, 
 TextInput,
 ScrollView,
 Modal,
 TouchableOpacity,
 StyleSheet,
 Image,
 Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const formatPrice = text => {
 return text.replace(/[^0-9]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

export default function InputSearchModal({visible, onClose, onApplyFilters, initialFilters}) {
 const [filters, setFilters] = useState({
   sortBy: initialFilters?.sortBy || null,
   priceRange: {
     min: initialFilters?.priceRange?.min || '',
     max: initialFilters?.priceRange?.max || ''
   },
   rating: initialFilters?.rating || null,
   services: initialFilters?.services || {},
   types: initialFilters?.types || {
    standard: false,
    deluxe: false,
    suite: false, 
    luxury: false,
    premium: false
  }
 });

 const [searchText, setSearchText] = useState('');
 const [recentSearches, setRecentSearches] = useState([]);
 const [services, setServices] = useState([]);

 const fetchServices = async () => {
   try {
     const response = await api.get('/services');
     setServices(response.data);
   } catch (error) {
     console.error('Error fetching services:', error);
   }
 };

 useEffect(() => {
   if (visible) {
     loadRecentSearches();
     fetchServices();
   }
 }, [visible]);

 const loadRecentSearches = async () => {
   try {
     const searches = await AsyncStorage.getItem('searchHistory');
     if (searches) setRecentSearches(JSON.parse(searches));
   } catch (error) {
     console.error('Error loading searches:', error);
   }
 };

 const handleDeleteSearch = async itemToDelete => {
   try {
     const updatedSearches = recentSearches.filter(item => item !== itemToDelete);
     await AsyncStorage.setItem('searchHistory', JSON.stringify(updatedSearches));
     setRecentSearches(updatedSearches);
   } catch (error) {
     console.error('Error deleting search:', error);
   }
 };

 const toggleFilter = (type, key) => {
   setFilters(prev => ({
     ...prev,
     [type]: {
       ...prev[type], 
       [key]: !prev[type][key]
     }
   }));
 };

 const handlePriceInput = (text, type) => {
   const formattedPrice = formatPrice(text);
   setFilters(prev => ({
     ...prev,
     priceRange: {
       ...prev.priceRange,
       [type]: formattedPrice
     }
   }));
 };

 const validatePriceRange = () => {
   const minValue = parseInt(filters.priceRange.min.replace(/\./g, '')) || 0;
   const maxValue = parseInt(filters.priceRange.max.replace(/\./g, '')) || Infinity;

   if (maxValue !== Infinity && minValue > maxValue) {
     Alert.alert('Lỗi', 'Giá tối thiểu không thể lớn hơn giá tối đa');
     return false;
   }
   return true;
 };

 const resetFilters = () => {
   setFilters({
     sortBy: null,
     priceRange: { min: '', max: '' },
     rating: null,
     services: {},
     types: {}
   });
 };

 const handleConfirm = () => {
   if (!validatePriceRange()) return;

   onApplyFilters({
     ...filters,
     priceRange: {
       min: filters.priceRange.min.replace(/\./g, ''),
       max: filters.priceRange.max.replace(/\./g, '')
     },
     highToLow: filters.sortBy === 'Giá tiền cao nhất',
     lowToHigh: filters.sortBy === 'Giá tiền thấp nhất', 
     highestRated: filters.sortBy === 'Đánh giá cao nhất',
     suggestedSort: filters.sortBy === 'Gợi ý cho bạn'
   });
   onClose();
 };

 return (
   <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
     <View style={styles.modalOverlay}>
       <View style={styles.modalContent}>
         <View style={styles.modalHeader}>
           <Text style={styles.modalTitle}>Tùy chỉnh tìm kiếm</Text>
         </View>

         <ScrollView showsVerticalScrollIndicator={false}>
           <View style={styles.searchContainer}>
             <Image source={require('../assets/search-normal.png')} style={styles.searchIcon} />
             <TextInput
               style={styles.searchInput}
               placeholder="Tìm kiếm"
               value={searchText}
               onChangeText={setSearchText}
               placeholderTextColor="#888"
             />
           </View>

           {recentSearches.length > 0 && (
             <View style={styles.recentSearches}>
               <Text style={styles.sectionTitle}>Tìm kiếm gần đây</Text>
               {recentSearches.map((search, index) => (
                 <View key={index} style={styles.recentSearchItem}>
                   <Text style={styles.recentSearchText}>{search}</Text>
                   <TouchableOpacity onPress={() => handleDeleteSearch(search)}>
                     <Image source={require('../assets/searchClose.png')} style={styles.deleteIcon} />
                   </TouchableOpacity>
                 </View>
               ))}
             </View>
           )}

           <View style={styles.section}>
             <Text style={styles.sectionTitle}>Sắp xếp theo</Text>
             <ScrollView horizontal showsHorizontalScrollIndicator={false}>
               {['Gợi ý cho bạn', 'Giá tiền cao nhất', 'Giá tiền thấp nhất', 'Đánh giá cao nhất'].map(option => (
                 <TouchableOpacity
                   key={option}
                   style={[styles.sortButton, filters.sortBy === option && styles.selectedButton]}
                   onPress={() => setFilters(prev => ({...prev, sortBy: option}))}>
                   <Text style={[styles.sortText, filters.sortBy === option && styles.selectedText]}>
                     {option}
                   </Text>
                 </TouchableOpacity>
               ))}
             </ScrollView>
           </View>

           <View style={styles.section}>
             <Text style={styles.sectionTitle}>Khoảng giá</Text>
             <View style={styles.priceContainer}>
               <View style={styles.priceInputContainer}>
                 <TextInput
                   style={styles.priceInput}
                   placeholder="Giá tối thiểu"
                   value={filters.priceRange.min}
                   onChangeText={text => handlePriceInput(text, 'min')}
                   keyboardType="numeric"
                 />
                 <Text style={styles.currencyText}>đ</Text>
               </View>
               <Text style={styles.priceSeparator}>-</Text>
               <View style={styles.priceInputContainer}>
                 <TextInput
                   style={styles.priceInput}
                   placeholder="Giá tối đa"
                   value={filters.priceRange.max}
                   onChangeText={text => handlePriceInput(text, 'max')}
                   keyboardType="numeric"
                 />
                 <Text style={styles.currencyText}>đ</Text>
               </View>
             </View>
           </View>

           <View style={styles.section}>
             <Text style={styles.sectionTitle}>Đánh giá</Text>
             <View style={styles.ratingContainer}>
               {[5, 4, 3, 2, 1].map(rating => (
                 <TouchableOpacity
                   key={rating}
                   style={[styles.ratingButton, filters.rating === rating && styles.selectedRatingButton]}
                   onPress={() => setFilters(prev => ({...prev, rating}))}>
                   <Image
                     source={require('../assets/star.png')}
                     style={[styles.starIcon, filters.rating === rating && styles.selectedStarIcon]}
                   />
                   <Text style={[styles.ratingText, filters.rating === rating && styles.selectedRatingText]}>
                     {rating}
                   </Text>
                 </TouchableOpacity>
               ))}
             </View>
           </View>

           <View style={styles.section}>
             <Text style={styles.sectionTitle}>Tiện ích</Text>
             <View style={styles.servicesContainer}>
               {services.map(service => (
                 <TouchableOpacity
                   key={service._id}
                   style={[
                     styles.serviceButton,
                     filters.services[service._id] && styles.selectedServiceButton
                   ]}
                   onPress={() => toggleFilter('services', service._id)}>
                   <Image
                     source={service.icon ? {uri: service.icon} : require('../assets/check.png')}
                     style={[
                       styles.checkIcon,
                       filters.services[service._id] && styles.selectedCheckIcon
                     ]}
                   />
                   <Text style={[
                     styles.serviceText,
                     filters.services[service._id] && styles.selectedServiceText
                   ]}>
                     {service.name}
                   </Text>
                 </TouchableOpacity>
               ))}
             </View>
           </View>

           <View style={styles.section}>
             <Text style={styles.sectionTitle}>Loại phòng</Text>
             <View style={styles.typesContainer}>
               {['standard', 'deluxe', 'suite', 'luxury', 'premium'].map(type => (
                 <TouchableOpacity
                   key={type}
                   style={[styles.typeButton, filters.types[type] && styles.selectedTypeButton]}
                   onPress={() => toggleFilter('types', type)}>
                   <Text style={styles.typeText}>{type}</Text>
                 </TouchableOpacity>
               ))}
             </View>
           </View>
         </ScrollView>

         <View style={styles.bottomControls}>
           <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
             <Text style={styles.resetButtonText}>Đặt lại</Text>
           </TouchableOpacity>
           <TouchableOpacity style={styles.applyButton} onPress={handleConfirm}>
             <Text style={styles.applyButtonText}>Áp dụng</Text>
           </TouchableOpacity>
         </View>
       </View>
     </View>
   </Modal>
 );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 10,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 10,
  },
  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
    tintColor: '#999',
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#000',
  },
  // Lịch sử tìm kiếm
  recentSearches: {
    marginBottom: 24,
  },
  recentSearchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  recentSearchText: {
    color: '#000',
  },
  deleteIcon: {
    width: 16,
    height: 16,
    tintColor: '#999',
  },
  // Sắp xếp theo
  sortButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedButton: {
    backgroundColor: '#007AFF',
  },
  sortText: {
    fontSize: 15,
    color: '#000',
  },
  selectedText: {
    color: '#FFF',
  },
  // Khoảng giá
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  priceInput: {
    flex: 1,
    height: 40,
    color: '#000',
  },
  currencyText: {
    color: '#000',
    marginLeft: 4,
  },
  priceSeparator: {
    marginHorizontal: 16,
    fontSize: 16,
    color: '#000',
  },
  // Đánh giá
  ratingContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  ratingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedRatingButton: {
    backgroundColor: '#007AFF',
  },
  starIcon: {
    width: 16,
    height: 16,
    marginRight: 4,
    tintColor: '#FFD700',
  },
  selectedStarIcon: {
    tintColor: '#FFF',
  },
  ratingText: {
    color: '#000',
  },
  selectedRatingText: {
    color: '#FFF',
  },
  // Dịch vụ (services)
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  serviceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedServiceButton: {
    backgroundColor: '#007AFF',
  },
  checkIcon: {
    width: 16,
    height: 16,
    marginRight: 4,
    tintColor: '#999',
  },
  selectedCheckIcon: {
    tintColor: '#FFF',
  },
  serviceText: {
    color: '#000',
  },
  selectedServiceText: {
    color: '#FFF',
  },
  // Loại phòng
  typesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedTypeButton: {
    backgroundColor: '#007AFF',
  },
  typeText: {
    color: '#000',
  },
  selectedTypeText: {
    color: '#FFF',
  },
  // Nút "Đặt lại" & "Áp dụng"
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 8,
    paddingVertical: 12,
  },
  resetButtonText: {
    color: '#000',
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    alignItems: 'center',
    marginLeft: 8,
    paddingVertical: 12,
  },
  applyButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
});