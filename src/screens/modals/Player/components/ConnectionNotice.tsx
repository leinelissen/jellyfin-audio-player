import React from 'react';
import { useNetInfo } from '@react-native-community/netinfo';
import styled from 'styled-components/native';
import CloudSlash from '@/assets/icons/cloud-slash.svg';
import { Text } from 'react-native';
import { t } from '@/localisation';
import useDefaultStyles from '@/components/Colors';

const Well = styled.View`
    border-radius: 8px;
    flex: 1;
    flex-direction: row;
    align-items: center;
    padding: 12px;
    margin: 12px -12px;
`;

function ConnectionNotice() {
    const defaultStyles = useDefaultStyles();
    const { isInternetReachable } = useNetInfo();

    if (!isInternetReachable) {
        return (
            <Well style={defaultStyles.activeBackground}>
                <CloudSlash width={24} height={24} fill={defaultStyles.themeColor.color} />
                <Text style={[ defaultStyles.themeColor, { marginLeft: 12 }]}>
                    {t('you-are-offline-message')}
                </Text>
            </Well>
        );
    }

    return null;
}

export default ConnectionNotice;
