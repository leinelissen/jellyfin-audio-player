import React, { useState } from 'react';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import styled from 'styled-components/native';
import { THEME_COLOR } from '@/CONSTANTS';
import { useDispatch } from 'react-redux';
import { setDateTime } from '@/store/settings/actions';
import { useTypedSelector } from '@/store';
import TimerIcon from '@/assets/icons/timer-icon.svg';

const Container = styled.View`
    align-item: left;
    margin-top: 60px;
`;

const View = styled.View`
    display: flex;
    flex-direction: row;
    gap: 4px;
`;

const Text = styled.Text`
    font-size: 10px;
`;

export default function Timer() {
    const [showPicker, setShowPicker] = useState<boolean>(false);
    const { remainingSleepTime } = useTypedSelector(state => state.settings);

    const dispatch = useDispatch();

    const handleConfirm = (date: Date) => {
        date.setSeconds(0);
        dispatch(setDateTime(date));
        setShowPicker(false);
    };

    const handleCancelDatePicker = () => {
        console.log('Handle cancel implement this event');
    };

    const showDatePicker = () => {
        setShowPicker(true);
    };
    
    return (
        <Container>
            <View>
                <TimerIcon fill={showPicker || remainingSleepTime !== '' ? THEME_COLOR : undefined} />
                <Text
                    style={showPicker || remainingSleepTime !== '' ? {color: THEME_COLOR} : {}}
                    onPress={showDatePicker}
                >{remainingSleepTime === '' ? 'Sleep Timer' : remainingSleepTime}</Text>
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