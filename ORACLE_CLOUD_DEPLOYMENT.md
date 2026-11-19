# WorkHub — Oracle Cloud Infrastructure (OCI) Deployment Guide

This guide walks you through deploying **WorkHub** on an **Oracle Cloud Ubuntu Compute Instance** with:
1. **GitHub Deploy Key** (securely cloning your private repository)
2. **Node.js, Prisma, and PM2** (running WorkHub 24/7)
3. **Rclone Virtual Mount** (zero-disk-waste on-demand sync with your 1TB Personal Microsoft 365 OneDrive)
4. **Nginx Reverse Proxy with HTTPS** (Free Let's Encrypt SSL certificate)

---

## Architecture Overview

```
Internet (HTTPS :443)
       │
       ▼
 [ Nginx Reverse Proxy & SSL ]
       │
       ├──► Proxy localhost:3000 ──► [ WorkHub Next.js Node Process (PM2) ]
       │                                     │
       │                                     ├──► Local SQLite DB (dev.db)
       │                                     └──► /mnt/onedrive (ONEDRIVE_ROOT_PATH)
       │                                                 │
       ▼                                                 ▼
[ Microsoft 365 1TB Cloud ] <═════════════════ [ Rclone VFS Mount Daemon ]
 (Drawings, Photos, Quotes)                     (Streams on-demand, max 1GB cache)
```

---

## Step 1: Oracle Cloud Firewall & Network Configuration

Oracle Cloud requires opening ports in **both** the OCI Web Console and the Ubuntu virtual machine firewall.

### 1.1 In OCI Web Console
1. Navigate to **Networking** ➔ **Virtual Cloud Networks (VCN)**.
2. Click your VCN ➔ Click **Security Lists** ➔ Click **Default Security List for...**.
3. Under **Ingress Rules**, click **Add Ingress Rules**:
   * **Source CIDR:** `0.0.0.0/0`
   * **IP Protocol:** `TCP`
   * **Destination Port Range:** `80, 443`
   * **Description:** `HTTP and HTTPS for WorkHub`
4. Click **Add Ingress Rules**.

### 1.2 In the Ubuntu Server Terminal (Crucial for Oracle Cloud)
Oracle Cloud Ubuntu images include strict default `iptables` rules. Run these commands to open ports 80 and 443:

```bash
# Allow HTTP (80) and HTTPS (443)
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT

# Save iptables rules so they persist across server reboots
sudo apt update && sudo apt install -y iptables-persistent
sudo netfilter-persistent save
sudo netfilter-persistent reload
```

---

## Step 2: Install Node.js 22 LTS & PM2

```bash
# Install Node.js 22 LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs git build-essential

# Verify versions
node -v   # Should be v22.x
npm -v

# Install PM2 globally to keep the app running forever
sudo npm install -g pm2
```

---

## Step 3: Clone Your Private GitHub Repository

Because your repository `https://github.com/skding/workhub` is **Private**, use a **Deploy Key** (read-only SSH key):

### 3.1 Generate SSH Key on your Server
```bash
ssh-keygen -t ed25519 -C "workhub-oci-server"
# Press Enter 3 times to accept default path and empty passphrase
```

### 3.2 Display the Public Key
```bash
cat ~/.ssh/id_ed25519.pub
```
*Copy the displayed output (starts with `ssh-ed25519 ...`).*

### 3.3 Add to GitHub
1. Open your repo on GitHub: [https://github.com/skding/workhub](https://github.com/skding/workhub)
2. Go to **Settings** ➔ **Deploy keys** (in the left sidebar).
3. Click **Add deploy key**:
   * **Title:** `Oracle Cloud VM`
   * **Key:** Paste the copied public key.
   * Leave "Allow write access" **unchecked** (read-only is safer).
4. Click **Add key**.

### 3.4 Clone WorkHub
```bash
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www
cd /var/www

git clone git@github.com:skding/workhub.git
cd workhub
```

---

## Step 4: Configure Environment & Build WorkHub

### 4.1 Create Environment File
```bash
nano .env
```
Paste the following:
```env
# Application Environment
NODE_ENV=production
PORT=3000

# Security key for JWT session tokens (generate a random 32+ character string)
JWT_SECRET=workhub_oci_production_super_secret_pnc_key_2026_secure

# Point WorkHub to Rclone's OneDrive Mount Point
ONEDRIVE_ROOT_PATH=/mnt/onedrive
```
*(Press `Ctrl + O` then `Enter` to save, and `Ctrl + X` to exit).*

### 4.2 Install Dependencies & Seed Database
```bash
npm install

# Initialize SQLite database with Prisma
npx prisma generate
npx prisma db push

# Seed master components and hardware packages
npx tsx prisma/seed-components.ts

# (Optional) Seed sample admin account & test clients:
# npx tsx prisma/seed.ts

# Build Next.js production bundle
npm run build
```

### 4.3 Start with PM2
```bash
pm2 start npm --name "workhub" -- start -- -p 3000

# Configure PM2 to start automatically on system reboot
pm2 startup
# (Run the command PM2 prints on your terminal)
pm2 save
```

Verify that WorkHub is running locally on port 3000:
```bash
curl -I http://127.0.0.1:3000/login
# Should return HTTP/1.1 200 OK
```

---

## Step 5: Install & Configure Rclone for 1TB Microsoft 365 OneDrive

Rclone provides a **Virtual On-Demand Filesystem (VFS)**. It does **not** download all 1TB of files to your server hard drive. It only streams files on-demand with a strict 1GB local cache.

### 5.1 Install Rclone
```bash
sudo -v ; curl https://rclone.org/install.sh | sudo bash
```

### 5.2 Create the Mount Directory
```bash
sudo mkdir -p /mnt/onedrive
sudo chown -R $USER:$USER /mnt/onedrive
```

### 5.3 Authorize Your Personal Microsoft 365 Account
Because your cloud server does not have a web browser, use Rclone's standard headless authentication:

1. **On your local PC (Windows)**:
   * Open PowerShell and run:
     ```powershell
     rclone authorize "onedrive"
     ```
   * A browser tab will open. Log in to your personal Microsoft account and approve access.
   * PowerShell will print an authorization code block starting with:
     `{"access_token":"...","refresh_token":"...","expiry":"..."}`
   * Copy that token text.

2. **On your Oracle Cloud Server**:
   Run the interactive configuration:
   ```bash
   rclone config
   ```
   * Type `n` (New remote)
   * Name: `onedrive`
   * Storage type: `onedrive` (or find the number for Microsoft OneDrive)
   * `client_id`: *(leave blank, press Enter)*
   * `client_secret`: *(leave blank, press Enter)*
   * Edit advanced config: `n`
   * Use auto config: `n` *(since you are on a remote machine)*
   * `result`: **Paste the JSON token copied from your PC.**
   * Choose drive type: `1` (OneDrive Personal or Business)
   * Confirm the drive: `y`
   * Confirm remote: `y`
   * Quit: `q`

3. **Test the Connection**:
   ```bash
   rclone lsd onedrive:
   # Should list your OneDrive folders (e.g. WorkHub, Documents, etc.)
   ```

### 5.4 Configure Rclone Auto-Mount as a Systemd Service
Create a background service so OneDrive stays mounted permanently:

```bash
sudo nano /etc/systemd/system/rclone-onedrive.service
```

Paste the following service definition:
```ini
[Unit]
Description=Rclone Mount for 1TB Microsoft 365 OneDrive
After=network-online.target
Wants=network-online.target

[Service]
Type=notify
User=ubuntu
ExecStart=/usr/bin/rclone mount onedrive: /mnt/onedrive \
  --config=/home/ubuntu/.config/rclone/rclone.conf \
  --vfs-cache-mode writes \
  --vfs-cache-max-size 1G \
  --vfs-cache-max-age 1h \
  --allow-other \
  --buffer-size 16M \
  --dir-cache-time 30s \
  --umask 002
ExecStop=/bin/fusermount -u -z /mnt/onedrive
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable fuse and start the service:
```bash
# Allow non-root users to mount fuse drives
sudo sed -i 's/#user_allow_other/user_allow_other/' /etc/fuse.conf

# Start and enable the service
sudo systemctl daemon-reload
sudo systemctl enable rclone-onedrive
sudo systemctl start rclone-onedrive

# Verify mount status
systemctl status rclone-onedrive
ls -l /mnt/onedrive
```

---

## Step 6: Configure Nginx & Free SSL (HTTPS)

### 6.1 Install Nginx
```bash
sudo apt install -y nginx
```

### 6.2 Create Nginx Configuration
Replace `workhub.yourdomain.com` with your domain (or server public IP):

```bash
sudo nano /etc/nginx/sites-available/workhub
```

Paste the following configuration:
```nginx
server {
    listen 80;
    server_name workhub.yourdomain.com; # Replace with your domain or Public IP

    # Allow large uploads for CAD files, high-res photos, and drawings (up to 100MB)
    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        # WebSocket / HMR support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts for large file transfers
        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
    }
}
```

Enable the configuration and reload Nginx:
```bash
# Remove default Nginx welcome page
sudo rm -f /etc/nginx/sites-enabled/default

# Enable workhub
sudo ln -s /etc/nginx/sites-available/workhub /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Step 7: Enable HTTPS with Free Let's Encrypt SSL

1. Ensure your domain's **DNS A Record** points to your **Oracle Cloud Instance Public IP**.
2. Install Certbot and obtain the SSL certificate:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d workhub.yourdomain.com
```

Certbot will automatically modify your Nginx configuration, install the SSL certificate, and set up automatic renewal via systemd timer.

---

## Step 8: Useful Maintenance Commands

```bash
# Check WorkHub application logs
pm2 logs workhub

# Restart WorkHub after pulling updates from git
cd /var/www/workhub
git pull
npm install
npx prisma generate
npx prisma db push
npm run build
pm2 restart workhub

# Check Rclone OneDrive sync status
sudo systemctl status rclone-onedrive

# Test Nginx configuration and reload
sudo nginx -t
sudo systemctl reload nginx
```
