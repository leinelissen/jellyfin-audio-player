import { useColorScheme } from 'react-native';
import styled from 'styled-components/native';

const Container = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
`;

const Logo = styled.Image`
    width: 64px;
    height: 64px;
    border-radius: 8px;
    border: 1px solid #e6e6e6;
`;

export default function AppLoading() {
    const scheme = useColorScheme();

    return (
        <Container style={{ backgroundColor: scheme === 'dark' ? '#111' : '#fff' }}>
            <Logo source={require('../assets/icons/app-icon.png')} />
        </Container>
    );
}