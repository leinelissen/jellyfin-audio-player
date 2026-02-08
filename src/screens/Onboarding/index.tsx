import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components/native';
import { useNavigation } from '@react-navigation/native';
import { ActivityIndicator } from 'react-native';
import { NavigationProp } from '@/screens';
import { useAppDispatch, useTypedSelector } from '@/store';
import { setOnboardingStatus } from '@/store/settings/actions';
import { t } from '@/localisation';
import Button from '@/components/Button';
import { Header, Text as BaseText } from '@/components/Typography';
import { ShadowWrapper } from '@/components/Shadow';
import { SafeAreaView } from 'react-native-safe-area-context';
import { syncAll } from '@/store/sources/jellyfin/sync';

const Container = styled(SafeAreaView)`
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

const SkipButton = styled.Pressable`
    margin-top: 16px;
    padding: 12px;
    align-items: center;
`;

const SyncContainer = styled.View`
    align-items: center;
    margin-top: 24px;
`;

const SyncText = styled(BaseText)`
    text-align: center;
    margin-top: 16px;
    opacity: 0.7;
`;

const ErrorText = styled(BaseText)`
    color: #d32f2f;
    text-align: center;
    margin-bottom: 16px;
`;

const ErrorDetailText = styled(BaseText)`
    text-align: center;
    opacity: 0.7;
    font-size: 12px;
    margin-bottom: 16px;
`;

const CenteredText = styled(BaseText)`
    text-align: center;
`;

const CenteredHeader = styled(Header)`
    text-align: center;
    margin-bottom: 24px;
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

    // State for sync flow
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncError, setSyncError] = useState<string | null>(null);
    const [showSyncPrompt, setShowSyncPrompt] = useState(false);

    // Also retrieve the navigation handler so that we can open the modal in
    // which the Jellyfin server is set
    const navigation = useNavigation<NavigationProp>();
    const handleClick = useCallback(() => navigation.navigate('SetJellyfinServer'), [navigation]);
    
    // Handle initial sync
    const handleSync = useCallback(async () => {
        if (!account?.user_id) return;
        
        setIsSyncing(true);
        setSyncError(null);
        
        try {
            await syncAll(account.user_id);
            // Sync successful, complete onboarding
            dispatch(setOnboardingStatus(true));
        } catch (error) {
            console.error('[Onboarding] Sync failed:', error);
            setSyncError(error instanceof Error ? error.message : 'Sync failed');
            setIsSyncing(false);
        }
    }, [account?.user_id, dispatch]);

    // Skip sync and complete onboarding
    const handleSkipSync = useCallback(() => {
        dispatch(setOnboardingStatus(true));
    }, [dispatch]);
    
    // When account is set, show sync prompt
    useEffect(() => {
        if (account && !showSyncPrompt) {
            setShowSyncPrompt(true);
        }
    }, [account, showSyncPrompt]);
    
    // Render sync step
    if (showSyncPrompt) {
        return (
            <Container>
                <TextContainer contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
                    <ShadowWrapper size="medium">
                        <Logo source={require('../../assets/icons/app-icon.png')} />
                    </ShadowWrapper>
                    <CenteredHeader>
                        {isSyncing ? t('onboarding-sync-title') : t('onboarding-sync-prompt')}
                    </CenteredHeader>
                    
                    {isSyncing ? (
                        <SyncContainer>
                            <ActivityIndicator size="large" />
                            <SyncText>{t('onboarding-sync-progress')}</SyncText>
                        </SyncContainer>
                    ) : syncError ? (
                        <>
                            <ErrorText>
                                {t('onboarding-sync-error')}
                            </ErrorText>
                            <ErrorDetailText>
                                {syncError}
                            </ErrorDetailText>
                            <ButtonContainer>
                                <Button
                                    title={t('onboarding-sync-retry')}
                                    onPress={handleSync}
                                />
                                <SkipButton onPress={handleSkipSync}>
                                    <Text>{t('onboarding-sync-skip')}</Text>
                                </SkipButton>
                            </ButtonContainer>
                        </>
                    ) : (
                        <>
                            <CenteredText>
                                {t('onboarding-sync-description')}
                            </CenteredText>
                            <ButtonContainer>
                                <Button
                                    title={t('onboarding-sync-start')}
                                    onPress={handleSync}
                                />
                                <SkipButton onPress={handleSkipSync}>
                                    <Text>{t('onboarding-sync-skip')}</Text>
                                </SkipButton>
                            </ButtonContainer>
                        </>
                    )}
                </TextContainer>
            </Container>
        );
    }
    
    return (
        <Container>
            <TextContainer contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
                <ShadowWrapper size="medium">
                    <Logo source={require('../../assets/icons/app-icon.png')} />
                </ShadowWrapper>
                <CenteredHeader>
                    {t('onboarding-welcome')}
                </CenteredHeader>
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