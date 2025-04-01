# Configuration
# Replace this address with a valid one in your Azure AD tenant
$sender = ""
$recipient = ""
$cc = "" # Leave empty to not add CC

# Connect to Azure with managed identity
Write-Output "Connecting to Azure with managed identity..."
Connect-AzAccount -Identity

# Get token for Microsoft Graph API
Write-Output "Getting token for Microsoft Graph API..."
try {
    $graphToken = Get-AzAccessToken -ResourceUrl "https://graph.microsoft.com"
    $accessToken = $graphToken.Token
    Write-Output "Token successfully obtained"
}
catch {
    Write-Error "Unable to get token: $_"
    exit 1
}

# Build the message body
$params = @{
    Message = @{
        Subject = "Test email via Microsoft Graph API"
        Body = @{
            ContentType = "Text"
            Content = "This is a test email sent via Microsoft Graph API from PowerShell."
        }
        ToRecipients = @(
            @{
                EmailAddress = @{
                    Address = $recipient
                }
            }
        )
    }
    SaveToSentItems = "false"
}

# Add CC recipient if specified
if (-not [string]::IsNullOrWhiteSpace($cc)) {
    $params.Message.CcRecipients = @(
        @{
            EmailAddress = @{
                Address = $cc
            }
        }
    )
}

# Convert to JSON
$jsonBody = $params | ConvertTo-Json -Depth 4

# Send email via Microsoft Graph API
Write-Output "Sending email to $recipient..."
$sendMailUrl = "https://graph.microsoft.com/v1.0/users/$sender/sendMail"
$headers = @{
    "Authorization" = "Bearer $accessToken"
    "Content-Type" = "application/json"
}

try {
    Invoke-RestMethod -Uri $sendMailUrl -Headers $headers -Method Post -Body $jsonBody
    Write-Output "Email successfully sent to: $recipient"
}
catch {
    Write-Error "Error sending email: $_"
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Error "HTTP Code: $statusCode"
        
        # Try to get error details if possible
        if ($_.ErrorDetails -and $_.ErrorDetails.Message) {
            Write-Error "Details: $($_.ErrorDetails.Message)"
        }
    }
}