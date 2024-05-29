#Faire de la variable un paramètre powershell

param (
    [int]$days = 30
)


###############  MODULE  ################

# Importer le module requis s'il n'est pas déjà installé
$requiredModules = @("AzureAD") 
foreach ($module in $requiredModules) {    
    if (-not (Get-Module -ListAvailable -Name $module)) {        
        Write-Host "Installation du module $module..."        
        Install-Module -Name $module -Force -Confirm:$false        
        Write-Host "Module $module installé."    
    } else {        
        Write-Host "Module $module déjà installé."
    }
}

############  CONECT  #############
# Se connecter à Azure AD avec un Tenant ID spécifique
Connect-AzureAD #-TenantId <TenantId> 


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
$csvDirectory = Join-Path -Path $scriptDirectory -ChildPath "CSV_SecretExpiration"
Ensure-DirectoryExists -Path $logsDirectory
Ensure-DirectoryExists -Path $csvDirectory

# Path of the script execution log file
Start-Transcript -Path "$logsDirectory\execution_log_$dateNow.txt" 

# Path of the CSV file
$excelPath = "$csvDirectory\AZ_RBAC_Assignements_$dateNow.csv"

#########  MAIN  ##############

# Initialiser une liste pour contenir les données à exporter
$exportData = @()




# Récupérer toutes les app registrations
$apps = Get-AzureADApplication -All $true



# Parcourir chaque application
foreach ($app in $apps) {

    # Récupérer les secrets / passwords pour l'application
    $secrets = Get-AzureADApplicationPasswordCredential -ObjectId $app.ObjectId

    # Récupérer le Service Principal associé à l'application
    $servicePrincipal = Get-AzureADServicePrincipal -Filter "appId eq '$($app.AppId)'"

    # S'assurer que le Service Principal a été trouvé
    if ($servicePrincipal) {

        # Récupérer les owners du Service Principal
        $owners = Get-AzureADServicePrincipalOwner -ObjectId $servicePrincipal.ObjectId

        # Parcourir chaque secret
        foreach ($secret in $secrets) {

            # Récupérer la date d'expiration sous un format lisible
            $expiryDate = $secret.EndDate
            $currentDate = Get-Date

            # Vérifier si le secret expire dans moins de $daysBeforeExpiryWarning jours
            $daysUntilExpiry = [math]::Round(($expiryDate - $currentDate).TotalDays)
            if ($daysUntilExpiry -le $days -and $daysUntilExpiry -ge 0) {
            
                if ($owners) {
                    foreach ($owner in $owners) {
                $obj = [PSCustomObject]@{
                    'OwnerDisplayName' = $owner.DisplayName
                    'OwnerEmail'       = $owner.Mail
                    'ApplicationName'  = $app.DisplayName
                    'ApplicationId'    = $app.AppId
                    'SecretId'         = $secret.KeyId
                    'SecretExpiryDate' = $expiryDate.ToString('yyyy-MM-dd HH:mm:ss')
                    'DaysToExpiry'     = $daysUntilExpiry
                    }
                # Ajouter l'objet à la liste
                $exportData += $obj
                }
               }
            }
        }
    }
}

# Exporter les données dans un fichier CSV
$exportData | Export-Csv -Path $excelPath -NoTypeInformation

$dateNow = Get-Date -Format 'yyyy-MM-dd-HH-mm'

# Confirmation
Write-Host "Export terminé! Les rôles RBAC sont dans les fichiers CSV. Time :" $dateNow