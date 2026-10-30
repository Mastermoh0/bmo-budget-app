export const lessons = [
  { title: 'Meet your money', view: 'accounts', instruction: 'Open Add account. Name it Practice wallet, keep Bank account, and enter a ₦100,000 opening balance.', result: 'An account tells Bimo where money is held. You now have ₦100,000 to give a purpose.' },
  { title: 'Give it a purpose', view: 'budget', instruction: 'Use Assign money twice: ₦20,000 to Food, then ₦10,000 to Transport.', result: '₦30,000 is reserved for those jobs. ₦70,000 is still ready to assign. No money moved at a bank.' },
  { title: 'Record a small purchase', view: 'transactions', instruction: 'Open Add transaction. Choose Expense, Practice wallet and Food. Record a ₦2,000 purchase.', result: 'Your account has ₦98,000. Food has ₦18,000 available. Recording spending updates both views.' },
  { title: 'Make room in your plan', view: 'budget', instruction: 'Open Move money. Move ₦5,000 from Transport to Food.', result: 'Food now has ₦23,000 and Transport ₦5,000. Your account is still ₦98,000: moving a plan is not spending.' },
  { title: 'Spot a shortfall', view: 'transactions', instruction: 'Optional challenge: record a ₦26,000 Food expense from Practice wallet.', result: 'Food is ₦3,000 overspent. Your account has ₦72,000. The shortfall stays visible until you cover it.' },
  { title: 'Cover the shortfall', view: 'budget', instruction: 'Open Move money. Move ₦3,000 from Transport to Food.', result: 'Food is back to ₦0 and Transport has ₦2,000. Covering spending changes the plan, not your account balance.' },
] as const

export const practicePath = (view: string) => `/learn/practice${view === 'budget' ? '' : `/${view}`}`
