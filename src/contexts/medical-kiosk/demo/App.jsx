import React, { useState } from 'react';
import LoginScreen from './LoginScreen';
import KioskFrame from './KioskFrame';

const App = () => {
  const [userName, setUserName] = useState(null);

  if (!userName) {
    return <LoginScreen onLogin={(name) => setUserName(name)} />;
  }

  return <KioskFrame userName={userName} onLogout={() => setUserName(null)} />;
};

export default App;
