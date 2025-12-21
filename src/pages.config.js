import Vault from './pages/Vault';
import Succession from './pages/Succession';
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import Maintenance from './pages/Maintenance';
import Contacts from './pages/Contacts';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Vault": Vault,
    "Succession": Succession,
    "Dashboard": Dashboard,
    "Properties": Properties,
    "Maintenance": Maintenance,
    "Contacts": Contacts,
}

export const pagesConfig = {
    mainPage: "Vault",
    Pages: PAGES,
    Layout: __Layout,
};