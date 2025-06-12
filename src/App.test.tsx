import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock aws-amplify to prevent loading real library in tests
jest.mock('aws-amplify', () => ({
  Amplify: { configure: jest.fn() },
  Auth: {
    currentAuthenticatedUser: jest.fn().mockRejectedValue(new Error('Not authenticated')),
    federatedSignIn: jest.fn(),
  },
}));

import Login from './components/auth/Login';

test('renders login button', async () => {
  render(<Login />);
  // Wait for authentication check to finish
  const button = await screen.findByRole('button', { name: /sign in with google/i });
  expect(button).toBeInTheDocument();
});
