# Tech Sales AI

A ChatGPT-like interface for sales professionals with AWS Cognito authentication and multi-chat functionality.

## Features

- React-based front-end application
- ChatGPT-like interface for sales proposals
- AWS Cognito authentication with Google login
- Client-grouped proposals with hierarchical navigation
- Material UI components for modern design
- Restricted access to specific users

## Project Structure

```
tech-sales-ai/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   └── Login.tsx
│   │   ├── chat/
│   │   │   ├── ChatInterface.tsx
│   │   │   ├── ChatMessage.tsx
│   │   │   └── ChatWindow.tsx
│   │   └── layout/
│   │       ├── Header.tsx
│   │       ├── ProposalModal.tsx
│   │       └── Sidebar.tsx
│   ├── config/
│   │   └── aws-config.ts
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   └── ChatContext.tsx
│   ├── services/
│   │   └── mockData.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   ├── App.tsx
│   └── index.tsx
└── package.json
```

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Configure AWS Cognito (see below)
4. Start the development server:
   ```
   npm start
   ```

## AWS Cognito Configuration

### Step 1: Create a Cognito User Pool

1. Sign in to the AWS Management Console and navigate to the Cognito service
2. Click "Create user pool"
3. For sign-in options, select "Email" as the primary option
4. Under "Cognito user pool sign-in options", select "Email"
5. Click "Next"
6. For password policy, you can use the default settings
7. For Multi-factor authentication (MFA), select "No MFA"
8. Click "Next"
9. For self-service sign-up, select "Enable self-registration"
10. For attribute verification, select "Send email message, verify email address"
11. For required attributes, add "email" and "name"
12. Click "Next"
13. For message delivery, select "Send email with Cognito"
14. Click "Next"
15. Name your user pool (e.g., "TechSalesAI")
16. Under "Initial app client", set:
    - App type: "Public client"
    - App client name: "tech-sales-ai-client"
    - Authentication flows: Check "ALLOW_USER_SRP_AUTH" and "ALLOW_REFRESH_TOKEN_AUTH"
17. Click "Next"
18. Review your settings and click "Create user pool"

### Step 2: Configure Google as an Identity Provider

1. In your user pool, go to the "Sign-in experience" tab
2. Under "Federated identity provider sign-in", click "Add identity provider"
3. Select "Google"
4. Create a Google OAuth application:
   - Go to the Google Cloud Console (https://console.cloud.google.com/)
   - Create a new project or use an existing one
   - Navigate to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Set application type to "Web application"
   - Add your domain to "Authorized JavaScript origins" (e.g., http://localhost:3000 for development)
   - Add your Cognito domain to "Authorized redirect URIs" (you'll get this from Cognito)
   - Click "Create"
5. Copy the Google Client ID and Client Secret
6. Back in Cognito, enter these values
7. For "Authorized scopes", enter: "profile email openid"
8. Map Google attributes to user pool attributes:
   - Google "sub" to Cognito "Username"
   - Google "email" to Cognito "Email"
   - Google "name" to Cognito "Name"
9. Click "Save changes"

### Step 3: Configure App Client Settings

1. Go to the "App integration" tab in your user pool
2. Under "App clients", click on your app client
3. Under "Hosted UI", click "Edit"
4. Check "Google" as an identity provider
5. Add callback URL: http://localhost:3000/ (for development)
6. Add sign-out URL: http://localhost:3000/
7. Select "Authorization code grant" for OAuth grant type
8. Select "email", "openid", and "profile" for OAuth scopes
9. Click "Save changes"

### Step 4: Update Your Application Configuration

1. Update the AWS configuration in `src/config/aws-config.ts` with your credentials:
   ```typescript
   export const awsConfig = {
     Auth: {
       region: 'your-region',
       userPoolId: 'your-user-pool-id',
       userPoolWebClientId: 'your-app-client-id',
       oauth: {
         domain: 'your-domain.auth.your-region.amazoncognito.com',
         scope: ['email', 'profile', 'openid'],
         redirectSignIn: 'http://localhost:3000/',
         redirectSignOut: 'http://localhost:3000/',
         responseType: 'code'
       }
     }
   };
   ```

## Deployment to S3

1. Build the production version:
   ```
   npm run build
   ```
2. Upload the contents of the `build` folder to your S3 bucket
3. Configure the S3 bucket for static website hosting
4. Set up CloudFront distribution (optional, for HTTPS and better performance)
5. Update the Cognito callback URLs to your production domain