import React, { useCallback, useEffect, useState } from 'react';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import styled from 'styled-components/native';
import { useDispatch } from 'react-redux';
import { useTypedSelector } from '@/store';
import TimerIcon from '@/assets/icons/timer.svg';
import { setTimerDate } from '@/store/sleep-timer';
import ticksToDuration from '@/utility/ticksToDuration';
import useDefaultStyles from '@/components/Colors';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { t } from '@/localisation';

const Container = styled.View`
    align-self: flex-start;
    align-items: flex-start;
    margin-top: 52px;
    padding: 8px;
    margin-left: -8px;
    flex: 0 1 auto;
    border-radius: 8px;
`;

const View = styled.View`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
`;

const Label = styled.Text`
    font-size: 13px;
`;

export default function Timer() {
    // Keep an incrementing counter to force the component to update when the
    // interval is active.
    const [, setCounter] = useState(0);

    // Show the picker or not
    const [showPicker, setShowPicker] = useState<boolean>(false);
    
    // Retrieve Redux state and methods
    const date = useTypedSelector(state => state.sleepTimer.date);
    const dispatch = useDispatch();
    
    // Retrieve styles
    const defaultStyles = useDefaultStyles();

    // Deal with a date being selected
    const handleConfirm = useCallback((date: Date) => {
        // GUARD: If the date is in the past, we need to add 24 hours to it to
        // ensure it is in the future
        if (date.getTime() < new Date().getTime()) {
            date = new Date(date.getTime() + 24 * 60 * 60 * 1_000);
        }

        // Only accept minutes and hours
        date.setSeconds(0);

        // Set the date and close the picker
        dispatch(setTimerDate(date));
        setShowPicker(false);
    }, [dispatch]);

    // Close the picker when it is canceled
    const handleCancelDatePicker = useCallback(() => {
        setShowPicker(false);
        dispatch(setTimerDate(null));
    }, [dispatch]);

    // Show it when it should be opened
    const showDatePicker = useCallback(() => {
        setShowPicker(!showPicker);
    }, [showPicker]);

    // Periodically trigger updates
    useEffect(() => {
        // GUARD: If there's no date, there's no need to update
        if (!date) {
            return;
        }

        // Set an interval that periodically increments the counter when a date
        // is active
        const interval = setInterval(() => {
            setCounter((i) => i + 1);
        }, 1_000);

        // Clean up the interval on re-renders
        return () => clearInterval(interval);
    }, [date]);

    // Calculate the remaining time by subtracting it from the current date
    const remainingTime = date && date - new Date().getTime();

    return (
        <TouchableOpacity
            onPress={showDatePicker} 
            activeOpacity={0.6}
            style={{ flexGrow: 0 }}
        >
            <Container
                style={{ backgroundColor: showPicker || date
                    ? defaultStyles.activeBackground.backgroundColor 
                    : undefined 
                }}
            >
                <View>
                    <TimerIcon
                        fill={showPicker || date
                            ? defaultStyles.themeColor.color
                            : defaultStyles.textHalfOpacity.color
                        }
                        width={16}
                        height={16}
                    />
                    <Label
                        style={{ color: showPicker || date
                            ? defaultStyles.themeColor.color
                            : defaultStyles.textHalfOpacity.color
                        }}
                    >
                        {!remainingTime
                            ? t('sleep-timer')
                            : ticksToDuration(remainingTime * 10_000)
                        }
                    </Label>
                    <DateTimePickerModal
                        isVisible={showPicker}
                        mode='time'
                        date={new Date()}
                        onConfirm={handleConfirm}
                        onCancel={handleCancelDatePicker}
                    />
                </View>
            </Container>
        </TouchableOpacity>
    );
}