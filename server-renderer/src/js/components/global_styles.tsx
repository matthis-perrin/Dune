import {createGlobalStyle} from 'styled-components';

export const GlobalStyle = createGlobalStyle`
    html,
    body {
        padding: 0;
        margin: 0;
        height: 100%;
        -webkit-app-region: no-drag;
        background-color: #2C3E50;
    }

    #root {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
    }
`;
