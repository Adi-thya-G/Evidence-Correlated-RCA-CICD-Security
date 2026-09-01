import { useState } from "react";
import '../style/Toggle.css'
interface ToggleProps {
  /** Controlled checked state. Omit for uncontrolled usage. */
  checked?: boolean;
  /** Initial state when uncontrolled. Defaults to false. */
  defaultChecked?: boolean;
  /** Called with the new state whenever the toggle is switched. */
  onChange?: (checked: boolean) => void;
  /** Disables interaction and dims the control. */
  disabled?: boolean;
  /** Accessible label for screen readers. */
  label?: string;
  /** Optional size variant: "sm" | "md" | "lg". Defaults to "md". */
  size?: "sm" | "md" | "lg";
}
 
const Toggle: React.FC<ToggleProps> = ({
  checked,
  defaultChecked = false,
  onChange,
  disabled = false,
  label = "Toggle",
  size = "md",
}) => {
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const isControlled = checked !== undefined;
  const isOn = isControlled ? checked : internalChecked;
 
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.checked;
    if (!isControlled) setInternalChecked(next);
    onChange?.(next);
  };
 
  const sizeClass = size === "sm" ? "toggle--sm" : size === "lg" ? "toggle--lg" : "";
 
  return (
    <label className={`toggle ${sizeClass}`}>
      <input
        type="checkbox"
        className="toggle-input"
        role="switch"
        aria-checked={isOn}
        aria-label={label}
        checked={isOn}
        disabled={disabled}
        onChange={handleChange}
      />
      <span className="toggle-track" />
    </label>
  );
};
 
export default Toggle;