import * as React from "react";
import { Input } from "./input";

export interface NumericInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  allowDecimals?: boolean;
}

export const NumericInput = React.forwardRef<HTMLInputElement, NumericInputProps>(
  ({ value, onChange, allowDecimals = true, onBlur, ...props }, ref) => {
    const [localValue, setLocalValue] = React.useState<string>(
      value !== undefined ? String(value) : ""
    );

    // Sync external value to local if it changes and isn't currently being edited
    React.useEffect(() => {
      if (value !== undefined && String(value) !== localValue && parseFloat(localValue) !== value) {
        setLocalValue(String(value));
      } else if (value === undefined && localValue !== "") {
        setLocalValue("");
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = e.target.value;
      // Allow comma as decimal separator
      val = val.replace(',', '.');
      
      // Basic validation for numbers
      if (val !== "" && val !== "." && val !== "-") {
        if (!allowDecimals && val.includes(".")) {
          return; // Block decimals if not allowed
        }
        if (isNaN(Number(val))) {
          return; // Block invalid characters
        }
      }
      
      setLocalValue(e.target.value);
      
      // We pass the parsed value to the parent immediately if it's a valid number
      if (val === "" || val === "-" || val.endsWith(".")) {
        // Parent doesn't get updated until blur or valid number typed
      } else {
        onChange(parseFloat(val));
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      let val = localValue.replace(',', '.');
      if (val === "" || val === "-" || val === ".") {
        onChange(undefined);
        setLocalValue("");
      } else {
        const num = parseFloat(val);
        if (!isNaN(num)) {
          onChange(num);
          setLocalValue(String(num));
        }
      }
      if (onBlur) onBlur(e);
    };

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        inputMode={allowDecimals ? "decimal" : "numeric"}
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
      />
    );
  }
);

NumericInput.displayName = "NumericInput";
