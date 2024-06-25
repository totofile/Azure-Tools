# Azure AD Application Secret and Certificate Expiration Checker

This PowerShell script checks Azure AD applications to identify secrets and certificates that are expiring within a certain number of days. The results are exported to a CSV file and optionally uploaded to Azure Blob Storage and File Storage.

## Prerequisites

- PowerShell installed on your machine.
- The following PowerShell modules:
  - Microsoft.Graph.Authentication
  - Microsoft.Graph.Applications
  - Microsoft.Graph.DirectoryObjects
  - Microsoft.Graph.Users
  - Az.Storage
  - Az.Accounts

## Configuration

Ensure you have the following connection information:
- `ClientId`
- `TenantId`
- `Thumbprint` of the certificate

These should be set in relevant variables within the script.

### Permissions

The app registration used for this script should have the following API permissions:
- `Application.ReadWrite.All`
- `Directory.Read.All`
- `User.Read.All`

Additionally, the script uses certificate-based authentication, but you can switch to another authentication method if needed.

### Azure Storage Requirements

To upload files to Azure Storage, you need:
- Resource Group name
- Storage Account name
- Blob Container name
- File Share name

Ensure that your Azure storage account and other configurations are correctly set and have the necessary permissions.

## Usage

1. Clone this repository or download the PowerShell script.
2. Open PowerShell and navigate to the directory containing the script.
3. Update the following placeholders in the script with your values:
   - `<your_client_id>`
   - `<your_tenant_id>`
   - `<your_thumbprint>`
   - `<your_resource_group>`
   - `<your_storage_account>`
   - `<your_blob_container>`
   - `<your_file_share>`
4. Run the script with the following command:
   ```powershell
   .\YourScriptName.ps1

1.  Follow the prompts to enter:
    -   The number of days until secret expiration.
    -   Whether you want to include applications with already expired secrets.

The script will generate a CSV file with the expiration information for secrets and certificates.

### Optional: Upload to Azure Storage

The function `Upload-ToAzureStorage` is included in the script to upload the generated CSV file to Azure Blob Storage and File Storage. This step is optional. If you do not wish to upload the file, you can comment out or remove the function call at the end of the script.

### API Modules

Ensure the Az modules are installed for Azure Storage functionalities:

-   Az.Storage
-   Az.Accounts

Microsoft Graph API modules are used for querying Azure AD:

-   Microsoft.Graph.Authentication
-   Microsoft.Graph.Applications
-   Microsoft.Graph.DirectoryObjects
-   Microsoft.Graph.Users

Example Output
--------------

Here is an example console output when running the script:

```
Enter the number of days until the secrets expire as an integer: [10]
Would you like to see Applications with already expired secrets as well? (Enter Yes or No) [Yes]
The operation is running and will take longer the more applications the tenant has... Please wait...

Export completed! Exported in C:\path\to\csv_SecretExpiration\CSV_SecretExpiration<timestamp>.csv
File uploaded to Blob Storage successfully
File uploaded to File Storage successfully
```