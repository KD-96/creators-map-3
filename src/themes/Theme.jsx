import { createTheme } from "@mui/material/styles";

const Theme = createTheme({
    palette: {
        primary: {
            main: "#383838",
            light: "#e1e1e1",
            dark: "#181818",
        },
        secondary: {
            main: "#00bfff",
            light: "#a8e9ff",
            dark: "#004a63",
        },
        background: {
            main: '#ffffff',
            light: '#838383',
            dark: '#000000',
        },
    },
});

export default Theme;
