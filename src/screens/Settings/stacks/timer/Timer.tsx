import React, { useCallback, useState } from 'react';
import Container from '../../components/Container';
import { Text } from '@/components/Typography';
import { InputContainer } from '../../components/Input';
import { useTimeStyles } from './styles';
import { Switch } from 'react-native-gesture-handler';
import { SwitchContainer, SwitchLabel } from '../../components/Switch';
import Button from '@/components/Button';
import { View } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useTypedSelector } from '@/store';
import { useDispatch } from 'react-redux';
import { setDateTime, setEnableSleepTime } from '@/store/settings/actions';

function Timer() {
    const [show, setShow] = useState<boolean>(false);
    const { dateTime } = useTypedSelector(state => state.settings);
    const [date, setDate] = useState<string>(dateTime === undefined ? 'Set Time' : dateTime.toString());

    const timerStyles = useTimeStyles();
    const { enableSleepTime } = useTypedSelector(state => state.settings);

    const dispatch = useDispatch();

    const handleEnabledSleeper = useCallback((value: boolean) => {
        dispatch(setEnableSleepTime(value));
    }, [dispatch]);
    
    const handleConfirm = (date: Date) => {
        setShow(false);
        setDate(date.toString());
        dispatch(setDateTime(date));
    };

    const showDateTimePicker = () => {
        setShow(!show);
    };

    const handleCancelDatePicker = () => {
        setShow(false);
    };
    
    return (
        <Container>
            <InputContainer>
                <Text>{'Set Sleep Time.'}</Text>
                <SwitchContainer style={timerStyles.checkbox}>
                    <Switch
                        value={enableSleepTime}
                        onValueChange={(value) => handleEnabledSleeper(value)}
                    />
                    <SwitchLabel>{'Enable Timer'}</SwitchLabel>
                </SwitchContainer>
                <View style={enableSleepTime ? timerStyles.timerSetting : timerStyles.timerSettingsDisabled}>
                    <View style={timerStyles.timeInput}>
                        <Text>{'Set Time'}</Text>
                        <Button
                            title={date}
                            onPress={showDateTimePicker}
                        />
                    </View>
                    <Text>{'Set this to automatically stop the audio when time runs out.'}</Text>
                </View>
                <DateTimePickerModal
                    isVisible={show}
                    mode='datetime'
                    is24Hour={true}
                    onConfirm={handleConfirm}
                    onCancel={handleCancelDatePicker}
                />
            </InputContainer>
        </Container>
    );
}

export default Timer;