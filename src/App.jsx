import React, { useMemo, useState } from 'react';
import MainDashboard from './components/dashboard/MainDashboard';
import AdminPanel from './components/admin/AdminPanel';
import LoginScreen from './modules/auth/LoginScreen';
import StegModule from './modules/energy/StegModule';
import AirModule from './modules/air/AirModule';
import SitesDashboard from './modules/sites/SitesDashboard';
import MaintenanceDashboard from './modules/maintenance/MaintenanceDashboard';
import AuditsModule from './modules/audits/AuditsModule';
import ReunionsModule from './modules/reunions/ReunionsModule';
import ActionsModule from './modules/actions/ActionsModule';
import CollecteDataModule from './modules/collecte/CollecteDataModule';
import UtilitiesModule from './modules/utilities/UtilitiesModule';
import RHModule from './modules/rh/RHModule';

const MODULE_REGISTRY = {
  steg: StegModule,
  air: AirModule,
  sites: SitesDashboard,
  maintenance: MaintenanceDashboard,
  audits: AuditsModule,
  reunions: ReunionsModule,
  actions: ActionsModule,
  collecte: CollecteDataModule,
  utilities: UtilitiesModule,
  rh: RHModule,
};

const App = () => {
  const [user, setUser] = useState(null);
  const [currentModule, setCurrentModule] = useState('dashboard');

  const ActiveModule = useMemo(
    () => MODULE_REGISTRY[currentModule] || null,
    [currentModule]
  );

  const handleLogin = (userData) => {
    setUser(userData);
    setCurrentModule('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentModule('dashboard');
  };

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (currentModule === 'dashboard') {
    return (
      <MainDashboard
        user={user}
        onNavigate={setCurrentModule}
        onLogout={handleLogout}
      />
    );
  }

  if (currentModule === 'admin') {
    return <AdminPanel onBack={() => setCurrentModule('dashboard')} user={user} />;
  }

  if (ActiveModule) {
    return (
      <ActiveModule
        onBack={() => setCurrentModule('dashboard')}
        userRole={user.role}
        user={user}
      />
    );
  }

  return (
    <MainDashboard
      user={user}
      onNavigate={setCurrentModule}
      onLogout={handleLogout}
    />
  );
};

export default App;
