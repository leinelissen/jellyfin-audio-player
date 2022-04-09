import styled from 'styled-components/native';
import Button from './Button';

export const WrappableButtonRow = styled.View`
    flex: 0 0 auto;
    flex-direction: row;
    flex-wrap: wrap;
    margin: 24px -2px;
`;

export const WrappableButton = styled(Button)`
    margin: 2px;
`;