const en = {
  error: {
    unknown: 'An unknown error occurred.',
    auth: {
      invalid_credentials: 'Invalid credentials',
      not_activated: 'Account is not activated',
      verify_not_present: 'Account is not verified'
    },
    validation: {
      email: 'Email is required',
      password: 'Password is required',
      password_mismatch: 'Password mismatch'
    }
  },
  values: {
    account_kind: {
      student: 'Student',
      faculty: 'Faculty',
      administrator: 'Administrator'
    },
    thesis_status: {
      new: 'New',
      for_checking: 'For checking',
      checked: 'Checked',
      endorsed: 'Endorsed',
      redefense: 'Redefense',
      pass: 'Pass',
      fail: 'Fail',
      final: 'Final'
    },
    defense_status: {
      pending: 'Pending',
      approved: 'Approved by panelists',
      confirmed: 'Confirmed',
      declined: 'Declined'
    },
    thesis_phase: {
      '1': 'THS-ST1',
      '2': 'THS-ST2',
      '3': 'THS-ST3'
    },
    full_name: '{{lastName}}, {{firstName}}',
    full_name_regular: '{{firstName}} {{lastName}}',
    display_full_name: '{{lastName}}, {{firstName}}',
    display_full_name_inactive: '{{lastName}}, {{firstName}} (Inactive)',
  }
};

export default en;
