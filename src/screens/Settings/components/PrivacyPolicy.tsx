import React from 'react';
import styled from 'styled-components/native';
import { Paragraph } from 'components/Typography';
import { SafeScrollView } from 'components/SafeNavigatorView';
import policy from '../../../../docs/privacy-policy.md';

const Container = styled(SafeScrollView)`
    padding: 24px;
`;

export default function PrivacyPolicy() {
    return (
        <Container>
            <Paragraph>{policy}</Paragraph>
        </Container>
    );
}