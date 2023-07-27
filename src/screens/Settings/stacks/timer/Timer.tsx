import React, { useCallback, useState } from 'react';
import Container from '../../components/Container';
import { Text } from '@/components/Typography';
import { InputContainer } from '../../components/Input';
import Input from '@/components/Input';
import useDefaultStyles from '@/components/Colors';
import { setEnabledSleeper, setSleepTime } from '@/store/settings/actions';
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
import CheckBox from '@react-native-community/checkbox';
import TrackPlayer from 'react-native-track-player';
import { Switch } from 'react-native-gesture-handler';
import { SwitchContainer, SwitchLabel } from '../../components/Switch';
import { t } from '@/localisation';

function Timer() {
    const { sleepTime } = useTypedSelector(state => state.settings);
    const enabledSleeper = useTypedSelector((state) => state.settings.enabledSleeper);

    const [minutes, setMinutes] = useState<number>();
    const [hours, setHours] = useState<number>();
    const [enableSleeper, setEnableSleeper] = useState<boolean>(enabledSleeper);

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
        let hours = 0;
        let minutes = 0;
        if (!Number.isNaN(sleepTime)) {
            hours = Math.round(sleepTime / 3600);
            const timeRemaining = sleepTime % 3600;

            if (timeRemaining >= 60) {
                minutes = Math.round(timeRemaining / 60);
            }
        }

        return `${hours} hrs ${minutes} min`;
    };

    const handleEnabledSleeper = useCallback((value: boolean) => {
        dispatch(setEnabledSleeper(value));
        setEnableSleeper(value);

        // If value is true sleeper has been enabled, pause then play tack
        // to trigger play state and start sleeper timer
        if (value) {
            TrackPlayer.pause();
            TrackPlayer.play();
        }
    }, [dispatch]);

    return (
        <Container>
            <InputContainer>
                <Text>Set Sleep Timer. Time Set Previously: {getTime()}</Text>
                <SwitchContainer style={timerStyles.checkbox}>
                    <Switch
                        value={enableSleeper}
                        onValueChange={(value) => handleEnabledSleeper(value)}
                    />
                    <SwitchLabel>{t('enable-sleeper')}</SwitchLabel>
                </SwitchContainer>
                <View style={enabledSleeper ? timerStyles.timerSetting : timerStyles.timerSettingsDisabled}>
                    <View style={timerStyles.timer}>
                        <View style={timerStyles.timeInput}>
                            <Text>H:</Text>
                            <Input
                                placeholder='60'
                                editable={enabledSleeper}
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
                                editable={enabledSleeper}
                                style={timerStyles.input}
                                keyboardType='phone-pad'
                                onChangeText={(value: string) => {
                                    setSleeper(parseInt(value), 'Minutes');
                                }}
                            />
                        </View>
                    </View>
                    <Text>Set this to automatically stop the audio when time runs out.</Text>
                </View>
            </InputContainer>
        </Container>
    );
}

export default Timer;