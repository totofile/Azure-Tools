#################### Modules #############################
$requiredModules = @("Az.Resources", "Az.Accounts", "ImportExcel") 
foreach ($module in $requiredModules) {    
    if (-not (Get-Module -ListAvailable -Name $module)) {        
        Write-Host "Installation du module $module..."        
        Install-Module -Name $module -Force -Confirm:$false        
        Write-Host "Module $module installé."    
    } else {        
        Write-Host "Module $module déjà installé."
    }
}

############ Conexion ##############

#ADD YOUR TENANT ID IF NEEDED
Connect-AzAccount #-Tenant <TenantId>

#################### Files & Folders ######################
$dateNow = Get-Date -Format 'yyyy-MM-dd-HH-mm' 
$scriptDirectory = $PSScriptRoot 

function Ensure-DirectoryExists {
    param (
        [string]$Path
    )
    if (-not (Test-Path -Path $Path)) {    
        New-Item -Path $Path -ItemType Directory
        Write-Output "$Path Folder Has Been Created"
    } else {    
        Write-Output "$Path Folder Already Exists"
    }
}

# Ensure creation of logs_Directory and csvDirectory
$logsDirectory = Join-Path -Path $scriptDirectory -ChildPath "logs_Script_RBAC"
$csvDirectory = Join-Path -Path $scriptDirectory -ChildPath "csv_Az_RBAC"
Ensure-DirectoryExists -Path $logsDirectory
Ensure-DirectoryExists -Path $csvDirectory

# Path of script execution log file
Start-Transcript -Path "$logsDirectory\execution_log_$dateNow.txt" 

# Path of the CSV file
$excelPath = "$csvDirectory\AZ_RBAC_Assignements_$dateNow.xlsx"


function Get-ManagementGroupPath {
    param (
        [string]$mgName
    )

    $mg = Get-AzManagementGroup -GroupName $mgName
    
        if ($mg.ParentName -eq $null) {
            return $mg.DisplayName
        } else {
            $parentPath = Get-ManagementGroupPath -mgName $mg.ParentName
            return $parentPath +"/" + $mg.DisplayName 
        }
       
} 

# Initialize data collections
$mgRoleAssignmentsList = @()
$mgSubscriptionsList = @()
$resourceRoleAssignmentsList = @()


# Collecting Management groups
$managementGroups = Get-AzManagementGroup

# Collecting Management Group Assignments and Subscriptions
foreach ($mg in $managementGroups) {
    $mgId = $mg.Id
    $mgName = $mg.Name
    $mgDisplayName = $mg.DisplayName
    $mgPath = Get-ManagementGroupPath -mgName $mgName

    
    $MgroleAssignments = Get-AzRoleAssignment -Scope $mgId
                 
    #String Manipulation for comprehension 
    foreach ($MgroleAssignment in $MgroleAssignments) {
        $scopeDisplayValue = switch -Wildcard ($MgroleAssignment.Scope) {
            "/" { "Root" }
            "/providers/Microsoft.Management/managementGroups/*" { "Management Group" }
            default { $MgroleAssignment.Scope }
        }

        # Building Objects for xlsx
        $mgRoleAssignmentsList += [PSCustomObject]@{
            ManagementGroupName = $mgDisplayName
            ManagementGroupPath = $mgPath
            RoleDefinitionName = $($MgroleAssignment.RoleDefinitionName) 
            UserGroupName = $($MgroleAssignment.DisplayName)
            ObjectType = $($MgroleAssignment.ObjectType)
            RoleScopeDisplayName = $scopeDisplayValue
            RoleScopeUri = $($MgroleAssignment.Scope)
        }
    }

    # Subscriptions assigned to management group
    $subscriptions = Get-AzManagementGroupSubscription -GroupName $mgName    
      
    #get Sub informations
    foreach ($subscription in $subscriptions) {
        $SubId = $subscription.Id        
        $SubDisplayName = $subscription.DisplayName

        # Add Sub infos in object list for xlsx
        $mgSubscriptionsList += [PSCustomObject]@{
            ManagementGroupName = $mgDisplayName
            SubscriptionName = $SubDisplayName
            SubscriptionId = $SubId
        }
    }
}

# Export collected data once to Excel
$mgRoleAssignmentsList | Export-Excel -Path $excelPath -WorksheetName "Mg_RBAC"
$mgSubscriptionsList | Export-Excel -Path $excelPath -WorksheetName "Mg_Subscriptions"

# Confirmation
Write-Host "Export Mg_RBAC & Mg_Subscriptions Ended! in $excelPath`nWait for ressources RBAC page "$dateNow

# Get Subs avaliable
$subscriptions = Get-AzSubscription

# Collecting Resource Role Assignments
foreach ($subscription in $subscriptions) {
    $subId = $subscription.Id
    $subName = $subscription.Name #-> For Xlsx
    Set-AzContext -SubscriptionId $subId

    # Get Resources groups avaliable
    $resourceGroups = Get-AzResourceGroup 

    #Get RG infos
    foreach ($resourceGroup in $resourceGroups) {
        $rgName = $resourceGroup.ResourceGroupName
        $resources = Get-AzResource -ResourceGroupName $rgName

        foreach ($resource in $resources) {
            $resourceName = $resource.Name

            # Get Role assignments for each resource
            $roleAssignments = Get-AzRoleAssignment -Scope $resource.ResourceId

            foreach ($roleAssignment in $roleAssignments) {
                # String manipulation to get clear infos from URI ...
                $scopeDisplayValue = switch -Wildcard ($roleAssignment.Scope) {
                    "/" { "Root" }
                    "/providers/Microsoft.Management/managementGroups/*" {
                        $MgDisplayName = Get-AzManagementGroup -GroupName (($roleAssignment.scope).Split("/")[-1]) | 
                        Select-Object -ExpandProperty DisplayName
                        "Mg : "+$MgDisplayName
                    }
                    "/subscriptions/*/resourceGroups/*" {
                        if ($roleAssignment.Scope -notmatch "/providers/.+/.+") {
                            "Rg : "+$rgName
                        }
                    }
                    "/subscriptions/*/resourceGroups/*/providers/*/*" { "Resource : "+$resourceName }
                    "/subscriptions/*" { 
                        if ($roleAssignment.Scope -notmatch "/resourceGroups/") {
                            "Sub :"+$subName 
                        }
                    }
                    default { $roleAssignment.Scope }
                }

                # Add Objects to list for xlsx before export 
                $resourceRoleAssignmentsList += [PSCustomObject]@{
                    SubscriptionName = $subName
                    ResourceGroupName = $rgName
                    ResourceName = $resourceName
                    RoleDefinitionName = $roleAssignment.RoleDefinitionName
                    UserGroupName = $roleAssignment.DisplayName
                    ObjectType = $roleAssignment.ObjectType
                    RoleScopeDisplayName = $scopeDisplayValue
                    RoleScopeUri = $roleAssignment.Scope
                }
            }
        }
    }
}

$dateNow = Get-Date -Format 'yyyy-MM-dd-HH-mm' 

$resourceRoleAssignmentsList | Export-Excel -Path $excelPath -WorksheetName "Resources_RBAC"

# Confirmation
Write-Host "Export Ended! Roles Assignments RBAC Exported in $excelPath `n" $dateNow
