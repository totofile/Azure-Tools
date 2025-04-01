<#
.SYNOPSIS
    Script to configure permissions for a managed identity to send emails via Microsoft Graph API.

.DESCRIPTION
    This script assigns the necessary permissions to a managed identity to send emails
    via Microsoft Graph API and Exchange Online. It uses Microsoft Graph APIs to configure
    these permissions.

.NOTES
    File: configure-permissions.ps1
    Author: Theophile Faugeras
    Version: 1.0
    Date: To be filled
#>

# Install and import required modules if not already installed
Write-Host "Checking and installing required modules..."
$requiredModules = @("Microsoft.Graph.Authentication", "Microsoft.Graph.Applications")

foreach ($module in $requiredModules) {
    if (-not (Get-Module -ListAvailable -Name $module)) {
        Write-Host "Installing module $module..."
        Install-Module -Name $module -Force -Scope CurrentUser
    }
}

# Connect to Microsoft Graph with necessary scopes
Write-Host "Connecting to Microsoft Graph..."
Connect-MgGraph -Scopes "Application.Read.All","AppRoleAssignment.ReadWrite.All","RoleManagement.ReadWrite.Directory"

# Select beta profile to access all features
Write-Host "Selecting beta profile..."
Select-MgProfile Beta

# Get the managed identity name
$MdId_Name = Read-Host "Name of your Managed Identity (Automation Account name)"
$MdId_ID = (Get-MgServicePrincipal -Filter "displayName eq '$MdId_Name'").id

if (-not $MdId_ID) {
    Write-Error "Unable to find managed identity with name $MdId_Name"
    exit 1
}

Write-Host "Managed identity found with ID: $MdId_ID"

# Retrieve Microsoft Graph application
Write-Host "Retrieving Microsoft Graph information..."
$graphApp = Get-MgServicePrincipal -Filter "AppId eq '00000003-0000-0000-c000-000000000000'"

# Define necessary Graph permissions
$graphScopes = @(
    "User.Read.All"
    "Mail.Send"
    "Mail.ReadWrite"
)

# Assign Graph permissions
Write-Host "Assigning Microsoft Graph permissions..."
ForEach($scope in $graphScopes) {
    Write-Host "Assigning permission $scope..."
    $appRole = $graphApp.AppRoles | Where-Object {$_.Value -eq $scope}

    if ($null -eq $appRole) { 
        Write-Warning "Unable to find application role for permission $scope"
        continue
    }

    # Check if permission is already assigned
    $assignedAppRole = Get-MgServicePrincipalAppRoleAssignment -ServicePrincipalId $MdId_ID | 
                        Where-Object { $_.AppRoleId -eq $appRole.Id -and $_.ResourceDisplayName -eq "Microsoft Graph" }

    if ($null -eq $assignedAppRole) {
        New-MgServicePrincipalAppRoleAssignment -PrincipalId $MdId_ID -ServicePrincipalId $MdId_ID -ResourceId $graphApp.Id -AppRoleId $appRole.Id
        Write-Host "Permission $scope assigned successfully" -ForegroundColor Green
    } else {
        Write-Host "Permission $scope already assigned" -ForegroundColor Yellow
    }
}

# Retrieve Exchange Online application
Write-Host "Retrieving Exchange Online information..."
$ExoApp = Get-MgServicePrincipal -Filter "AppId eq '00000002-0000-0ff1-ce00-000000000000'"

# Assign Exchange.ManageAsApplication permission
Write-Host "Assigning Exchange.ManageAsApplication permission..."
$AppPermission = $ExoApp.AppRoles | Where-Object {$_.DisplayName -eq "Manage Exchange As Application"}

if ($null -eq $AppPermission) {
    Write-Error "Unable to find permission 'Manage Exchange As Application'"
    exit 1
}

# Check if permission is already assigned
$assignedExoPermission = Get-MgServicePrincipalAppRoleAssignment -ServicePrincipalId $MdId_ID | 
                        Where-Object { $_.AppRoleId -eq $AppPermission.Id -and $_.ResourceId -eq $ExoApp.Id }

if ($null -eq $assignedExoPermission) {
    $AppRoleAssignment = @{
        "PrincipalId" = $MdId_ID
        "ResourceId" = $ExoApp.Id
        "AppRoleId" = $AppPermission.Id
    }

    New-MgServicePrincipalAppRoleAssignment -ServicePrincipalId $MdId_ID -BodyParameter $AppRoleAssignment
    Write-Host "Permission 'Exchange.ManageAsApplication' assigned successfully" -ForegroundColor Green
} else {
    Write-Host "Permission 'Exchange.ManageAsApplication' already assigned" -ForegroundColor Yellow
}

Write-Host "`nConfiguration complete. Permissions may take a few minutes to propagate." -ForegroundColor Green
Write-Host "You can now create and run your runbook to send emails."
