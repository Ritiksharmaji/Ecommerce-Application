import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BaseToast = ({ icon, color, text1, text2 }) => (
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#111827',
      padding: 14,
      borderRadius: 14,
      marginHorizontal: 16,
      elevation: 5,
    }}
  >
    <Ionicons name={icon} size={24} color={color} />
    <View style={{ marginLeft: 10 }}>
      <Text style={{ color: '#fff', fontWeight: 'bold' }}>{text1}</Text>
      {text2 && (
        <Text style={{ color: '#9CA3AF', fontSize: 12 }}>{text2}</Text>
      )}
    </View>
  </View>
);

export const toastConfig = {
  success: (props) => (
    <BaseToast {...props} icon="checkmark-circle" color="#22C55E" />
  ),
  error: (props) => (
    <BaseToast {...props} icon="close-circle" color="#EF4444" />
  ),
  info: (props) => (
    <BaseToast {...props} icon="information-circle" color="#3B82F6" />
  ),
};