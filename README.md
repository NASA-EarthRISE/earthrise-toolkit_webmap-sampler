# EarthRISE Webmap Sampler

[![Python: 3.13](https://img.shields.io/badge/python-3.13-blue.svg)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![EarthRISE: Development](https://img.shields.io/badge/EarthRISE-Development-b50000?labelColor=191f4c)](https://science.nasa.gov/earth-science/earth-action/earthrise/)

EarthRISE Webmap Sampler is a Django-based web application designed to visualize and analyze data using NASA's GIBS (Global Imagery Browse Services) and ClimateSERV API. The application provides an interactive map interface for monitoring atmospheric parameters over time.

## Features

- **Interactive Map**: Powered by Leaflet.js with support for multiple basemaps (NASA Blue Marble, OSM, MODIS).
- **Temporal Analysis**: Timeline controls to browse historical data from 2015 to 2024.
- **Layer Management**: Toggle and adjust opacity for various atmospheric layers like CO (Carbon Monoxide) and Aerosol Index.
- **Data Analysis**: Integrated ClimateSERV API to perform spatial and temporal analysis on user-defined Areas of Interest (AOI).
- **Responsive Design**: UI built on NASA HDS and USWDS design systems.

## Tech Stack

| Layer | Technology |
|---|---|
| Language | Python 3.13 |
| Framework | Django 6.0 |
| Database | SQLite |
| Design system | NASA HDS (`@nasa-hds/core`), USWDS (`@uswds/uswds`) |
| Config | python-decouple |
| WSGI server | Gunicorn + gevent |

## Prerequisites

- Python 3.13+
- Node.js / npm (for HDS and USWDS front-end assets)

## Getting Started

1. **Clone the repository**

   ```bash
   git clone https://github.com/NASA-EarthRISE/earthrise-toolkit_webmap-sampler
   cd earthrise-toolkit_webmap-sampler
   ```

2. **Create and activate a virtual environment**

   ```bash
   python -m venv .venv
   # macOS / Linux
   source .venv/bin/activate
   # Windows
   .venv\Scripts\activate
   ```

3. **Install Python dependencies**

   ```bash
   pip install -r requirements.txt
   ```

4. **Install front-end dependencies**

   ```bash
   npm install
   ```

5. **Configure the environment**

   Create a `.env` file in the project root. The following defaults work for local development:

   ```
   SECRET_KEY=django-insecure-local-dev-key
   DEBUG=True
   ALLOWED_HOSTS=localhost,127.0.0.1
   ```

6. **Apply migrations**

   ```bash
   python manage.py migrate
   ```

7. **Create the cache table**

   ```bash
   python manage.py createcachetable
   ```

8. **Collect static files**

   ```bash
   python manage.py collectstatic --no-input
   ```

9. **Run the development server**

   ```bash
   python manage.py runserver
   ```

10. Open `http://127.0.0.1:8000/` in your browser.

## Environment Variables

All runtime configuration is read from a `.env` file in the project root (via python-decouple). The file is excluded from version control — never commit it.

| Variable | Required | Default | Description |
|---|---|---|---|
| `SECRET_KEY` | Yes | *(insecure default)* | Django secret key. Generate a strong random value for production. |
| `DEBUG` | No | `True` | Set to `False` in production. |
| `ALLOWED_HOSTS` | No | *(empty)* | Comma-separated list of hostnames Django will serve. |
| `CSRF_TRUSTED_ORIGINS` | No | *(empty)* | Comma-separated full origins trusted for CSRF (e.g. `https://example.com`). |
| `SCRIPT_NAME` | No | *(empty)* | Sub-path prefix for reverse proxy deployments (e.g. `/webmap-sampler`). See [Production Notes](#production-notes). |
| `RESPONSIBLE_NASA_OFFICIAL` | No | `TBD` | Name shown in the page footer. |
| `SITE_EDITOR` | No | `TBD` | Site editor contact shown in the page footer. |
| `SITE_LAST_UPDATED` | No | *(empty)* | Last-updated date shown in the page footer. |

## URL Reference

| URL | Description |
|---|---|
| `/` | Home — interactive map |
| `/admin/` | Django admin (staff only) |

## Server Deployment

These steps assume the application is installed at `/earthrise_apps/earthrise-toolkit_webmap-sampler` and served at `/webmap-sampler/` behind nginx on the earthrise-internal server.

### 1. Clone and set up the environment

```bash
cd /earthrise_apps
git clone https://github.com/NASA-EarthRISE/earthrise-toolkit_webmap-sampler
cd earthrise-toolkit_webmap-sampler
conda create -n webmap-sampler python=3.13
conda activate webmap-sampler
pip install -r requirements.txt
npm install
```

### 2. Configure the environment

Create a `.env` file in the project root and set production values:

```
SECRET_KEY=<strong-random-key>
DEBUG=False
ALLOWED_HOSTS=earthrise-internal.sciencecloud.nasa.gov
CSRF_TRUSTED_ORIGINS=https://earthrise-internal.sciencecloud.nasa.gov
SCRIPT_NAME=/webmap-sampler
RESPONSIBLE_NASA_OFFICIAL="Your Name"
SITE_EDITOR="Your Name"
SITE_LAST_UPDATED="2026-01-01"
```

### 3. Prepare the application

```bash
python manage.py migrate
python manage.py collectstatic --no-input
python manage.py createcachetable
python manage.py refresh_nasa_nav
```

### 4. Hand ownership to nginx

```bash
sudo chown -R nginx /earthrise_apps/earthrise-toolkit_webmap-sampler
```

### 5. Install and enable the systemd service

```bash
sudo cp webmap-sampler.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable webmap-sampler
sudo systemctl start webmap-sampler
```

Verify it is running:

```bash
sudo systemctl status webmap-sampler
```

### 6. Update nginx

Add the location blocks from `sample_nginx.conf` to the active server config, then reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Updating the application

```bash
sudo chown -R $USER /earthrise_apps/earthrise-toolkit_webmap-sampler
cd /earthrise_apps/earthrise-toolkit_webmap-sampler
git pull
conda activate webmap-sampler
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --no-input
sudo chown -R nginx /earthrise_apps/earthrise-toolkit_webmap-sampler
sudo systemctl restart webmap-sampler
sudo systemctl reload nginx
```

---

## Production Notes

Before deploying to production, configure your `.env` with the following:

- **`SECRET_KEY`** — generate a strong random key:
  ```bash
  python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
  ```
- **`DEBUG=False`** — never run with debug enabled in production.
- **`ALLOWED_HOSTS`** — set to your server's hostname(s).
- **`CSRF_TRUSTED_ORIGINS`** — add your production domain(s).

**Static files** — collect static assets before first run and after every update:

```bash
python manage.py collectstatic --no-input
```

nginx serves `staticfiles/` directly; gunicorn never handles static requests.

**Cache table** — the application uses Django's database cache backend to share the NASA global nav across all Gunicorn workers. The cache table must be created once after the first deploy (and again if the database is reset):

```bash
python manage.py createcachetable
python manage.py refresh_nasa_nav
```

**Sub-path deployment** — the application is served under the `/webmap-sampler` prefix. Set `SCRIPT_NAME` in `.env`:

```
SCRIPT_NAME=/webmap-sampler
```

`FORCE_SCRIPT_NAME` is set automatically from this value, so Django URL reversals and static URL generation all include the prefix.

## Project Structure

- `map_sampler/`: Project configuration and settings.
- `web_ui/`: Main application logic and views.
- `templates/`: HTML templates (including the main NASA-themed dashboard).
- `manage.py`: Django management script.

## Acknowledgments

- Data provided by [NASA GIBS](https://earthdata.nasa.gov/eosdis/science-system-pt/gibs).
- Analysis powered by [SERVIR ClimateSERV](https://climateserv.servirglobal.net/).

## License and Distribution

EarthRISE Webmap Sampler is distributed by EarthRISE under the terms of the GPLv3 License. See
[LICENSE](https://github.com/NASA-EarthRISE/earthrise-toolkit_webmap-sampler/blob/main/LICENSE) in this directory for more information.
