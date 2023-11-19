import { useEffect, useState } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import routes from './routes';
import AuthService from './services/AuthService';
import AccountContext, { EMPTY_ACCOUNT } from './providers/account'

const router = createBrowserRouter(routes);

function App() {
  const [account, setAccount] = useState(EMPTY_ACCOUNT);

  useEffect(() => {
    async function load() {
      if (!account.token) {
        const token = await AuthService.getTokenInfo();
        if (token) {
          setAccount({
            accountID: token.accountID,
            userID: token.userID,
            roles: [],
            kind: token.kind.toLowerCase(),
            lastName: token.lastName,
            firstName: token.firstName
          });
        }
      }
    }

    load();
  }, []);

  return (
    <AccountContext.Provider value={{ account, setAccount }}>
      <RouterProvider router={router} />
    </AccountContext.Provider>
  );
}

export default App;
