PowerShell Script for Exporting and Uploading Application Secrets to Azure Blob Storage
=======================================================================================

Description
-----------

This PowerShell script exports application secrets (passwords and certificates) from Azure Active Directory and uploads them to Azure Blob Storage. The script performs the following operations:

1.  Installs the required Microsoft.Graph modules.
2.  Connects to Azure AD.
3.  Creates the necessary directories for logs and CSV files.
4.  Retrieves application details and their expiring secrets or certificates within a specified number of days.
5.  Exports this information to a CSV file.
6.  Uploads the CSV file to Azure Blob Storage using AzCopy.

Prerequisites
-------------
### App registered

- Connect to MgGraph with an ap registered [AppRegistation](https://learn.microsoft.com/fr-fr/entra/identity-platform/quickstart-register-app)
- Choose your [Connect-MgGraph](https://learn.microsoft.com/en-us/powershell/module/microsoft.graph.authentication/connect-mggraph?view=graph-powershell-1.0) personaly I use CertificateThumbprint
- [API_permission](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-configure-app-access-web-apis) for your app need to be Application.Read.All & User.Read

### AzCopy

-   Download and install [AzCopy](https://learn.microsoft.com/fr-fr/azure/storage/common/storage-use-azcopy-v10) on your machine.

### PowerShell Modules

This script requires the following PowerShell modules:

-   `Microsoft.Graph.Authentication`
-   `Microsoft.Graph.Applications`

These modules will be automatically installed by the script if they are not already present.

Usage
-----

### Cloning the Repository

Clone this repository to your local machine:

```
git clone https://github.com/yourusername/yourrepository.git
cd yourrepository

```

### Configuration

Ensure that the following variables in the script are correctly defined:

-   `$clientId`: Your application ID.
-   `$tenantId`: Your Azure AD tenant ID.
-   Path to AzCopy: `$azcopyPath`.

### Running the Script

Open PowerShell with administrative permissions and run the script:

powershell -ExecutionPolicy Bypass -File .\YourScriptName.ps1
