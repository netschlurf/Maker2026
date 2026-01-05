#!/bin/bash

# SSL Certificate Generator für ngiworks
# Erstellt professionelle SSL-Zertifikate für Development und Production

SSL_DIR="./ssl"
DOMAIN="ngiworks.local"
KEY_FILE="ngiworks-key.pem"
CERT_FILE="ngiworks-cert.pem"
CONFIG_FILE="ngiworks-ssl.conf"

echo "🔐 Generating SSL certificates for ngiworks..."

# Create SSL directory
mkdir -p "$SSL_DIR"

# Create OpenSSL config file
cat > "$SSL_DIR/$CONFIG_FILE" << EOF
[req]
default_bits = 4096
prompt = no
distinguished_name = req_distinguished_name
req_extensions = v3_req

[req_distinguished_name]
C = DE
ST = North Rhine-Westphalia
L = Düsseldorf
O = ngiworks GmbH
OU = TotalHedge Division
CN = ngiworks.com
emailAddress = admin@ngiworks.com

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = ngiworks.local
DNS.3 = ngiworks.com
DNS.4 = www.ngiworks.com
DNS.5 = totalhedge.ngiworks.com
IP.1 = 127.0.0.1
IP.2 = ::1
EOF

# Generate private key
echo "🔑 Generating private key..."
openssl genrsa -out "$SSL_DIR/$KEY_FILE" 4096

# Generate certificate
echo "📜 Generating certificate..."
openssl req -new -x509 -key "$SSL_DIR/$KEY_FILE" -out "$SSL_DIR/$CERT_FILE" -days 365 -config "$SSL_DIR/$CONFIG_FILE" -extensions v3_req

# Set appropriate permissions
chmod 600 "$SSL_DIR/$KEY_FILE"
chmod 644 "$SSL_DIR/$CERT_FILE"

echo "✅ SSL certificates generated successfully!"
echo ""
echo "📁 Files created:"
echo "   🔑 Private Key: $SSL_DIR/$KEY_FILE"
echo "   📜 Certificate: $SSL_DIR/$CERT_FILE"
echo "   ⚙️  Config:     $SSL_DIR/$CONFIG_FILE"
echo ""
echo "🌐 Domains covered:"
echo "   - localhost"
echo "   - ngiworks.local"
echo "   - ngiworks.com"
echo "   - www.ngiworks.com"
echo "   - totalhedge.ngiworks.com"
echo ""
echo "🚀 Ready to start ngiworks server with HTTPS!"

# Verify certificate
echo "🔍 Certificate verification:"
openssl x509 -in "$SSL_DIR/$CERT_FILE" -text -noout | grep -A1 "Subject:"
openssl x509 -in "$SSL_DIR/$CERT_FILE" -text -noout | grep -A10 "Subject Alternative Name:"