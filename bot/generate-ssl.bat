@echo off
REM SSL Certificate Generator für ngiworks (Windows)
REM Erstellt professionelle SSL-Zertifikate für Development und Production

set SSL_DIR=.\ssl
set DOMAIN=ngiworks.local
set KEY_FILE=ngiworks-key.pem
set CERT_FILE=ngiworks-cert.pem
set CONFIG_FILE=ngiworks-ssl.conf

echo 🔐 Generating SSL certificates for ngiworks...

REM Create SSL directory
if not exist "%SSL_DIR%" mkdir "%SSL_DIR%"

REM Create OpenSSL config file
(
echo [req]
echo default_bits = 4096
echo prompt = no
echo distinguished_name = req_distinguished_name
echo req_extensions = v3_req
echo.
echo [req_distinguished_name]
echo C = DE
echo ST = North Rhine-Westphalia
echo L = Düsseldorf
echo O = ngiworks GmbH
echo OU = TotalHedge Division
echo CN = ngiworks.com
echo emailAddress = admin@ngiworks.com
echo.
echo [v3_req]
echo keyUsage = keyEncipherment, dataEncipherment
echo extendedKeyUsage = serverAuth
echo subjectAltName = @alt_names
echo.
echo [alt_names]
echo DNS.1 = localhost
echo DNS.2 = ngiworks.local
echo DNS.3 = ngiworks.com
echo DNS.4 = www.ngiworks.com
echo DNS.5 = totalhedge.ngiworks.com
echo IP.1 = 127.0.0.1
echo IP.2 = ::1
) > "%SSL_DIR%\%CONFIG_FILE%"

REM Check if OpenSSL is available
where openssl >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ OpenSSL not found in PATH
    echo 💡 Please install OpenSSL or use Windows Subsystem for Linux
    echo 📥 Download from: https://slproweb.com/products/Win32OpenSSL.html
    pause
    exit /b 1
)

REM Generate private key
echo 🔑 Generating private key...
openssl genrsa -out "%SSL_DIR%\%KEY_FILE%" 4096

REM Generate certificate
echo 📜 Generating certificate...
openssl req -new -x509 -key "%SSL_DIR%\%KEY_FILE%" -out "%SSL_DIR%\%CERT_FILE%" -days 365 -config "%SSL_DIR%\%CONFIG_FILE%" -extensions v3_req

echo.
echo ✅ SSL certificates generated successfully!
echo.
echo 📁 Files created:
echo    🔑 Private Key: %SSL_DIR%\%KEY_FILE%
echo    📜 Certificate: %SSL_DIR%\%CERT_FILE%
echo    ⚙️  Config:     %SSL_DIR%\%CONFIG_FILE%
echo.
echo 🌐 Domains covered:
echo    - localhost
echo    - ngiworks.local
echo    - ngiworks.com
echo    - www.ngiworks.com
echo    - totalhedge.ngiworks.com
echo.
echo 🚀 Ready to start ngiworks server with HTTPS!
echo.

REM Verify certificate
echo 🔍 Certificate verification:
openssl x509 -in "%SSL_DIR%\%CERT_FILE%" -text -noout | findstr "Subject:"

pause