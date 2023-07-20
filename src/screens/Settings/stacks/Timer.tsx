import React, { useCallback, useState } from 'react';
import Container from '../components/Container';
import { Text } from '@/components/Typography';
import { InputContainer } from '../components/Input';
import Input from '@/components/Input';
import useDefaultStyles from '@/components/Colors';
import { setSleepTime } from '@/store/settings/actions';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';

function Timer() {
    const defaultStyles = useDefaultStyles();

    const navigation = useNavigation();
    const dispatch = useDispatch();

    const setSleeper = useCallback((sleepTime) => {
        dispatch(setSleepTime(Number.parseInt(sleepTime)));
    }, [navigation, dispatch]);

    return (
        <Container>
            <InputContainer>
                <Text>Set Sleep Timer (min)</Text>
                <Input
                    placeholder='60'
                    editable={true}
                    style={defaultStyles.input}
                    onChangeText={setSleeper}/>

                <Text>Set this to automatically stop the audio when time runs out.</Text>
            </InputContainer>
        </Container>
    );
}

export default Timer;