import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";

export const openTimePicker = (date: Date, setValue: any) => {
    DateTimePickerAndroid.open({
        value: date,
        mode: 'time',
        is24Hour: false,
        display: 'spinner',
        onChange: (event, selectedTime) => {
            if (event.type === 'dismissed') return;
            if (selectedTime) {
                const finalDate = new Date(date);
                finalDate.setHours(selectedTime.getHours());
                finalDate.setMinutes(selectedTime.getMinutes());
                const hours = finalDate.getHours();
                const minutes = finalDate.getMinutes();
                const ampm = hours >= 12 ? 'PM' : 'AM';
                const h = hours % 12 || 12;
                const formatted =
                    `${String(finalDate.getMonth() + 1).padStart(2, '0')}/` +
                    `${String(finalDate.getDate()).padStart(2, '0')}/` +
                    `${finalDate.getFullYear()} ` +
                    `${String(h).padStart(2, '0')}:` +
                    `${String(minutes).padStart(2, '0')} ${ampm}`;
                setValue('date', formatted);
            }
        },
    });
};