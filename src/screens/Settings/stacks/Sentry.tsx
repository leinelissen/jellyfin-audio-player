import { Paragraph, Text } from '@/components/Typography';

import React, { useEffect, useState } from 'react';
import { Switch } from 'react-native-gesture-handler';
import styled, { css } from 'styled-components/native';
import { isSentryEnabled, setSentryStatus } from '@/utility/Sentry';
import Accordion from 'react-native-collapsible/Accordion';
import ChevronIcon from '@/assets/icons/chevron-right.svg';
import useDefaultStyles, { DefaultStylesProvider } from '@/components/Colors';
import { t } from '@/localisation';
import { SafeScrollView } from '@/components/SafeNavigatorView';

const Container = styled.View`
    padding: 24px;
`;

const SwitchContainer = styled.View`
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin: 16px 0;
`;

const HeaderContainer = styled.View<{ isActive?: boolean }>`
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    border-radius: 8px;
    overflow: hidden;
`;

const HeaderText = styled(Text)`
    font-size: 16px;
`;

const ContentContainer = styled.View`
    margin-bottom: 8px;
    padding: 8px 24px;
`;

const Label = styled(Text)`
    font-size: 16px;
`;

const Chevron = styled(ChevronIcon)<{ isActive?: boolean }>`
    width: 14px;
    height: 14px;
    transform: rotate(-90deg);

    ${props => props.isActive && css`
        transform: rotate(90deg);
    `}
`;

type Question = { title: string, content: string };

const questions: Question[] = [
    {
        title: t('why-use-tracking'),
        content: t('why-use-tracking-description')
    },
    {
        title: t('what-data-is-gathered'),
        content: t('what-data-is-gathered-description')
    },
    {
        title: t('where-is-data-stored'),
        content: t('where-is-data-stored-description')
    }
];

function renderHeader(question: Question, index: number, isActive: boolean) {
    return (
        <HeaderContainer>
            <HeaderText>{question.title}</HeaderText>
            <DefaultStylesProvider>
                {styles =>
                    <Chevron fill={styles.text.color} isActive={isActive} />
                }
            </DefaultStylesProvider>
        </HeaderContainer>
    );
}

function renderContent(question: Question) {
    return (
        <ContentContainer>
            <Paragraph>{question.content}</Paragraph>
        </ContentContainer>
    );
}

export default function Sentry() {
    const defaultStyles = useDefaultStyles();
    const [isReportingEnabled, setReporting] = useState(isSentryEnabled);
    const [activeSections, setActiveSections] = useState<number[]>([]);

    const toggleSwitch = () => setReporting(previousState => !previousState);

    useEffect(() => {
        setSentryStatus(isReportingEnabled);
    });

    return (
        <SafeScrollView>
            <Container>
                <Paragraph>{t('error-reporting-description')}</Paragraph>
                <Paragraph />
                <Paragraph>{t('error-reporting-rationale')}</Paragraph>

                <SwitchContainer>
                    <Label>{t('error-reporting')}</Label>
                    <Switch value={isReportingEnabled} onValueChange={toggleSwitch} />
                </SwitchContainer>
            </Container>
            <Accordion
                sections={questions}
                renderHeader={renderHeader}
                renderContent={renderContent}
                activeSections={activeSections}
                onChange={setActiveSections}
                underlayColor={defaultStyles.activeBackground.backgroundColor}
            />
        </SafeScrollView>
    );
}