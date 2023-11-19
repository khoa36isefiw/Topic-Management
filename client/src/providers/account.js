import React from 'react'

const EMPTY_ACCOUNT = {
  accountID: null,
  userID: null,
  roles: [],
  kind: null,
  lastName: null,
  firstName: null
}

const AccountContext = React.createContext({
  account: EMPTY_ACCOUNT,
  setAccount: (account) => {}
})

const useAccount = () => {
  return React.useContext(AccountContext)
}

const checkAccountRole = (account, role) => {
  if (role.includes('.')) {
    const [eKind, eRole] = role.split(/\./)
    return account.kind.toLowerCase() === eKind && account.roles.some(e => e.toLowerCase() === eRole)
  } else {
    return account.kind.toLowerCase() === role
  }
}

const checkAccount = (account, roleOrRoles) => {
  if (typeof roleOrRoles === 'string') {
    return checkAccountRole(account, roleOrRoles)
  } else {
    return roleOrRoles.some(e => checkAccountRole(account, e))
  }
}

export default AccountContext
export { useAccount, checkAccount, EMPTY_ACCOUNT }
