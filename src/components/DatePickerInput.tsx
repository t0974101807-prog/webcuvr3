import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DatePickerInput = ({ value, onChange, className, placeholder, disabled }: any) => {
  const dateValue = value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(value) : null;
  return (
    <div className="relative w-full">
      <DatePicker
        selected={dateValue}
        onChange={(date: Date | null) => {
            if (date) {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                onChange(`${year}-${month}-${day}`);
            } else {
                onChange('');
            }
        }}
        dateFormat="dd/MM/yyyy"
        placeholderText={placeholder || "dd/MM/yyyy"}
        className={cn(className, "w-full pr-10", disabled ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "")}
        disabled={disabled}
      />
      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
    </div>
  );
};

export default DatePickerInput;
