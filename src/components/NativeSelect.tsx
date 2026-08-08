import { makeStyles, tokens } from "@fluentui/react-components";

const useStyles = makeStyles({
  select: {
    height: "32px",
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    fontSize: "14px",
    fontFamily: "inherit",
    padding: "0 8px",
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    width: "100%",
    boxSizing: "border-box",
  },
});

export interface NativeSelectOption<T extends string> {
  value: T;
  label: string;
}

interface NativeSelectProps<T extends string> {
  value: T;
  options: readonly NativeSelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  disabled?: boolean;
  ariaLabel?: string;
}

/**
 * Fluent UI's <Dropdown> crashes the WebView2 process this task pane runs
 * in as soon as its selection changes (see ROADMAP.md's Phase 2 fix note).
 * Every material/category/unit picker in this app uses this native
 * <select> instead - never reintroduce Fluent's Dropdown/Combobox here.
 */
export function NativeSelect<T extends string>({
  value,
  options,
  onChange,
  placeholder,
  disabled,
  ariaLabel,
}: NativeSelectProps<T>) {
  const styles = useStyles();

  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as T)}
      className={styles.select}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
