import React from 'react';
import { useNetInfo } from '@react-native-community/netinfo';
import { THEME_COLOR } from 'CONSTANTS';
import styled from 'styled-components/native';
import CloudSlash from 'assets/cloud-slash.svg';
import { Text } from 'react-native';

const Well = styled.View`
    border-radius: 8px;
    background-color: ${THEME_COLOR}22;
    flex: 1;
    flex-direction: row;
    align-items: center;
    padding: 12px;
    margin: 12px 0;
`;

function ConnectionNotice() {
    const { isInternetReachable } = useNetInfo();

    if (!isInternetReachable) {
        return (
            <Well>
                <CloudSlash width={24} height={24} fill={THEME_COLOR} />
                <Text style={{ color: THEME_COLOR, marginLeft: 12 }}>You are currently offline. You can only play previously downloaded music.</Text>
            </Well>
        );
    }

    return null;
}

export default ConnectionNotice;
