# Security Policy

## Reporting Security Vulnerabilities

**DO NOT** open public GitHub issues for security vulnerabilities.

### How to Report

Please report security vulnerabilities to: **security@fuelflow.com**

Include:
- Description of the vulnerability
- Affected versions
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

You should receive a response within 48 hours.

---

## Security Features

### Authentication & Authorization

- ✅ JWT-based authentication
- ✅ Bcryptjs password hashing (10 salt rounds)
- ✅ Secure password reset via email tokens
- ✅ Role-based access control (RBAC)
- ✅ Admin/Manager/Cashier/Employee role hierarchy

### Data Protection

- ✅ HTTPS/TLS encryption in transit
- ✅ MongoDB encryption at rest (Atlas)
- ✅ PII data validation with Zod
- ✅ SQL injection prevention (using Mongoose ODM)
- ✅ XSS protection via React sanitization

### API Security

- ✅ CORS properly configured
- ✅ Rate limiting on auth endpoints
- ✅ Request validation middleware
- ✅ Error handling without exposing internals
- ✅ Environment variables for sensitive data
- ✅ No hardcoded credentials

### Infrastructure Security

- ✅ Environment-specific configs
- ✅ Heroku Eco dynos with auto-scaling
- ✅ MongoDB Atlas with IP whitelisting
- ✅ Vercel with DDoS protection
- ✅ GitHub Actions for automated deployments

---

## Security Best Practices

### For Users

1. **Strong Passwords**
   - Use 12+ characters
   - Mix uppercase, lowercase, numbers, symbols
   - Never share your password

2. **Account Security**
   - Keep login credentials private
   - Log out when done
   - Use unique passwords across sites
   - Enable 2FA if available

3. **Data Handling**
   - Don't share sensitive reports
   - Clear cache on public computers
   - Use HTTPS-only connections

### For Developers

1. **Code Security**
   - Never commit secrets to git
   - Use environment variables
   - Validate all inputs
   - Sanitize outputs
   - Review dependencies regularly

2. **Dependency Management**
   ```bash
   # Check for vulnerabilities
   npm audit
   npm audit fix
   
   # Keep packages updated
   npm update
   ```

3. **Git Security**
   - Use SSH keys for authentication
   - Sign commits with GPG
   - Never push sensitive data
   - Use .gitignore properly

4. **Testing**
   - Write security tests
   - Test edge cases
   - Validate input/output
   - Check error handling

---

## Known Vulnerabilities

Currently: **None Known**

We regularly scan dependencies and monitor security advisories.

---

## Supported Versions

### Security Updates

| Version | Status | Support Until |
|---------|--------|----------------|
| 1.0.x   | Active | Dec 2025       |
| 0.9.x   | Deprecated | Jun 2024   |
| < 0.9   | EOL    | Ended          |

### Update Frequency

- Security patches: Within 24 hours of discovery
- Bug fixes: Within 1 week
- Features: Monthly release cycles

---

## Compliance

### Standards

- ✅ OWASP Top 10
- ✅ CWE/SANS Top 25
- ✅ NIST Cybersecurity Framework
- ✅ GDPR (EU data protection)

### Privacy

- Minimal data collection
- User consent for processing
- Data deletion on request
- Clear privacy policy

---

## Security Headers

The application includes:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'
Referrer-Policy: strict-origin-when-cross-origin
```

---

## Environment Variables

### Production Security

**Never commit these!** Use environment variables:

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<random-32-char-string>
JWT_EXPIRE=7d
BCRYPT_ROUNDS=10
SMTP_PASSWORD=<gmail-app-password>
CORS_ORIGIN=https://yourdomain.com
```

### Generate Secrets

```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate API keys
openssl rand -base64 32
```

---

## Dependency Audit

### Regular Checks

```bash
# Check current vulnerabilities
npm audit

# Auto-fix vulnerabilities
npm audit fix

# Force major version updates
npm audit fix --force

# Detailed report
npm audit --json
```

### Critical Packages

These packages are monitored closely:
- `express` - Web framework
- `mongoose` - Database ODM
- `jsonwebtoken` - Authentication
- `bcryptjs` - Password hashing
- `nodemailer` - Email service

---

## Incident Response

### Discovery Phase
- Vulnerability reported
- Acknowledge within 24 hours
- Assess severity and impact

### Response Phase
- Create security branch
- Develop patch
- Test thoroughly
- Prepare security release

### Recovery Phase
- Release patch
- Notify users (if needed)
- Post-incident review
- Documentation update

---

## Security Checklist

Before Deployment:

- [ ] All secrets in environment variables
- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] Input validation active
- [ ] Authentication required
- [ ] Authorization enforced
- [ ] Logging enabled
- [ ] Error handling safe
- [ ] Dependencies up to date
- [ ] Security tests pass

---

## Further Reading

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security](https://expressjs.com/en/advanced/best-practice-security.html)
- [MongoDB Security](https://docs.mongodb.com/manual/security/)

---

## Contact

**Security Issues**: security@fuelflow.com  
**General Questions**: support@fuelflow.com

---

**Last Updated**: December 2024  
**Version**: 1.0
