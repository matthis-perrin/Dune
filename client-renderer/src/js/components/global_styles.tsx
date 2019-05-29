import {createGlobalStyle} from 'styled-components';
import {theme} from '@root/theme/default';

export const GlobalStyle = createGlobalStyle`
    html,
    body {
        padding: 0;
        margin: 0;
        height: 100%;
        font-family: ${theme.typography.base.fontFamily};
    }

    #root {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
    }
`;
