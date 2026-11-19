# WorkHub — Oracle Cloud Infrastructure (OCI) Deployment Guide

This guide is tailored for your existing Oracle Cloud environment where:
* **Nginx and Certbot (SSL) are already installed and active.**
* **Ports 80 & 443 are already open.**
* **Other services are running on ports 3010 & 3011 with existing HTTPS configs.**
* **WorkHub will run on Port 3018 (or above) without interfering with existing apps.**

---

## Architecture Overview

```
                          Internet (HTTPS :443)
                                    │
                                    ▼
                [ Existing Nginx Reverse Proxy with SSL ]
                                    │
    ┌───────────────────────────────┼───────────────────────────────┐
    │                               │                               │
    ▼                               ▼                               ▼
Existing App 1                  Existing App 2                  WorkHub Daily Ops
(Port 3010)                     (Port 3011)                     (Port 3018 via PM2)
                                                                        │
                                                                        ├──► Local SQLite DB (dev.db)
                                                                        └──► /mnt/onedrive (ONEDRIVE_ROOT_PATH)
                                                                                    │
[ Microsoft 365 1TB Cloud ] <════════════════════════════════════════════════ [ Rclone VFS Mount Daemon ]
 (Drawings, Photos, Quotes)                                                    (Streams on-demand, max 1GB cache)
```

---

## Step 1: Clone Your Private GitHub Repository

Because your repository `https://github.com/skding/workhub` is **Private**, use a **Deploy Key** (read-only SSH key):

### 1.1 Generate SSH Key on your Server (if you don't already have one)
```bash
ssh-keygen -t ed25519 -C "workhub-oci-server"
# Press Enter 3 times to accept default path and empty passphrase
```

### 1.2 Display the Public Key
```bash
cat ~/.ssh/id_ed25519.pub
```
*Copy the displayed text (starts with `ssh-ed25519 ...`).*

### 1.3 Add to GitHub
1. Open your repo on GitHub: [https://github.com/skding/workhub](https://github.com/skding/workhub)
2. Go to **Settings** ➔ **Deploy keys** (in the left sidebar).
3. Click **Add deploy key**:
   * **Title:** `Oracle Cloud VM`
   * **Key:** Paste the copied public key.
   * Leave "Allow write access" **unchecked** (read-only is safer).
4. Click **Add key**.

### 1.4 Clone WorkHub into `/var/www`
```bash
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www
cd /var/www

git clone git@github.com:skding/workhub.git
cd workhub
```

---

## Step 2: Configure Environment & Run WorkHub on Port 3018

### 2.1 Create `.env` file
```bash
nano .env
```
Paste the following (configured for **Port 3018**):
```env
# Application Environment
NODE_ENV=production
PORT=3018

# SQLite Database
DATABASE_URL="file:./dev.db"

# Security key for JWT session tokens (generate any random 32+ character string)
JWT_SECRET=workhub_pnc_secret_key_oracle_cloud_2026_super_secure

# Point WorkHub to Rclone's OneDrive Mount Point
ONEDRIVE_ROOT_PATH=/mnt/onedrive
```
*(Press `Ctrl + O` then `Enter` to save, and `Ctrl + X` to exit).*

### 2.2 Install Dependencies & Build WorkHub
```bash
npm install

# Initialize SQLite database with Prisma
npx prisma generate
npx prisma db push

# Seed master components and hardware packages
npx tsx prisma/seed-components.ts

# (Optional) Seed sample admin account & test clients if starting fresh:
# npx tsx prisma/seed.ts

# Build Next.js production bundle
npm run build
```

### 2.3 Start WorkHub on Port 3018 with PM2
```bash
# Start on port 3018 alongside your 3010 and 3011 apps
pm2 start npm --name "workhub" -- start -- -p 3018

# Save PM2 process list so it starts automatically on reboot
pm2 save
```

Verify that WorkHub is running locally on port 3018:
```bash
curl -I http://127.0.0.1:3018/login
# Should return HTTP/1.1 200 OK
```

---

## Step 3: Install & Configure Rclone for Your 1TB OneDrive

Rclone provides a **Virtual On-Demand Filesystem (VFS)**. It does **not** download all 1TB of files to your server hard drive. It only streams files on-demand with a strict 1GB local cache.

### 3.1 Install Rclone & FUSE3
```bash
# Install FUSE3 (required by Rclone mount)
# For Ubuntu / Debian:
sudo apt-get update && sudo apt-get install -y fuse3

# (Or if using Oracle Linux / RHEL):
# sudo dnf install -y fuse3 fuse

# Install Rclone
sudo -v ; curl https://rclone.org/install.sh | sudo bash
```

### 3.2 Create the Mount Directory
```bash
sudo mkdir -p /mnt/onedrive
sudo chown -R $USER:$USER /mnt/onedrive
```

### 3.3 Authorize Your Personal Microsoft 365 Account
Because your cloud server does not have a web browser, use Rclone's headless authorization:

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

### 3.4 Configure Rclone Auto-Mount as a Systemd Service
Create a background service so OneDrive stays mounted permanently across reboots:

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
ExecStop=/usr/bin/fusermount3 -u -z /mnt/onedrive
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

## Step 4: Configure Existing Nginx for WorkHub & HTTPS

Since you **already have Nginx running** with apps on port 3010 and 3011, **do NOT delete your existing configs**. 

You have two clean options to add WorkHub:

---

### Option A: Subdomain (Recommended — e.g. `workhub.yourdomain.com`)
This gives WorkHub its own dedicated URL and SSL certificate without touching your existing apps on 3010/3011.

1. Add a **DNS A Record** in your domain registrar:
   * **Host / Name:** `workhub` (or `ops`)
   * **Points to:** Your Oracle Cloud Public IP

2. Create a new site config in Nginx:
   ```bash
   sudo nano /etc/nginx/sites-available/workhub.conf
   ```

   Paste the following:
   ```nginx
   server {
       listen 80;
       server_name workhub.yourdomain.com; # Replace with your subdomain

       client_max_body_size 100M; # For large CAD drawings and site photos

       location / {
           proxy_pass http://127.0.0.1:3018;
           proxy_http_version 1.1;

           # WebSocket support
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";

           # Proxy headers
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;

           # Timeouts for large uploads
           proxy_connect_timeout 120s;
           proxy_send_timeout 120s;
           proxy_read_timeout 120s;
       }
   }
   ```

3. Enable the site and test configuration:
   ```bash
   sudo ln -s /etc/nginx/sites-available/workhub.conf /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

4. Issue free SSL certificate using Certbot:
   ```bash
   sudo certbot --nginx -d workhub.yourdomain.com
   ```
   *Certbot will automatically add the SSL certificates and configure HTTPS redirects without affecting your 3010/3011 apps.*

---

### Option B: Subpath on Existing Domain (e.g. `https://yourdomain.com/workhub`)
If you prefer not to create a new subdomain and want WorkHub accessible on your existing domain under `/workhub/`:

Edit your existing Nginx config (the one handling 3010/3011):
```bash
sudo nano /etc/nginx/sites-available/your-existing-config
```

Inside the existing `server { ... }` block that already has SSL configured, add this location block:

```nginx
    # Route for WorkHub on Port 3018
    location /workhub/ {
        proxy_pass http://127.0.0.1:3018/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        client_max_body_size 100M;
    }
```

Test and reload Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## Step 5: Updating & Maintenance

Whenever you push new updates from your development machine to GitHub, update your cloud instance with:

```bash
cd /var/www/workhub
git pull origin main
npm install
npx prisma generate
npx prisma db push
npm run build
pm2 restart workhub
```

### Useful Management Commands:
```bash
# Check status of all your apps (3010, 3011, and 3018)
pm2 status

# View WorkHub live logs
pm2 logs workhub

# Check Rclone 1TB OneDrive status
sudo systemctl status rclone-onedrive
ls -l /mnt/onedrive/WorkHub
```
