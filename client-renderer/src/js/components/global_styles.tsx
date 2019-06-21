import {createGlobalStyle} from 'styled-components';
import {theme} from '@root/theme';

export const GlobalStyle = createGlobalStyle`
    html,
    body {
        padding: 0;
        margin: 0;
        font-family: ${theme.base.fontFamily};
    }

    .popup-overlay {
        z-index: 1;
        cursor: default;
    }
`;
