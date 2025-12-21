import Vault from './pages/Vault';
import Succession from './pages/Succession';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Vault": Vault,
    "Succession": Succession,
}

export const pagesConfig = {
    mainPage: "Vault",
    Pages: PAGES,
    Layout: __Layout,
};