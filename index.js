const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

// load firebase credentials from serviceAccount.json if exists
const credPath = path.join(__dirname, 'serviceAccount.json');
if (fs.existsSync(credPath)) {
  admin.initializeApp({
    credential: admin.credential.cert(require(credPath))
  });
} else {
  console.warn('serviceAccount.json not found. Firebase features will be disabled.');
}

const remoteConfig = admin.remoteConfig ? admin.remoteConfig() : null;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));

// simplistic user roles
const users = {
  admin: { password: 'admin', role: 'admin' },
  viewer: { password: 'viewer', role: 'viewer' }
};

function ensureAuth(req, res, next) {
  if (req.session.user) return next();
  res.redirect('/login');
}

function ensureAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === 'admin') return next();
  res.status(403).send('Forbidden');
}

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users[username];
  if (user && user.password === password) {
    req.session.user = user;
    res.redirect('/');
  } else {
    res.render('login', { error: 'Invalid credentials' });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

app.get('/', ensureAuth, async (req, res) => {
  if (!remoteConfig) return res.send('Remote Config not initialized');
  const template = await remoteConfig.getTemplate();
  res.render('index', { template, user: req.session.user });
});

app.post('/update', ensureAuth, ensureAdmin, async (req, res) => {
  if (!remoteConfig) return res.sendStatus(500);
  const { parameters, parameterGroups, conditions } = req.body;
  try {
    const template = await remoteConfig.getTemplate();
    if (parameters) template.parameters = parameters;
    if (parameterGroups) template.parameterGroups = parameterGroups;
    if (conditions) template.conditions = conditions;
    await remoteConfig.validateTemplate(template);
    await remoteConfig.publishTemplate(template);
    res.redirect('/');
  } catch (e) {
    res.status(500).send(e.message);
  }
});

app.get('/revisions', ensureAuth, async (req, res) => {
  if (!remoteConfig) return res.sendStatus(500);
  try {
    const revisions = await remoteConfig.listVersions({ pageSize: 10 });
    res.render('revisions', { revisions: revisions.versions, user: req.session.user });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

app.post('/rollback', ensureAuth, ensureAdmin, async (req, res) => {
  if (!remoteConfig) return res.sendStatus(500);
  const { versionNumber } = req.body;
  try {
    await remoteConfig.rollback(versionNumber);
    res.redirect('/');
  } catch (e) {
    res.status(500).send(e.message);
  }
});

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));