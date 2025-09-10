# Azure AD Authentication Setup

This guide will help you set up Azure AD authentication for your React application using MSAL (Microsoft Authentication Library).

## Prerequisites

1. You need to have an Azure AD tenant
2. You need to have an Enterprise Application registered in Azure AD

## Setup Steps

### 1. Install Required Packages

Run the following command in your project directory:

```bash
npm install @azure/msal-react @azure/msal-browser
```

### 2. Create Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# Azure AD Configuration
REACT_APP_AZURE_CLIENT_ID=your-client-id-here
REACT_APP_AZURE_AUTHORITY=https://login.microsoftonline.com/your-tenant-id-here
REACT_APP_REDIRECT_URI=http://localhost:3000
REACT_APP_POST_LOGOUT_REDIRECT_URI=http://localhost:3000
```

### 3. Get Values from Azure Portal

To get the required values:

1. **Client ID**:

   - Go to Azure Portal → Azure Active Directory → App registrations
   - Select your application
   - Copy the "Application (client) ID"

2. **Tenant ID**:

   - In the same app registration page
   - Copy the "Directory (tenant) ID"
   - Use it in the authority URL: `https://login.microsoftonline.com/{tenant-id}`

3. **Redirect URIs**:
   - In your app registration, go to "Authentication"
   - Add `http://localhost:3000` as a redirect URI
   - Select "Single-page application (SPA)" as the platform

### 4. Configure Azure App Registration

In your Azure App Registration:

1. **Authentication**:

   - Platform: Single-page application
   - Redirect URIs: `http://localhost:3000`
   - Logout URL: `http://localhost:3000`

2. **API Permissions**:

   - Microsoft Graph: User.Read (Delegated)
   - Grant admin consent if required

3. **Supported Account Types**:
   - Choose based on your organization's needs
   - Typically "Accounts in this organizational directory only"

### 5. Test the Setup

1. Start your React application:

   ```bash
   npm start
   ```

2. You should see a sign-in page when you access the application
3. Click "Sign in with Microsoft" to test the authentication flow

## Troubleshooting

### Common Issues

1. **AADSTS50011: Reply URL mismatch**

   - Ensure the redirect URI in your `.env` file matches exactly what's configured in Azure

2. **AADSTS700016: Application not found**

   - Check that your Client ID is correct
   - Ensure the application exists in the correct tenant

3. **AADSTS65001: User or administrator has not consented**

   - Grant admin consent for the required permissions in Azure Portal

4. **Network errors**
   - Check that your authority URL is correct
   - Ensure your tenant ID is valid

### Development vs Production

For production deployment:

- Update redirect URIs to your production domain
- Use environment-specific `.env` files
- Consider using Azure Key Vault for sensitive configuration

## Features Included

✅ **Sign In/Sign Out**: Complete authentication flow  
✅ **User Profile**: Display user information from Microsoft Graph  
✅ **Protected Routes**: Only authenticated users can access the application  
✅ **Token Management**: Automatic token refresh and management  
✅ **Error Handling**: Proper error handling for authentication failures

## Security Considerations

- Never commit your `.env` file with real credentials
- Use HTTPS in production
- Regularly rotate client secrets if using confidential client flows
- Monitor authentication logs in Azure AD

## Next Steps

After successful setup, you can:

- Customize the sign-in experience
- Add role-based access control
- Integrate with backend APIs using acquired tokens
- Add additional Microsoft Graph API calls
