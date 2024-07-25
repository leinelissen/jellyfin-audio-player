import React, { useCallback, useEffect } from 'react';
import styled from 'styled-components/native';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '@/screens';
import { useAppDispatch, useTypedSelector } from '@/store';
import { setOnboardingStatus } from '@/store/settings/actions';
import { t } from '@/localisation';
import Button from '@/components/Button';
import { Header, Text as BaseText } from '@/components/Typography';
import { ShadowWrapper } from '@/components/Shadow';

const Container = styled.SafeAreaView`
    flex: 1;
    justify-content: center;
`;

const TextContainer = styled.ScrollView`
    padding: 25px;
`;

const Text = styled(BaseText)`
    text-align: center;
    margin-bottom: 16px;
`;

const ButtonContainer = styled.View`
    margin-top: 50px;
`; 

const Logo = styled.Image`
    width: 150px;
    height: 150px;
    margin: 0 auto 50px auto;
    border-radius: 12px;
    border-width: 1px;
    border-color: #e6e6e6;
`;

function Onboarding() {
    // Get account from Redux and dispatcher
    const account = useTypedSelector(state => state.settings.credentials);
    const dispatch = useAppDispatch();

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
                <ShadowWrapper size="medium">
                    <Logo source={require('../../assets/icons/app-icon.png')} />
                </ShadowWrapper>
                <Header style={{ textAlign: 'center', marginBottom: 24 }}>
                    {t('onboarding-welcome')}
                </Header>
                <Text>
                    {t('onboarding-intro')}
                </Text>
                <Text>
                    {t('onboarding-cta')}
                </Text>
                <ButtonContainer>
                    <Button
                        title={t('set-server')}
                        onPress={handleClick}/>
                </ButtonContainer>
            </TextContainer>
        </Container>
    );
}

export default Onboarding;