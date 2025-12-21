import Vault from './pages/Vault';
import Succession from './pages/Succession';
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import Maintenance from './pages/Maintenance';
import Contacts from './pages/Contacts';
import Vehicles from './pages/Vehicles';
import Subscriptions from './pages/Subscriptions';
import Valuables from './pages/Valuables';
import Travel from './pages/Travel';
import Health from './pages/Health';
import Calendar from './pages/Calendar';
import Legal from './pages/Legal';
import MedicalProfile from './pages/MedicalProfile';
import Collaboration from './pages/Collaboration';
import Reports from './pages/Reports';
import NotificationSettings from './pages/NotificationSettings';
import Automations from './pages/Automations';
import Integrations from './pages/Integrations';
import Budget from './pages/Budget';
import Pricing from './pages/Pricing';
import BillPayments from './pages/BillPayments';
import Investments from './pages/Investments';
import EmailAssistant from './pages/EmailAssistant';
import PropertyManagement from './pages/PropertyManagement';
import FinancialDashboard from './pages/FinancialDashboard';
import RoleManagement from './pages/RoleManagement';
import TenantPortal from './pages/TenantPortal';
import FamilyManagement from './pages/FamilyManagement';
import FamilyNotifications from './pages/FamilyNotifications';
import FamilyRoleManagement from './pages/FamilyRoleManagement';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Vault": Vault,
    "Succession": Succession,
    "Dashboard": Dashboard,
    "Properties": Properties,
    "Maintenance": Maintenance,
    "Contacts": Contacts,
    "Vehicles": Vehicles,
    "Subscriptions": Subscriptions,
    "Valuables": Valuables,
    "Travel": Travel,
    "Health": Health,
    "Calendar": Calendar,
    "Legal": Legal,
    "MedicalProfile": MedicalProfile,
    "Collaboration": Collaboration,
    "Reports": Reports,
    "NotificationSettings": NotificationSettings,
    "Automations": Automations,
    "Integrations": Integrations,
    "Budget": Budget,
    "Pricing": Pricing,
    "BillPayments": BillPayments,
    "Investments": Investments,
    "EmailAssistant": EmailAssistant,
    "PropertyManagement": PropertyManagement,
    "FinancialDashboard": FinancialDashboard,
    "RoleManagement": RoleManagement,
    "TenantPortal": TenantPortal,
    "FamilyManagement": FamilyManagement,
    "FamilyNotifications": FamilyNotifications,
    "FamilyRoleManagement": FamilyRoleManagement,
}

export const pagesConfig = {
    mainPage: "Vault",
    Pages: PAGES,
    Layout: __Layout,
};