import { View, Text, StyleSheet } from 'react-native';

export function VerifiedBadge() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>✓ Verified</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  text: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
});
