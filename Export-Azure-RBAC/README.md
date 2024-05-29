Export Azure RBAC Roles Script
==============================

This PowerShell script automates the process of exporting Role-Based Access Control (RBAC) roles from an Azure tenant and saves the information in an Excel file.

It simplifies the task of exporting RBAC role assignments, providing a clear overview of who has access to what resources within their Azure tenant.

It helps in auditing and managing RBAC assignments

Configuration
-------------

-   **Module Installation**: The script automatically installs required PowerShell modules (`Az.Resources`, `Az.Accounts`, `ImportExcel`) if they are not already installed.
-   **Azure Authentication**: Users are prompted to log in to their Azure account. Optionally, they can specify a tenant ID.
-   **Log and Output Directory Setup**: Directories for storing logs and output files are automatically created.
-   **Excel Export**: The collected RBAC data is exported to an Excel file with separate worksheets for management groups, subscriptions, and individual resources.

How to Use
----------

1.  **Clone or download the repository or files needed** to your local machine.
2.  **Open PowerShell** and navigate to the directory containing the script.
3.  **Run the script** by executing `./export-azure-rbac.ps1`.
4.  **Authenticate to Azure** when prompted. Optionally, provide your tenant ID if necessary.
5.  **Wait for the script to complete** its execution. An Excel file containing RBAC role assignments will be generated in the `xlsx_Az_RBAC` directory.

Output
------

-   **Excel File**: The script creates an Excel file named `AZ_RBAC_Assignments_<timestamp>.xlsx` with multiple worksheets:
    -   `Mg_RBAC`: Role assignments for management groups
    -   `Mg_Subscriptions`: Subscriptions under management groups
    -   `Resources_RBAC`: Role assignments for individual resources
-   **Log File**: A log file detailing the script execution is generated in the `logs_Script_RBAC` directory.

 
