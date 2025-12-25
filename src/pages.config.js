import Automations from './pages/Automations';
import BillPayments from './pages/BillPayments';
import Budget from './pages/Budget';
import Calendar from './pages/Calendar';
import Collaboration from './pages/Collaboration';
import Contacts from './pages/Contacts';
import Dashboard from './pages/Dashboard';
import EmailAssistant from './pages/EmailAssistant';
import FamilyManagement from './pages/FamilyManagement';
import FamilyNotifications from './pages/FamilyNotifications';
import FamilyRoleManagement from './pages/FamilyRoleManagement';
import FamilyToDo from './pages/FamilyToDo';
import FamilyWorkflows from './pages/FamilyWorkflows';
import FinancialDashboard from './pages/FinancialDashboard';
import Health from './pages/Health';
import Integrations from './pages/Integrations';
import Investments from './pages/Investments';
import Legal from './pages/Legal';
import Maintenance from './pages/Maintenance';
import MedicalProfile from './pages/MedicalProfile';
import NotificationSettings from './pages/NotificationSettings';
import Pricing from './pages/Pricing';
import Privacy from './pages/Privacy';
import Properties from './pages/Properties';
import PropertyManagement from './pages/PropertyManagement';
import Reports from './pages/Reports';
import RoleManagement from './pages/RoleManagement';
import Subscriptions from './pages/Subscriptions';
import Succession from './pages/Succession';
import TenantPortal from './pages/TenantPortal';
import Terms from './pages/Terms';
import Travel from './pages/Travel';
import Valuables from './pages/Valuables';
import Vault from './pages/Vault';
import Vehicles from './pages/Vehicles';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Automations": Automations,
    "BillPayments": BillPayments,
    "Budget": Budget,
    "Calendar": Calendar,
    "Collaboration": Collaboration,
    "Contacts": Contacts,
    "Dashboard": Dashboard,
    "EmailAssistant": EmailAssistant,
    "FamilyManagement": FamilyManagement,
    "FamilyNotifications": FamilyNotifications,
    "FamilyRoleManagement": FamilyRoleManagement,
    "FamilyToDo": FamilyToDo,
    "FamilyWorkflows": FamilyWorkflows,
    "FinancialDashboard": FinancialDashboard,
    "Health": Health,
    "Integrations": Integrations,
    "Investments": Investments,
    "Legal": Legal,
    "Maintenance": Maintenance,
    "MedicalProfile": MedicalProfile,
    "NotificationSettings": NotificationSettings,
    "Pricing": Pricing,
    "Privacy": Privacy,
    "Properties": Properties,
    "PropertyManagement": PropertyManagement,
    "Reports": Reports,
    "RoleManagement": RoleManagement,
    "Subscriptions": Subscriptions,
    "Succession": Succession,
    "TenantPortal": TenantPortal,
    "Terms": Terms,
    "Travel": Travel,
    "Valuables": Valuables,
    "Vault": Vault,
    "Vehicles": Vehicles,
}

export const pagesConfig = {
    mainPage: "Vault",
    Pages: PAGES,
    Layout: __Layout,
};