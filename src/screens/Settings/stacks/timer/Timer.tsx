import React, { useCallback, useState } from 'react';
import Container from '../../components/Container';
import { Text } from '@/components/Typography';
import { InputContainer } from '../../components/Input';
import Input from '@/components/Input';
import useDefaultStyles from '@/components/Colors';
import { setSleepTime } from '@/store/settings/actions';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { ScrollView, ToastAndroid, View } from 'react-native';
import { generateTimerStyles } from './styles';
import { useTypedSelector } from '@/store';
import SelectableFilter from '@/screens/Search/stacks/Search/components/SelectableFilter';
import MicrophoneIcon from '@/assets/icons/microphone.svg';
import AlbumIcon from '@/assets/icons/collection.svg';
import TrackIcon from '@/assets/icons/note.svg';
import SelectDropdown from 'react-native-select-dropdown';
import { time } from 'console';

function Timer() {
    const { sleepTime } = useTypedSelector(state => state.settings);

    const [minutes, setMinutes] = useState<number>();
    const [hours, setHours] = useState<number>();

    const timerStyles = generateTimerStyles();

    const navigation = useNavigation();
    const dispatch = useDispatch();

    const setSleeper = useCallback((value: number, timeType: string) => {
        if (timeType == 'Hours' && value > 0) {
            dispatch(setSleepTime(value * 3600));
        } else if (timeType == 'Minutes' && value > 0) {
            dispatch(setSleepTime(value * 60));
        }
    }, [navigation, dispatch]);

    const getTime = () => {
        if (!Number.isNaN(sleepTime)) {
            const hours = Math.round(sleepTime / 3600);
            const timeRemaining = sleepTime % 3600;
            let minutes = 0;

            if (timeRemaining > 60) {
                minutes = Math.round(timeRemaining / 60);
            }
            return `${hours} hrs ${minutes} min`;
        } else {
            return 0;
        }
    }

    return (
        <Container>
            <InputContainer>
                <Text>Set Sleep Timer. Time Set Previously: {getTime()}</Text>
                <View style={timerStyles.timer}>
                    <View style={timerStyles.timeInput}>
                        <Text>H:</Text>
                        <Input
                            placeholder='60'
                            editable={true}
                            style={timerStyles.input}
                            keyboardType='phone-pad'
                            onChangeText={(value: string) => {
                                setSleeper(parseInt(value), 'Hours');
                            }}
                        />
                    </View>
                    <View style={timerStyles.timeInput}>
                        <Text>M:</Text>
                        <Input
                            placeholder='60'
                            editable={true}
                            style={timerStyles.input}
                            keyboardType='phone-pad'
                            onChangeText={(value: string) => {
                                setSleeper(parseInt(value), 'Minutes');
                            }}
                        />
                    </View>
                </View>
                <Text>Set this to automatically stop the audio when time runs out.</Text>
            </InputContainer>
        </Container>
    );
}

export default Timer;