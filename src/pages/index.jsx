import Layout from "./Layout.jsx";

import AccountSettings from "./AccountSettings";

import ArtCollectibles from "./ArtCollectibles";

import AuditLog from "./AuditLog";

import AutomatedPayments from "./AutomatedPayments";

import Automations from "./Automations";

import BillPayments from "./BillPayments";

import Budget from "./Budget";

import BusinessClients from "./BusinessClients";

import BusinessContracts from "./BusinessContracts";

import BusinessExpenses from "./BusinessExpenses";

import BusinessHub from "./BusinessHub";

import BusinessInvoices from "./BusinessInvoices";

import BusinessProjects from "./BusinessProjects";

import BusinessReports from "./BusinessReports";

import Calendar from "./Calendar";

import CaregiverCoordination from "./CaregiverCoordination";

import CharitableGiving from "./CharitableGiving";

import ClientDashboard from "./ClientDashboard";

import Collaboration from "./Collaboration";

import CommunicationsHub from "./CommunicationsHub";

import ConciergeService from "./ConciergeService";

import Contacts from "./Contacts";

import Dashboard from "./Dashboard";

import DigitalMemorial from "./DigitalMemorial";

import DoctorAppointments from "./DoctorAppointments";

import EducationFunds from "./EducationFunds";

import EmailAssistant from "./EmailAssistant";

import EmergencyResponse from "./EmergencyResponse";

import EstatePlanning from "./EstatePlanning";

import FAQ from "./FAQ";

import FamilyManagement from "./FamilyManagement";

import FamilyNotifications from "./FamilyNotifications";

import FamilyRoleManagement from "./FamilyRoleManagement";

import FamilyToDo from "./FamilyToDo";

import FamilyTree from "./FamilyTree";

import FamilyWorkflows from "./FamilyWorkflows";

import FinancialDashboard from "./FinancialDashboard";

import FinancialForecasting from "./FinancialForecasting";

import FinancialHealth from "./FinancialHealth";

import FinancialLiteracy from "./FinancialLiteracy";

import FinancialProfile from "./FinancialProfile";

import Health from "./Health";

import Home from "./Home";

import HomeInventory from "./HomeInventory";

import HomeServices from "./HomeServices";

import Integrations from "./Integrations";

import InternationalAssets from "./InternationalAssets";

import Investments from "./Investments";

import LegacyMessages from "./LegacyMessages";

import Legal from "./Legal";

import Maintenance from "./Maintenance";

import MedicalProfile from "./MedicalProfile";

import MedicareNavigator from "./MedicareNavigator";

import NotificationSettings from "./NotificationSettings";

import Pricing from "./Pricing";

import Privacy from "./Privacy";

import ProfessionalMarketplace from "./ProfessionalMarketplace";

import Properties from "./Properties";

import PropertyManagement from "./PropertyManagement";

import Reports from "./Reports";

import RoleManagement from "./RoleManagement";

import SecurityAudit from "./SecurityAudit";

import Subscriptions from "./Subscriptions";

import Succession from "./Succession";

import TaxExport from "./TaxExport";

import TenantPortal from "./TenantPortal";

import Terms from "./Terms";

import Travel from "./Travel";

import TrustManagement from "./TrustManagement";

import Valuables from "./Valuables";

import Vault from "./Vault";

import Vehicles from "./Vehicles";

import VideoCallScheduler from "./VideoCallScheduler";

import VideoTutorials from "./VideoTutorials";

import VoiceAssistant from "./VoiceAssistant";

import WealthLegacyPlanning from "./WealthLegacyPlanning";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    AccountSettings: AccountSettings,
    
    ArtCollectibles: ArtCollectibles,
    
    AuditLog: AuditLog,
    
    AutomatedPayments: AutomatedPayments,
    
    Automations: Automations,
    
    BillPayments: BillPayments,
    
    Budget: Budget,
    
    BusinessClients: BusinessClients,
    
    BusinessContracts: BusinessContracts,
    
    BusinessExpenses: BusinessExpenses,
    
    BusinessHub: BusinessHub,
    
    BusinessInvoices: BusinessInvoices,
    
    BusinessProjects: BusinessProjects,
    
    BusinessReports: BusinessReports,
    
    Calendar: Calendar,
    
    CaregiverCoordination: CaregiverCoordination,
    
    CharitableGiving: CharitableGiving,
    
    ClientDashboard: ClientDashboard,
    
    Collaboration: Collaboration,
    
    CommunicationsHub: CommunicationsHub,
    
    ConciergeService: ConciergeService,
    
    Contacts: Contacts,
    
    Dashboard: Dashboard,
    
    DigitalMemorial: DigitalMemorial,
    
    DoctorAppointments: DoctorAppointments,
    
    EducationFunds: EducationFunds,
    
    EmailAssistant: EmailAssistant,
    
    EmergencyResponse: EmergencyResponse,
    
    EstatePlanning: EstatePlanning,
    
    FAQ: FAQ,
    
    FamilyManagement: FamilyManagement,
    
    FamilyNotifications: FamilyNotifications,
    
    FamilyRoleManagement: FamilyRoleManagement,
    
    FamilyToDo: FamilyToDo,
    
    FamilyTree: FamilyTree,
    
    FamilyWorkflows: FamilyWorkflows,
    
    FinancialDashboard: FinancialDashboard,
    
    FinancialForecasting: FinancialForecasting,
    
    FinancialHealth: FinancialHealth,
    
    FinancialLiteracy: FinancialLiteracy,
    
    FinancialProfile: FinancialProfile,
    
    Health: Health,
    
    Home: Home,
    
    HomeInventory: HomeInventory,
    
    HomeServices: HomeServices,
    
    Integrations: Integrations,
    
    InternationalAssets: InternationalAssets,
    
    Investments: Investments,
    
    LegacyMessages: LegacyMessages,
    
    Legal: Legal,
    
    Maintenance: Maintenance,
    
    MedicalProfile: MedicalProfile,
    
    MedicareNavigator: MedicareNavigator,
    
    NotificationSettings: NotificationSettings,
    
    Pricing: Pricing,
    
    Privacy: Privacy,
    
    ProfessionalMarketplace: ProfessionalMarketplace,
    
    Properties: Properties,
    
    PropertyManagement: PropertyManagement,
    
    Reports: Reports,
    
    RoleManagement: RoleManagement,
    
    SecurityAudit: SecurityAudit,
    
    Subscriptions: Subscriptions,
    
    Succession: Succession,
    
    TaxExport: TaxExport,
    
    TenantPortal: TenantPortal,
    
    Terms: Terms,
    
    Travel: Travel,
    
    TrustManagement: TrustManagement,
    
    Valuables: Valuables,
    
    Vault: Vault,
    
    Vehicles: Vehicles,
    
    VideoCallScheduler: VideoCallScheduler,
    
    VideoTutorials: VideoTutorials,
    
    VoiceAssistant: VoiceAssistant,
    
    WealthLegacyPlanning: WealthLegacyPlanning,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<AccountSettings />} />
                
                
                <Route path="/AccountSettings" element={<AccountSettings />} />
                
                <Route path="/ArtCollectibles" element={<ArtCollectibles />} />
                
                <Route path="/AuditLog" element={<AuditLog />} />
                
                <Route path="/AutomatedPayments" element={<AutomatedPayments />} />
                
                <Route path="/Automations" element={<Automations />} />
                
                <Route path="/BillPayments" element={<BillPayments />} />
                
                <Route path="/Budget" element={<Budget />} />
                
                <Route path="/BusinessClients" element={<BusinessClients />} />
                
                <Route path="/BusinessContracts" element={<BusinessContracts />} />
                
                <Route path="/BusinessExpenses" element={<BusinessExpenses />} />
                
                <Route path="/BusinessHub" element={<BusinessHub />} />
                
                <Route path="/BusinessInvoices" element={<BusinessInvoices />} />
                
                <Route path="/BusinessProjects" element={<BusinessProjects />} />
                
                <Route path="/BusinessReports" element={<BusinessReports />} />
                
                <Route path="/Calendar" element={<Calendar />} />
                
                <Route path="/CaregiverCoordination" element={<CaregiverCoordination />} />
                
                <Route path="/CharitableGiving" element={<CharitableGiving />} />
                
                <Route path="/ClientDashboard" element={<ClientDashboard />} />
                
                <Route path="/Collaboration" element={<Collaboration />} />
                
                <Route path="/CommunicationsHub" element={<CommunicationsHub />} />
                
                <Route path="/ConciergeService" element={<ConciergeService />} />
                
                <Route path="/Contacts" element={<Contacts />} />
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/DigitalMemorial" element={<DigitalMemorial />} />
                
                <Route path="/DoctorAppointments" element={<DoctorAppointments />} />
                
                <Route path="/EducationFunds" element={<EducationFunds />} />
                
                <Route path="/EmailAssistant" element={<EmailAssistant />} />
                
                <Route path="/EmergencyResponse" element={<EmergencyResponse />} />
                
                <Route path="/EstatePlanning" element={<EstatePlanning />} />
                
                <Route path="/FAQ" element={<FAQ />} />
                
                <Route path="/FamilyManagement" element={<FamilyManagement />} />
                
                <Route path="/FamilyNotifications" element={<FamilyNotifications />} />
                
                <Route path="/FamilyRoleManagement" element={<FamilyRoleManagement />} />
                
                <Route path="/FamilyToDo" element={<FamilyToDo />} />
                
                <Route path="/FamilyTree" element={<FamilyTree />} />
                
                <Route path="/FamilyWorkflows" element={<FamilyWorkflows />} />
                
                <Route path="/FinancialDashboard" element={<FinancialDashboard />} />
                
                <Route path="/FinancialForecasting" element={<FinancialForecasting />} />
                
                <Route path="/FinancialHealth" element={<FinancialHealth />} />
                
                <Route path="/FinancialLiteracy" element={<FinancialLiteracy />} />
                
                <Route path="/FinancialProfile" element={<FinancialProfile />} />
                
                <Route path="/Health" element={<Health />} />
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/HomeInventory" element={<HomeInventory />} />
                
                <Route path="/HomeServices" element={<HomeServices />} />
                
                <Route path="/Integrations" element={<Integrations />} />
                
                <Route path="/InternationalAssets" element={<InternationalAssets />} />
                
                <Route path="/Investments" element={<Investments />} />
                
                <Route path="/LegacyMessages" element={<LegacyMessages />} />
                
                <Route path="/Legal" element={<Legal />} />
                
                <Route path="/Maintenance" element={<Maintenance />} />
                
                <Route path="/MedicalProfile" element={<MedicalProfile />} />
                
                <Route path="/MedicareNavigator" element={<MedicareNavigator />} />
                
                <Route path="/NotificationSettings" element={<NotificationSettings />} />
                
                <Route path="/Pricing" element={<Pricing />} />
                
                <Route path="/Privacy" element={<Privacy />} />
                
                <Route path="/ProfessionalMarketplace" element={<ProfessionalMarketplace />} />
                
                <Route path="/Properties" element={<Properties />} />
                
                <Route path="/PropertyManagement" element={<PropertyManagement />} />
                
                <Route path="/Reports" element={<Reports />} />
                
                <Route path="/RoleManagement" element={<RoleManagement />} />
                
                <Route path="/SecurityAudit" element={<SecurityAudit />} />
                
                <Route path="/Subscriptions" element={<Subscriptions />} />
                
                <Route path="/Succession" element={<Succession />} />
                
                <Route path="/TaxExport" element={<TaxExport />} />
                
                <Route path="/TenantPortal" element={<TenantPortal />} />
                
                <Route path="/Terms" element={<Terms />} />
                
                <Route path="/Travel" element={<Travel />} />
                
                <Route path="/TrustManagement" element={<TrustManagement />} />
                
                <Route path="/Valuables" element={<Valuables />} />
                
                <Route path="/Vault" element={<Vault />} />
                
                <Route path="/Vehicles" element={<Vehicles />} />
                
                <Route path="/VideoCallScheduler" element={<VideoCallScheduler />} />
                
                <Route path="/VideoTutorials" element={<VideoTutorials />} />
                
                <Route path="/VoiceAssistant" element={<VoiceAssistant />} />
                
                <Route path="/WealthLegacyPlanning" element={<WealthLegacyPlanning />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}