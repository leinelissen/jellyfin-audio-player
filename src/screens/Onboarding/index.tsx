import React, { useCallback, useEffect } from 'react';
import styled from 'styled-components/native';
import { THEME_COLOR } from 'CONSTANTS';
import { Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from 'screens';
import { useTypedSelector } from 'store';
import { useDispatch } from 'react-redux';
import { setOnboardingStatus } from 'store/settings/actions';

const Container = styled.SafeAreaView`
    background-color: ${THEME_COLOR};
    flex: 1;
    justify-content: center;
`;

const TextContainer = styled.ScrollView`
    padding: 25px;
`;

const Text = styled.Text`
    text-align: center;
    color: white;
    margin-bottom: 10px;
`;

const ButtonContainer = styled.View`
    margin-top: 50px;
`; 

const Logo = styled.Image`
    width: 150px;
    height: 150px;
    margin: 0 auto 50px auto;
`;

function Onboarding() {
    // Get account from Redux and dispatcher
    const account = useTypedSelector(state => state.settings.jellyfin);
    const dispatch = useDispatch();

    // Also retrieve the navigation handler so that we can open the modal in
    // which the Jellyfin server is set
    const navigation = useNavigation<NavigationProp>();
    const handleClick = useCallback(() => navigation.navigate('SetJellyfinServer'), [navigation]);
    
    // We'll also respond to any change in the account, setting the onboarding
    // status to true, so that the app becomes available.
    useEffect(() => {
        if (account) {
            dispatch(setOnboardingStatus(true));
        }
    }, [account, dispatch]);
    
    return (
        <Container>
            <TextContainer contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
                <Logo source={require('../../assets/app-icon-white.png')} />
                <Text >
                    Welcome!
                </Text>
                <Text>
                    Jellyfin Audio Player will allow you to stream your music library from anywhere, with full support for background audio and casting. 
                </Text>
                <Text>
                    In order to get started, you need a Jellyfin server. Click the button below to enter your Jellyfin server address and login to it.
                </Text>
                <ButtonContainer>
                    <Button title="Set Jellyfin Server" color="#ffffff" onPress={handleClick} />
                </ButtonContainer>
            </TextContainer>
        </Container>
    );
}

export default Onboarding;