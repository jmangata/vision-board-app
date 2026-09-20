import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TopBar({ title, leftIcon, onLeftPress, rightIcon, onRightPress, rightColor = '#0D3F7E' }) {
  const insets = useSafeAreaInsets();

  const renderAction = (icon, onPress, color) => icon && onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={icon}
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => [styles.action, pressed && styles.pressed]}
    >
      <MaterialIcons name={icon} size={24} color={color} />
    </Pressable>
  ) : <View style={styles.action} />;

  return (
    <View style={[styles.safeHeader, { paddingTop: insets.top }]}>
      <View style={styles.bar}>
        {renderAction(leftIcon, onLeftPress, '#0D3F7E')}
        <Text numberOfLines={1} style={styles.title}>{title}</Text>
        {renderAction(rightIcon, onRightPress, rightColor)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeHeader: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E2E8',
    zIndex: 10,
    ...Platform.select({
      ios: { shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  bar: { height: 64, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  action: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
  pressed: { backgroundColor: '#F3F3F9' },
  title: { flex: 1, marginHorizontal: 8, color: '#0D3F7E', fontFamily: 'Inter_700Bold', fontSize: 20, textAlign: 'center' },
});
