Export EntraID Application Secrets Expiry Script
=================================================

This PowerShell script automates the process of exporting Entra ID (Azure AD) application secrets that are about to expire within a specified number of days. It helps in managing and auditing application credentials to ensure timely renewal and avoid service interruptions.

Purpose
-------

Managing application secrets is crucial for maintaining secure and operational environments. This script checks for application secrets in Azure AD that will expire within a user-defined number of days, helping administrators to take action before the secrets expire.

Configuration
-------------

-   **Parameterization**: The script accepts a parameter `-days` to specify the number of days before expiry to check for secrets. By default, it checks for secrets expiring in the next 30 days.
-   **Module Installation**: Automatically installs the required PowerShell module (`AzureAD`) if it is not already installed.
-   **Azure Authentication**: Prompts the user to log in to their Azure AD account. Optionally, you can specify a tenant ID.
-   **Directory Setup**: Creates necessary directories for storing logs and output CSV files.
-   **Data Collection**: Gathers information on application secrets that are nearing expiry, including the application name, owner details, and days until expiry.
-   **CSV Export**: Exports the collected data to a CSV file for easy management and review.

How to Use
----------

1.  **Clone or download files you need** to your local machine.
2.  **Open PowerShell** and navigate to the directory containing the script.
3.  **Run the script** by executing:

    powershell

    Copier le code

    `./AppSecretExpiracy.ps1 -days <number_of_days>`

    Replace `<number_of_days>` with the desired number of days to check for expiring secrets. The default is 30 days.
4.  **Authenticate to Azure AD** when prompted. Optionally, provide your tenant ID if necessary.
5.  **Wait for the script to complete** its execution. A CSV file containing details of expiring secrets will be generated in the `CSV_SecretExpiration` directory.

Output
------

-   **CSV File**: The script creates a CSV file named `CSV_SecretExpiration<timestamp>.csv` in the `CSV_SecretExpiration` directory. The CSV file includes the following columns:
    -   `OwnerDisplayName`: The display name of the secret owner.
    -   `OwnerEmail`: The email of the secret owner.
    -   `ApplicationName`: The name of the application.
    -   `ApplicationId`: The ID of the application.
    -   `SecretId`: The ID of the secret.
    -   `SecretExpiryDate`: The expiry date of the secret.
    -   `DaysToExpiry`: The number of days until the secret expires.
-   **Log File**: A log file detailing the script execution is generated in the `Logs` directory.
