import React, { useCallback, useEffect, useState } from 'react';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import styled from 'styled-components/native';
import { THEME_COLOR } from '@/CONSTANTS';
import { useDispatch } from 'react-redux';
import { useTypedSelector } from '@/store';
import TimerIcon from '@/assets/icons/timer-icon.svg';
import { Text } from '@/components/Typography';
import { setTimerDate } from '@/store/music/actions';

const Container = styled.View`
    align-items: flex-start;
    margin-top: 60px;
`;

const View = styled.View`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 4px;
`;

export default function Timer() {
    const [showPicker, setShowPicker] = useState<boolean>(false);
    const [remainingTime, setRemainingTime] = useState<String|null>();
    const { timerDate } = useTypedSelector(state => state.music);

    const dispatch = useDispatch();

    const handleConfirm = useCallback((date: Date) => {
        date.setSeconds(0);
        dispatch(setTimerDate(date));
        setShowPicker(false);
    }, [dispatch]);

    const handleCancelDatePicker = useCallback(() => {
        setShowPicker(false);
    }, []);

    const showDatePicker = useCallback(() => {
        setShowPicker(!showPicker);
    }, [showPicker]);

    useEffect(() => {
        if (!timerDate) {
            setRemainingTime(null);
            return;
        }

        const interval = setInterval(() => {
            const dateSet = timerDate ? timerDate : new Date();
            const millisecondsDiff = dateSet.valueOf() - new Date().valueOf();
            let sec = Math.floor(millisecondsDiff / 1000);
            let min = Math.floor(sec/60);
            sec = sec%60;
            const hours = Math.floor(min/60);
            min = min%60;
            const ticks = `${hours.toString().length === 1 ? '0' + hours : hours}:${min.toString().length === 1 ? '0' + min : min}:${sec.toString().length === 1 ? '0' + sec : sec}`;
            setRemainingTime(ticks);
        }, 1000);

        return () => clearInterval(interval);
    }, [setRemainingTime, timerDate]);

    return (
        <Container>
            <View>
                <TimerIcon fill={showPicker || timerDate ? THEME_COLOR : undefined} />
                <Text
                    style={showPicker || timerDate ? {color: THEME_COLOR} : {}}
                    onPress={showDatePicker}
                >{!timerDate ? 'Sleep Timer' : remainingTime}</Text>
                <DateTimePickerModal
                    isVisible={showPicker}
                    mode='time'
                    onConfirm={handleConfirm}
                    onCancel={handleCancelDatePicker}
                />
            </View>
        </Container>
    );
}