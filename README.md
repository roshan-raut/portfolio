# Personal Portfolio - GitHub Style

A Jekyll-based personal portfolio website styled like a GitHub profile page.

## Features

- **Overview Page**: Profile summary, skills, popular projects, achievements, and GitHub statistics
- **Blogs Page**: List of blog posts with tags and featured posts
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
│   ├── blogs.yml            # Blog posts data
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

Edit `_data/blogs.yml` to add blog posts:
```yaml
- title: "Blog Post Title"
  excerpt: "Short description"
  date: 2026-01-14
  author: "Your Name"
  tags:
    - tag1
    - tag2
  featured: true
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

- [ ] Blog post pages (individual blog post content)
- [ ] Search functionality
- [ ] Dark mode toggle
- [ ] Activity/contribution graph
- [ ] Contact form
- [ ] Comments system
- [ ] RSS feed

## License

MIT License - Feel free to use this template for your own portfolio!

## Author

Roshan Raut
- GitHub: [@roshan-raut](https://github.com/roshan-raut)
