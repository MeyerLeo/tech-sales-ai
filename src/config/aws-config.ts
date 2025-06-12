// AWS Configuration for Cognito
export const awsConfig = {
  Auth: {
    // Cognito Region - replace with your region
    region: 'us-east-1',
    
    // User Pool ID - replace with your actual User Pool ID
    userPoolId: 'us-east-1_RWKQ7LKmi',
    
    // App Client ID - replace with your actual App Client ID
    userPoolWebClientId: '7vouqc9q6ffbma6sse6v0jfq6l',
    
    // OAuth configuration for Google sign-in
    oauth: {
      domain: 'tech-sales-ai-domain.auth.us-east-1.amazoncognito.com',
      scope: ['email', 'profile', 'openid'],
      redirectSignIn: 'http://localhost:3000/',
      redirectSignOut: 'http://localhost:3000/',
      responseType: 'code'
    },
    
    // Enable cookies for hosted UI
    cookieStorage: {
      domain: 'localhost',
      path: '/',
      expires: 365,
      secure: false
    }
  }
};