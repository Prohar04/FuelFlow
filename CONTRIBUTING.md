# 🤝 Contributing to FuelFlow

Thank you for your interest in contributing to FuelFlow! This guide will help you get started.

---

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)

---

## Getting Started

### 1. Fork the Repository
```bash
# Go to GitHub and click "Fork"
# Clone your fork
git clone https://github.com/yourusername/fuelflow.git
cd fuelflow

# Add upstream remote
git remote add upstream https://github.com/original-owner/fuelflow.git
```

### 2. Create Development Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-name
# or
git checkout -b docs/documentation-update
```

### 3. Set Up Development Environment
```bash
cd server && npm install && npm run dev
cd ../client && npm install && npm run dev
```

---

## Development Workflow

### 1. Make Changes
- Keep commits focused and atomic
- Write clear commit messages
- Test your changes locally

### 2. Keep Branch Updated
```bash
git fetch upstream
git rebase upstream/main
```

### 3. Push to Your Fork
```bash
git push origin feature/your-feature-name
```

### 4. Create Pull Request
- Go to GitHub
- Click "Compare & pull request"
- Provide clear description
- Reference related issues

---

## Coding Standards

### JavaScript/React
```javascript
// ✅ Good
const handleUserUpdate = async (userId, data) => {
  try {
    const response = await api.patch(`/users/${userId}`, data);
    return response.data;
  } catch (error) {
    console.error('Update failed:', error);
    throw error;
  }
};

// ❌ Bad
function update(id, d) {
  return api.patch(`/users/${id}`, d);
}
```

### Naming Conventions
```javascript
// Components: PascalCase
function UserDashboard() {}

// Functions: camelCase
const getUserData = () => {}

// Constants: UPPER_SNAKE_CASE
const API_BASE_URL = 'http://localhost:5000/api';

// Boolean: isXxx, hasXxx, canXxx
const isLoading = false;
const hasError = true;
```

### File Organization
```
src/
├── components/        # React components
├── pages/            # Route pages
├── services/         # API services
├── hooks/            # Custom hooks
├── context/          # Context providers
├── utils/            # Utility functions
└── styles/           # Global styles
```

### ESLint & Prettier
```bash
# Check linting
npm run lint

# Fix linting issues
npm run lint -- --fix

# Format code
npm run format
```

---

## Commit Guidelines

### Format
```
type(scope): description

body (optional)

footer (optional)
```

### Types
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Code style (no logic changes)
- `refactor` - Code refactoring
- `test` - Adding tests
- `chore` - Build/dependency changes

### Examples
```bash
git commit -m "feat(auth): add JWT refresh token rotation"
git commit -m "fix(inventory): resolve low-stock alert calculation"
git commit -m "docs(README): update installation instructions"
git commit -m "refactor(payroll): optimize salary calculation logic"
```

---

## Pull Request Process

### 1. Before Submitting
- [ ] Code is tested locally
- [ ] All tests pass
- [ ] No console errors
- [ ] Code follows standards
- [ ] Commit messages are clear
- [ ] Documentation updated

### 2. PR Title
```
feat(module): Brief description
fix(module): Brief description
docs(module): Brief description
```

### 3. PR Description
```markdown
## Description
Brief explanation of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Manual testing done
- [ ] All tests pass
- [ ] No new warnings

## Screenshots (if UI change)
[Add screenshots here]

## Related Issues
Closes #123
```

### 4. Code Review
- Address feedback promptly
- Ask questions if unclear
- Update based on suggestions
- Re-request review when ready

---

## Testing

### Frontend Testing
```bash
# Run tests
npm test

# With coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

### Backend Testing
```bash
# Run tests
npm test

# Specific test
npm test -- attendance.test.js

# Coverage
npm test -- --coverage
```

### Manual Testing Checklist
- [ ] All CRUD operations work
- [ ] Error handling works
- [ ] Email notifications send
- [ ] Role-based access enforced
- [ ] Forms validate properly
- [ ] API responses correct
- [ ] Database operations successful
- [ ] No console errors

---

## Documentation

### Update README.md
- Features changed?
- New endpoints added?
- Dependencies updated?
- Update accordingly

### Update API Documentation
```markdown
### POST /api/users
Create a new user

**Request Body**
- name (string, required)
- email (string, required)
- role (string, required)

**Response**
```json
{
  "_id": "...",
  "name": "...",
  "email": "...",
  "role": "..."
}
```

### Code Comments
```javascript
// ✅ Good
// Calculate total with tax at 15%
const totalWithTax = amount * 1.15;

// ❌ Bad
// Multiply by 1.15
const x = a * 1.15;
```

---

## Reporting Issues

### Bug Report
```markdown
## Description
Clear description of the bug

## Steps to Reproduce
1. Click...
2. See...
3. Error...

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Screenshots/Logs
[Attach relevant information]

## Environment
- OS: Windows/Mac/Linux
- Browser: Chrome/Firefox
- Node version: 18.x
```

### Feature Request
```markdown
## Description
What feature would you like?

## Use Case
Why do you need this?

## Proposed Solution
How should it work?

## Alternatives Considered
Any other approaches?
```

---

## Code Review Checklist

Reviewers should check:

- [ ] Code quality and style
- [ ] Logic correctness
- [ ] Error handling
- [ ] Performance implications
- [ ] Security issues
- [ ] Test coverage
- [ ] Documentation completeness
- [ ] Breaking changes

---

## Development Tools

### Recommended VSCode Extensions
- ESLint
- Prettier
- MongoDB for VSCode
- REST Client
- Thunder Client
- GitLens

### Useful Commands

**Backend**
```bash
npm run dev          # Start dev server
npm run seed         # Load demo data
npm test             # Run tests
npm run lint         # Check linting
```

**Frontend**
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Check linting
```

---

## Getting Help

- **Docs**: Check [README.md](README.md) and [INSTALLATION.md](INSTALLATION.md)
- **Issues**: Search existing issues or create new one
- **Discussions**: GitHub Discussions for questions
- **Email**: support@fuelflow.com

---

## Community Guidelines

### Be Respectful
- Treat all community members with respect
- Welcome diverse perspectives
- No harassment or discrimination

### Be Helpful
- Answer questions patiently
- Help review PRs
- Share knowledge

### Be Professional
- Use clear language
- Be constructive in feedback
- Stay on topic

---

## Recognized Contributors

We recognize and appreciate all contributions! Contributors will be listed in:
- [CONTRIBUTORS.md](CONTRIBUTORS.md)
- GitHub sponsors
- Release notes

---

## License

By contributing to FuelFlow, you agree that your contributions will be licensed under the MIT License.

---

## Questions?

- 📖 Check [README.md](README.md)
- 🔧 See [INSTALLATION.md](INSTALLATION.md)
- 🚀 Read [DEPLOYMENT.md](DEPLOYMENT.md)
- 💬 Open GitHub Discussion

---

Thank you for contributing to FuelFlow! 🚀
