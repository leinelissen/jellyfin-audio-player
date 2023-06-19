import { t } from '@/localisation';
import React from 'react';
import styled from 'styled-components/native';

const Label = styled.Text`
    font-size: 13px;
`;

function Casting() {
    return (
        <Label>{t('local-playback')}</Label>
    );
}

export default Casting;
