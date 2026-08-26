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
- **Responsive Design**: Modern UI themed after NASA's design tokens.

## Prerequisites

- Python 3.10+
- Django 6.0+

## Setup Instructions

Choose one of the following methods to set up your development environment.

### Option 1: Using `venv` (Standard Python)

1. **Clone the repository**:
   ```bash
   git clone git@github.com:NASA-EarthRISE/earthrise-toolkit_webmap-sampler.git
   cd earthrise-toolkit_webmap-sampler
   ```

2. **Create a virtual environment**:
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment**:
   - **Windows**:
     ```powershell
     .\venv\Scripts\activate
     ```
   - **macOS/Linux**:
     ```bash
     source venv/bin/activate
     ```

4. **Install dependencies**:
   ```bash
   pip install django
   ```
   
5. **Install front-end dependencies**

```bash
npm install @nasa-hds/core @uswds/uswds
```

### Option 2: Using `conda`

1. **Clone the repository**:
   ```bash
   git clone git@github.com:NASA-EarthRISE/earthrise-toolkit_webmap-sampler.git
   cd earthrise-toolkit_webmap-sampler
   ```

2. **Create a conda environment**:
   ```bash
   conda create -n webmap-sampler python=3.13
   ```

3. **Activate the environment**:
   ```bash
   conda activate webmap-sampler
   ```

4. **Install dependencies**:
   ```bash
   conda install django
   ```
   
5. **Install front-end dependencies**

```bash
npm install @nasa-hds/core @uswds/uswds
```

## Running the Application

Once your environment is set up and dependencies are installed:

1. **Apply migrations**:
   ```bash
   python manage.py migrate
   ```

2. **Start the development server**:
   ```bash
   python manage.py runserver
   ```

3. **Access the app**:
   Open your browser and navigate to `http://127.0.0.1:8000/`

## Project Structure

- `webmap_sampler/`: Project configuration and settings.
- `web_ui/`: Main application logic and views.
- `templates/`: HTML templates (including the main NASA-themed dashboard).
- `manage.py`: Django management script.

## Acknowledgments

- Data provided by [NASA GIBS](https://earthdata.nasa.gov/eosdis/science-system-pt/gibs).
- Analysis powered by [SERVIR ClimateSERV](https://climateserv.servirglobal.net/).
