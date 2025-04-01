# Azure Runbook - Email Sending Script via Microsoft Graph API

This project contains a PowerShell script that allows you to send emails via Microsoft Graph API using an Azure Runbook and a managed identity.

## Prerequisites

- An Azure subscription
- An Azure Automation Account with a managed identity enabled
- Administrative access to Azure AD to configure permissions

## Configuration

### 1. Create an Automation Account

1. In the Azure portal, go to **Automation Accounts**
2. Click on **+ Add**
3. Fill in the required information and make sure to enable the **System assigned managed identity** option
4. Click on **Create**

### 2. Install Required PowerShell Modules

In your Automation Account, go to **Modules** and install the following modules:

- Az.Accounts
- Microsoft.Graph.Authentication
- Microsoft.Graph.Users.Action

To install the modules:
1. Go to your Automation Account
2. Select **Modules** in the left menu
3. Click on **Browse gallery**
4. Search for and install each module

### 3. Configure Managed Identity Permissions

The managed identity needs the following permissions to work properly:

- **Microsoft Graph API**:
  - User.Read.All
  - Mail.Send

- **Office 365 Exchange Online**:
  - Exchange.ManageAsApplication

Use the `configure-permissions.ps1` script provided in this project to automatically assign these permissions.

### 4. Create a Runbook

1. In your Automation Account, go to **Runbooks**
2. Click on **+ Create a runbook**
3. Give your runbook a name (e.g., "SendMailViaGraph")
4. Select **PowerShell** as the runbook type
5. Click on **Create**
6. Once created, open the editor and copy-paste the content of the `send-mail.ps1` script
7. Modify the `$sender` and `$recipient` variables to fit your environment
8. Publish the runbook

## Usage

To use this runbook:

1. Go to your Automation Account
2. Open the runbook you created
3. Click on **Start**
4. Check the execution logs to ensure the email was sent successfully

## Troubleshooting

If you encounter errors when running the runbook:

- Check that all required modules are installed
- Make sure the managed identity has the necessary permissions
- Verify that the sender and recipient email addresses are valid
- Check the execution logs for more details on errors

## Notes

- The managed identity must be properly configured to be able to send emails on behalf of the sender
- Permissions may take a few minutes to propagate after being assigned
