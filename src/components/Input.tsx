import styled, { css } from 'styled-components/native';

const Input = styled.TextInput<{ icon?: boolean }>`
    margin: 10px 0;
    border-radius: 8px;
    padding: 15px;

    ${(props) => props.icon && css`
        padding-left: 40px;
    `}
`;

export default Input;