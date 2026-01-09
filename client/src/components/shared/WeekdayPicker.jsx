import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './WeekdayPicker.css';

const WEEKDAYS = [
  { value: 0, labelEn: 'Sun', labelBn: 'রবি', fullEn: 'Sunday', fullBn: 'রবিবার' },
  { value: 1, labelEn: 'Mon', labelBn: 'সোম', fullEn: 'Monday', fullBn: 'সোমবার' },
  { value: 2, labelEn: 'Tue', labelBn: 'মঙ্গল', fullEn: 'Tuesday', fullBn: 'মঙ্গলবার' },
  { value: 3, labelEn: 'Wed', labelBn: 'বুধ', fullEn: 'Wednesday', fullBn: 'বুধবার' },
  { value: 4, labelEn: 'Thu', labelBn: 'বৃহঃ', fullEn: 'Thursday', fullBn: 'বৃহস্পতিবার' },
  { value: 5, labelEn: 'Fri', labelBn: 'শুক্র', fullEn: 'Friday', fullBn: 'শুক্রবার' },
  { value: 6, labelEn: 'Sat', labelBn: 'শনি', fullEn: 'Saturday', fullBn: 'শনিবার' },
];

export default function WeekdayPicker({ value = [], onChange, language = 'en', disabled = false }) {
  const [selectedDays, setSelectedDays] = useState(value);

  useEffect(() => {
    setSelectedDays(value);
  }, [value]);

  const toggleDay = (dayValue) => {
    if (disabled) return;

    const newSelection = selectedDays.includes(dayValue)
      ? selectedDays.filter(d => d !== dayValue)
      : [...selectedDays, dayValue].sort((a, b) => a - b);

    setSelectedDays(newSelection);
    onChange(newSelection);
  };

  const selectAll = () => {
    if (disabled) return;
    const allDays = WEEKDAYS.map(d => d.value);
    setSelectedDays(allDays);
    onChange(allDays);
  };

  const deselectAll = () => {
    if (disabled) return;
    setSelectedDays([]);
    onChange([]);
  };

  return (
    <div className="weekday-picker">
      <div className="weekday-picker-header">
        <button
          type="button"
          className="btn-link"
          onClick={selectAll}
          disabled={disabled}
        >
          {language === 'bn' ? 'সব নির্বাচন করুন' : 'Select All'}
        </button>
        <button
          type="button"
          className="btn-link"
          onClick={deselectAll}
          disabled={disabled}
        >
          {language === 'bn' ? 'সব মুছুন' : 'Deselect All'}
        </button>
      </div>

      <div className="weekday-buttons">
        {WEEKDAYS.map((day) => (
          <button
            key={day.value}
            type="button"
            className={`weekday-btn ${selectedDays.includes(day.value) ? 'weekday-btn-selected' : ''}`}
            onClick={() => toggleDay(day.value)}
            disabled={disabled}
            title={language === 'bn' ? day.fullBn : day.fullEn}
          >
            {language === 'bn' ? day.labelBn : day.labelEn}
          </button>
        ))}
      </div>
    </div>
  );
}

WeekdayPicker.propTypes = {
  value: PropTypes.arrayOf(PropTypes.number),
  onChange: PropTypes.func.isRequired,
  language: PropTypes.oneOf(['en', 'bn']),
  disabled: PropTypes.bool,
};
