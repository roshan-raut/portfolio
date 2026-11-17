# Personal Portfolio

A Jekyll-based portfolio and AI-infrastructure blog: dark/light themes, ⌘K command palette, RSS, SEO tags.

## Features

- **Overview Page**: Profile summary, skills, popular projects, achievements, and GitHub statistics
- **Writing Page**: Searchable, tag-filterable posts; each post has its own page with TOC, reading time, series nav and copy-code buttons
- **Projects Page**: Complete list of projects with technologies and links
- **Useful Links Page**: Curated resources organized by category
- **CV Page**: Professional resume with downloadable PDF versions

## Structure

```
portfolio/
├── _config.yml              # Jekyll configuration
├── _data/                   # YAML data files
│   ├── profile.yml          # Your profile information
│   ├── projects.yml         # Projects data
│   └── links.yml            # Useful links data
├── _layouts/
│   └── default.html         # Main layout template
├── assets/
│   ├── css/
│   │   └── style.css        # GitHub-style CSS
│   ├── images/
│   │   └── Photo.jpg        # Your profile photo
│   └── pdf/
│       ├── Roshan-Raut-Resume.pdf
│       └── Profile.pdf
├── index.html               # Overview page
├── blogs.html               # Blogs page
├── projects.html            # Projects page
├── links.html               # Links page
└── cv.html                  # CV page
```

## Setup Instructions

### Prerequisites

- Ruby (2.7 or higher)
- Jekyll
- Bundler

### Installation

1. Install Ruby (if not already installed):
   - Windows: Download from https://rubyinstaller.org/
   - Mac: `brew install ruby`
   - Linux: `sudo apt-get install ruby-full`

2. Install Jekyll and Bundler:
   ```powershell
   gem install jekyll bundler
   ```

3. Navigate to the project directory:
   ```powershell
   cd C:\Users\r.raut\Downloads\roshan\portfolio
   ```

4. Install dependencies:
   ```powershell
   bundle install
   ```

5. Build and serve the site locally:
   ```powershell
   bundle exec jekyll serve
   ```

6. Open your browser and visit: `http://localhost:4000/portfolio`

## Customization

### Update Your Profile Information

Edit `_data/profile.yml` to update:
- Name, username, and bio
- Contact information
- Skills and technologies
- Achievements
- GitHub statistics

### Add/Edit Projects

Edit `_data/projects.yml` to add or modify projects:
```yaml
- name: "Project Name"
  description: "Project description"
  language: "Python"
  stars: 0
  forks: 0
  url: "https://github.com/username/repo"
  topics:
    - tag1
    - tag2
  featured: true
```

### Add Blog Posts

Drop a Markdown file into `_blogs/` — that's it. The writing page, search (⌘K), RSS feed and series navigation pick it up automatically.

```yaml
---
title: "My new post"
date: 2026-12-01
summary: "One-line summary shown on cards and in search."
tags: [ai, llm]
# optional
series: "Infra for AI"   # groups posts with prev/next navigation
part: 11
short: "Sidebar title"
updated: 2026-12-05
---
```

### Update Useful Links

Edit `_data/links.yml` to organize your favorite resources by category.

### Replace Profile Photo

Replace `assets/images/Photo.jpg` with your own photo.

### Update Resume/CV

Replace the PDF files in `assets/pdf/` with your updated resume and profile.

## Deployment

### GitHub Pages (Automated with GitHub Actions)

1. **Push your code to GitHub**:
   ```powershell
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Enable GitHub Pages**:
   - Go to your repository on GitHub
   - Navigate to **Settings** → **Pages**
   - Under **Source**, select **GitHub Actions**
   - The workflow will automatically build and deploy your site

3. **Access your site**:
   - For project repository: `https://username.github.io/repository-name`
   - For user/organization repository (`username.github.io`): `https://username.github.io`

4. **Update baseurl in _config.yml**:
   - For project page: `baseurl: "/repository-name"`
   - For user/organization page: `baseurl: ""`

The GitHub Actions workflow (`.github/workflows/jekyll.yml`) will:
- Automatically trigger on every push to the `main` branch
- Build your Jekyll site
- Deploy it to GitHub Pages
- Handle the baseurl automatically

## Technologies Used

- Jekyll (Static Site Generator)
- HTML5
- CSS3 (GitHub-style design)
- YAML (Data storage)
- Font Awesome (Icons)

## Features to Add

- [ ] Activity/contribution graph
- [ ] Contact form
- [ ] Comments system

## License

MIT License - Feel free to use this template for your own portfolio!

## Author

Roshan Raut
- GitHub: [@roshan-raut](https://github.com/roshan-raut)
