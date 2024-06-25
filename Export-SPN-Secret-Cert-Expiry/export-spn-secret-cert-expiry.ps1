############### MODULE ################

# Import modules if needed 
$requiredModules = @("Microsoft.Graph.Authentication", "Microsoft.Graph.Applications", "Microsoft.Graph.DirectoryObjects","Microsoft.Graph.Users", "Az.Storage", "Az.Accounts")
foreach ($module in $requiredModules) {    
    if (-not (Get-Module -ListAvailable -Name $module)) {        
        Write-Host "Installing module $module..."
        Install-Module -Name $module -Force -Confirm:$false        
        Write-Host "Module $module installed."
    } else {        
        Write-Host "Module $module already installed."
    }
}

# Connection information
$clientId   = <your_client_id>
$tenantId   = <your_tenant_id>
$Thumbprint = <your_thumbprint>

Connect-MgGraph -ClientId $clientId -TenantId $tenantId -CertificateThumbprint $Thumbprint

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
$logsDirectory = Join-Path -Path $scriptDirectory -ChildPath "Logs"
$csvDirectory = Join-Path -Path $scriptDirectory -ChildPath "csv_SecretExpiration"
Ensure-DirectoryExists -Path $logsDirectory
Ensure-DirectoryExists -Path $csvDirectory

# Path of the script execution log file
Start-Transcript -Path "$logsDirectory\execution_log_$dateNow.txt" 

# Path of the CSV file
$excelPath = "$csvDirectory\CSV_SecretExpiration$dateNow.csv"

####################### Functions #######################
$Messages = @{
    ExpirationDays = @{
        Info   = 'Filter the applications to log by the number of days until their secrets expire.'
        Prompt = 'Enter the number of days until the secrets expire as an integer.'
    }
    AlreadyExpired = @{
        Info   = 'Would you like to see Applications with already expired secrets as well?'
        Prompt = 'Enter Yes or No'
    }
    DurationNotice = @{
        Info = @(
            'The operation is running and will take longer the more applications the tenant has...'
            'Please wait...'
        ) -join ' '
    }
    Export = @{
        Info = 'The CSV file will be exported to the same directory as this script.'
    }
}

Write-Host $Messages.ExpirationDays.Info -ForegroundColor Green
$DaysUntilExpiration = Read-Host -Prompt $Messages.ExpirationDays.Prompt

Write-Host $Messages.AlreadyExpired.Info -ForegroundColor Green
$IncludeAlreadyExpired = Read-Host -Prompt $Messages.AlreadyExpired.Prompt

$Now = Get-Date

Write-Host $Messages.DurationNotice.Info -ForegroundColor Yellow

$Applications = Get-MgApplication -All

####################### Main Script #######################

$Logs = @()

foreach ($App in $Applications) {
    $AppName = $App.DisplayName
    $AppID   = $App.Id
    $ApplID  = $App.AppId

    $AppCreds = Get-MgApplication -ApplicationId $AppID | Select-Object PasswordCredentials, KeyCredentials

    $Secrets = $AppCreds.PasswordCredentials
    $Certs   = $AppCreds.KeyCredentials

    # Get Secrets Expiration
    foreach ($Secret in $Secrets) {
        $StartDate  = $Secret.StartDateTime
        $EndDate    = $Secret.EndDateTime
        $SecretName = $Secret.DisplayName

        $Owner    = Get-MgApplicationOwner -ApplicationId $App.Id
        $Username = $Owner.AdditionalProperties.displayName -join ';'
        $OwnerID  = $Owner.Id -join ';'

        if ($null -eq $Owner.AdditionalProperties.userPrincipalName) {
            $Username = @(
                $Owner.AdditionalProperties.displayName
                '**<This is an Application>**'
            ) -join ' '
        }
        if ($null -eq $Owner.AdditionalProperties.displayName) {
            $Username = '<<No Owner>>'
        }

        $RemainingDaysCount = ($EndDate - $Now).Days

        if (($IncludeAlreadyExpired -eq 'Yes' -and $RemainingDaysCount -le $DaysUntilExpiration) -or
          ($IncludeAlreadyExpired -eq 'No' -and $RemainingDaysCount -le $DaysUntilExpiration -and $RemainingDaysCount -ge 0)) {
            $Logs += [PSCustomObject]@{
                'ApplicationName'        = $AppName
                'ApplicationID'          = $ApplID
                'Secret Name'            = $SecretName
                'Secret Start Date'      = $StartDate
                'Secret End Date'        = $EndDate
                'DaysToExpiry'           = $RemainingDaysCount
                'Certificate Name'       = $Null
                'Certificate Start Date' = $Null
                'Certificate End Date'   = $Null
                'Owner'                  = $Username
                'Owner_ObjectID'         = $OwnerID
            }
        }
    }

    # Get Certificates Expiration
    foreach ($Cert in $Certs) {
        $StartDate = $Cert.StartDateTime
        $EndDate   = $Cert.EndDateTime
        $CertName  = $Cert.DisplayName

        $Owner    = Get-MgApplicationOwner -ApplicationId $App.Id
        $OwnerID  = $Owner.Id -join ';'
        $Username = $Owner.AdditionalProperties.displayName -join ';'

        if ($null -eq $Owner.AdditionalProperties.userPrincipalName) {
            $Username = @(
                $Owner.AdditionalProperties.displayName
                '**<This is an Application>**'
            ) -join ' '
        }
        if ($null -eq $Owner.AdditionalProperties.displayName) {
            $Username = '<<No Owner>>'
        }

        $RemainingDaysCount = ($EndDate - $Now).Days

        if (($IncludeAlreadyExpired -eq 'Yes' -and $RemainingDaysCount -le $DaysUntilExpiration) -or
          ($IncludeAlreadyExpired -eq 'No' -and $RemainingDaysCount -le $DaysUntilExpiration -and $RemainingDaysCount -ge 0)) {
            $Logs += [PSCustomObject]@{
                'ApplicationName'        = $AppName
                'ApplicationID'          = $ApplID
                'Secret Name'            = $Null
                'Certificate Name'       = $CertName
                'Certificate Start Date' = $StartDate
                'Certificate End Date'   = $EndDate
                'DaysToExpiry'           = $RemainingDaysCount
                'Owner'                  = $Username
                'Owner_ObjectID'         = $OwnerID
            }
        }
    }
}

$dateNow = Get-Date -Format 'yyyy-MM-dd-HH-mm'

try {
    $Logs | Export-Csv $excelPath -NoTypeInformation -Encoding UTF8
    Write-Host "Export completed! Exported in $excelPath `n" $dateNow -ForegroundColor Green
} catch {
    Write-Host "Failed to export CSV file: $_" -ForegroundColor Red
}

####################### Function: Upload to Azure Storage #######################

function Upload-ToAzureStorage {
    param (
        [string]$FilePath
    )

    $clientId       = <your_client_id>
    $tenantId       = <your_tenant_id>
    $Thumbprint     =  <your_thumbprint>
    $resourceGroup  = <your_resource_group>
    $storageAccount = <your_storage_account>
    $blobContainer  = <your_blob_container>
    $fileShare      = <your_file_share>

    Connect-AzAccount -CertificateThumbprint $Thumbprint -ApplicationId $clientId -Tenant $tenantId -ServicePrincipal

    $storageAccountKey = (Get-AzStorageAccountKey -ResourceGroupName $resourceGroup -AccountName $storageAccount).Value[0]
    $context = New-AzStorageContext -StorageAccountName $storageAccount -StorageAccountKey $storageAccountKey

    # Upload the CSV file to Blob Storage
    try {
        Set-AzStorageBlobContent -File $FilePath -Container $blobContainer -Blob ("CSV_SecretExpiration$dateNow.csv") -Context $context
        Write-Host "File uploaded to Blob Storage successfully"
    } catch {
        Write-Host "Failed to upload the file to Blob Storage: $_" -ForegroundColor Red
    }

    # Upload the CSV file to File Storage
    try {
        Set-AzStorageFileContent -ShareName $fileShare -Source $FilePath -Path ("secret-exp/CSV_SecretExpiration$dateNow.csv") -Context $context
        Write-Host "File uploaded to File Storage successfully"
    } catch {
        Write-Host "Failed to upload the file to File Storage: $_" -ForegroundColor Red
    }
}

# Call the upload function
Upload-ToAzureStorage -FilePath $excelPath

# End the transcript
Stop-Transcript