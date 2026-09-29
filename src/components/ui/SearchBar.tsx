import { View, TextInput, Pressable, StyleSheet, TextInputProps } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, spacing, radii } from '@/theme';

interface SearchBarProps extends Pick<TextInputProps, 'placeholder' | 'value' | 'onChangeText' | 'onSubmitEditing'> {
  onClear?: () => void;
  onPressFilters?: () => void;
  filtersActive?: boolean;
}

/**
 * Search field with an inline filter button, so the feed header is a
 * single row instead of two competing controls.
 */
export function SearchBar({
  placeholder,
  value,
  onChangeText,
  onSubmitEditing,
  onClear,
  onPressFilters,
  filtersActive = false,
}: SearchBarProps) {
  return (
    <View style={styles.row}>
      <View style={styles.field}>
        <MaterialCommunityIcons
          name="magnify"
          size={20}
          color={colors.textMuted}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmitEditing}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="never"
        />
        {value ? (
          <Pressable
            onPress={onClear}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            style={styles.clear}
          >
            <MaterialCommunityIcons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {onPressFilters ? (
        <Pressable
          onPress={onPressFilters}
          accessibilityRole="button"
          accessibilityLabel="Filters"
          style={({ pressed }) => [
            styles.filterButton,
            filtersActive && styles.filterButtonActive,
            pressed && styles.pressed,
          ]}
        >
          <MaterialCommunityIcons
            name="tune-variant"
            size={20}
            color={filtersActive ? colors.textInverse : colors.primary}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    height: 46,
  },
  searchIcon: { marginRight: spacing.sm },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    // Removes the default focus ring on web; native keeps its own.
    ...(({ outlineStyle: 'none' } as unknown) as object),
  },
  clear: { paddingLeft: spacing.xs },
  filterButton: {
    width: 46,
    height: 46,
    borderRadius: radii.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: { backgroundColor: colors.primary },
  pressed: { opacity: 0.6 },
});
